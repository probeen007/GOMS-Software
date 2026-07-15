import express from 'express';
import { body, validationResult } from 'express-validator';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import Servicing from '../models/Servicing.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import LoyaltyLedger from '../models/LoyaltyLedger.js';
import InventoryStock from '../models/InventoryStock.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createNotification } from '../utils/notifier.js';
import { logAction } from '../utils/logger.js';
import { formatNepaliDate, formatNepaliDateTime } from '../utils/nepaliDate.js';
import { escapeHtml } from '../utils/htmlEscape.js';
import { isWithinSupportedDateRange } from '../utils/dateRange.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// @route   POST /api/invoices/generate
// @desc    Generate an invoice (VAT or Non-VAT) from a closed, unbilled servicing record
// @access  Private (admin, receptionist, accountant)
router.post(
  '/generate',
  authenticate,
  authorize('admin', 'receptionist', 'accountant'),
  [
    body('servicingId').notEmpty().withMessage('Servicing record ID is required'),
    body('invoiceType').isIn(['vat', 'non-vat']).withMessage('Invoice type must be vat or non-vat'),
    body('nextServiceDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Next service date must be a valid date')
      .bail()
      .custom((value) => isWithinSupportedDateRange(value))
      .withMessage('Next service date is outside the supported date range')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { servicingId, invoiceType, nextServiceDate } = req.body;

    try {
      const servicing = await Servicing.findById(servicingId);
      if (!servicing) {
        return res.status(404).json({ message: 'Servicing record not found' });
      }

      if (servicing.status !== 'closed') {
        return res.status(400).json({ message: 'Servicing record must be closed before generating an invoice' });
      }

      if (servicing.invoiceId) {
        return res.status(400).json({ message: 'This servicing record has already been invoiced' });
      }

      const settings = await Settings.findOne().lean();
      const vatRate = settings ? (settings.vatRate / 100) : 0.13;

      const subtotal = servicing.subtotal;
      const discount = servicing.discount || 0;
      const taxedBase = Math.max(0, subtotal - discount);
      const vat = invoiceType === 'vat' ? Math.round((taxedBase * vatRate) * 100) / 100 : 0;
      const total = taxedBase + vat;

      const invoice = new Invoice({
        servicingId: servicing._id,
        customerId: servicing.customerId,
        vehicleId: servicing.vehicleId,
        invoiceType,
        subtotal,
        discount,
        vat,
        total,
        amountPaid: 0,
        amountDue: total,
        status: 'unpaid',
        odometer: servicing.mileageOut || 0,
        nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : null
      });
      await invoice.save();

      servicing.invoiceId = invoice._id;
      await servicing.save();

      const customer = await Customer.findById(servicing.customerId).lean();

      await createNotification({
        recipientRoles: ['admin', 'accountant'],
        title: 'New Invoice Generated',
        message: `${invoiceType === 'vat' ? 'VAT' : 'Non-VAT'} invoice generated for ${customer?.name || 'Customer'} (Total: Rs. ${invoice.total.toFixed(2)})`,
        type: 'payment',
        link: '/invoices'
      });

      await logAction({
        req,
        action: 'invoice_generated',
        module: 'invoices',
        details: `Generated ${invoiceType.toUpperCase()} Invoice #${invoice.invoiceNo} from Servicing record #${servicing._id.toString().substring(18)} for client ${customer?.name || 'Customer'}. Total: Rs. ${invoice.total.toFixed(2)}`
      });

      const populated = await Invoice.findById(invoice._id)
        .populate('customerId', 'name phone email')
        .populate('vehicleId', 'plateNo make model')
        .lean();

      res.status(201).json(populated);
    } catch (err) {
      console.error('Generate invoice error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/invoices/pc-generate
// @desc    Create a Parts & Counter direct invoice (isPC: true, no Job Card required)
// @access  Private (admin, receptionist, accountant)
router.post(
  '/pc-generate',
  authenticate,
  authorize('admin', 'receptionist', 'accountant'),
  [
    body('customerId').notEmpty().withMessage('Customer is required'),
    body('invoiceType').isIn(['vat', 'non-vat']).withMessage('Invoice type must be vat or non-vat'),
    body('items').isArray({ min: 1 }).withMessage('Items list must contain at least 1 item'),
    body('items.*.name').notEmpty().withMessage('Item name is required'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be 1 or more'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be 0 or more'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),
    body('odometer').optional().isNumeric().withMessage('Odometer must be a number'),
    body('nextServiceDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Next service date must be a valid date')
      .bail()
      .custom((value) => isWithinSupportedDateRange(value))
      .withMessage('Next service date is outside the supported date range')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, vehicleId, invoiceType, items, discount, odometer, nextServiceDate } = req.body;

    try {
      const customer = await Customer.findById(customerId).lean();
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      if (vehicleId) {
        const vehicle = await Vehicle.findById(vehicleId).lean();
        if (!vehicle) {
          return res.status(404).json({ message: 'Vehicle not found' });
        }
      }

      // Check stock levels and decrement before writing database transactions
      // To ensure atomicity, we'll verify stock for all parts first.
      for (const item of items) {
        if (item.partId && (item.itemType === 'part' || !item.itemType)) {
          const part = await InventoryStock.findById(item.partId).lean();
          if (!part) {
            return res.status(404).json({ message: `Part not found in inventory stock: ${item.name}` });
          }
          if (part.qty < item.qty) {
            return res.status(400).json({
              message: `Insufficient stock for '${part.name}'. Requested: ${item.qty}, Available: ${part.qty}`
            });
          }
        }
      }

      // Decrement stock levels
      for (const item of items) {
        if (item.partId && (item.itemType === 'part' || !item.itemType)) {
          await InventoryStock.findByIdAndUpdate(item.partId, {
            $inc: { qty: -Number(item.qty) }
          });
        }
      }

      // Calculate financials
      let calculatedSubtotal = 0;
      const formattedItems = items.map(item => {
        const lineTotal = Number(item.qty) * Number(item.unitPrice);
        calculatedSubtotal += lineTotal;
        return {
          name: item.name,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
          total: lineTotal,
          itemType: item.itemType || 'part'
        };
      });

      const settings = await Settings.findOne().lean();
      const vatRate = settings ? (settings.vatRate / 100) : 0.13;

      const disc = Number(discount) || 0;
      const taxedBase = Math.max(0, calculatedSubtotal - disc);
      const vat = invoiceType === 'vat' ? Math.round((taxedBase * vatRate) * 100) / 100 : 0;
      const total = taxedBase + vat;

      const invoice = new Invoice({
        isPC: true,
        items: formattedItems,
        customerId,
        vehicleId: vehicleId || null,
        invoiceType,
        subtotal: calculatedSubtotal,
        discount: disc,
        vat,
        total,
        amountPaid: 0,
        amountDue: total,
        status: 'unpaid',
        odometer: Number(odometer) || 0,
        nextServiceDate: vehicleId && nextServiceDate ? new Date(nextServiceDate) : null
      });

      await invoice.save();

      await createNotification({
        recipientRoles: ['admin', 'accountant'],
        title: 'New PC Invoice Generated',
        message: `Direct Counter Invoice generated for ${customer.name} (Total: Rs. ${invoice.total.toFixed(2)})`,
        type: 'payment',
        link: '/invoices'
      });

      await logAction({
        req,
        action: 'pc_invoice_generated',
        module: 'invoices',
        details: `Generated direct PC Counter Invoice #${invoice.invoiceNo} for client ${customer.name}. Total: Rs. ${invoice.total.toFixed(2)}`
      });

      const populated = await Invoice.findById(invoice._id)
        .populate('customerId', 'name phone email')
        .populate('vehicleId', 'plateNo make model')
        .lean();

      res.status(201).json(populated);
    } catch (err) {
      console.error('Generate PC invoice error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


// @route   GET /api/invoices
// @desc    Get all invoices
// @access  Private (admin, receptionist, accountant)
router.get('/', authenticate, authorize('admin', 'receptionist', 'accountant'), async (req, res) => {
  try {
    const { status, search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) {
      query.status = status;
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      const [matchingCustomers, matchingVehicles] = await Promise.all([
        Customer.find({ name: regex, deletedAt: null }).select('_id').lean(),
        Vehicle.find({ $or: [{ plateNo: regex }, { make: regex }, { model: regex }] }).select('_id').lean()
      ]);
      query.$or = [
        { invoiceNo: regex },
        { customerId: { $in: matchingCustomers.map((c) => c._id) } },
        { vehicleId: { $in: matchingVehicles.map((v) => v._id) } }
      ];
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('customerId', 'name phone email')
        .populate('vehicleId', 'plateNo make model')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Invoice.countDocuments(query)
    ]);

    res.json({
      invoices,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error('Fetch invoices error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices/service-reminders
// @desc    Get all invoices with upcoming service reminders
// @access  Private (admin, receptionist)
router.get('/service-reminders', authenticate, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const invoices = await Invoice.find({ nextServiceDate: { $ne: null } })
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'plateNo make model')
      .sort({ nextServiceDate: 1 })
      .lean();

    res.json(invoices);
  } catch (err) {
    console.error('Fetch reminders error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/invoices/:id/service-reminder-sent
// @desc    Mark a service reminder as sent
// @access  Private (admin, receptionist)
router.post('/:id/service-reminder-sent', authenticate, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    invoice.reminderSent = true;
    await invoice.save();

    await logAction({
      req,
      action: 'service_reminder_sent',
      module: 'invoices',
      details: `Service reminder sent to ${req.body.customerName || 'client'} for vehicle ${req.body.plateNo || 'vehicle'}`
    });

    res.json({ success: true, invoice });
  } catch (err) {
    console.error('Mark reminder sent error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/invoices/:id/service-reminder
// @desc    Remove a service reminder from the worklist (clears nextServiceDate; does not touch the invoice/payment record)
// @access  Private (admin, receptionist)
router.delete('/:id/service-reminder', authenticate, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.nextServiceDate = null;
    invoice.reminderSent = false;
    await invoice.save();

    await logAction({
      req,
      action: 'service_reminder_deleted',
      module: 'invoices',
      details: `Service reminder removed for Invoice #${invoice.invoiceNo}`
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete reminder error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/invoices/:id
// @desc    Get detailed invoice and its payments
// @access  Private (admin, receptionist, accountant)
router.get('/:id', authenticate, authorize('admin', 'receptionist', 'accountant'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name phone email address loyaltyPoints')
      .populate('vehicleId', 'plateNo make model year colour')
      .populate({
        path: 'servicingId',
        select: 'parts labour findings'
      })
      .lean();

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Find all payments linked to this invoice
    const payments = await Payment.find({ invoiceId: invoice._id })
      .populate('receivedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ invoice, payments });
  } catch (err) {
    console.error('Fetch invoice by ID error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/invoices/:id/payments
// @desc    Record a customer payment against an invoice
// @access  Private (admin, receptionist, accountant)
router.post(
  '/:id/payments',
  authenticate,
  authorize('admin', 'receptionist', 'accountant'),
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Payment amount must be greater than zero'),
    body('method').isIn(['cash', 'card', 'fonepay', 'bank-transfer']).withMessage('Invalid payment method'),
    body('reference').optional().trim(),
    body('nextServiceDate')
      .optional({ checkFalsy: true })
      .isISO8601().withMessage('Next service date must be a valid date')
      .bail()
      .custom(isWithinSupportedDateRange).withMessage('Next service date is out of the supported range')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { amount, method, reference } = req.body;

    try {
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (invoice.status === 'paid') {
        return res.status(400).json({ message: 'Invoice is already fully paid' });
      }

      const pAmt = parseFloat(amount);
      if (pAmt > invoice.amountDue) {
        return res.status(400).json({
          message: `Payment amount (Rs. ${pAmt}) exceeds remaining balance due (Rs. ${invoice.amountDue})`
        });
      }

      // Record the payment
      const payment = new Payment({
        invoiceId: invoice._id,
        amount: pAmt,
        method,
        reference,
        receivedBy: req.user.id
      });
      await payment.save();

      // Update Invoice financials
      invoice.amountPaid += pAmt;
      const totalCredits = invoice.creditNotes.reduce((sum, note) => sum + note.amount, 0);
      invoice.amountDue = Math.max(0, invoice.total - invoice.amountPaid - totalCredits);
      
      if (invoice.amountDue === 0) {
        invoice.status = 'paid';
      } else {
        invoice.status = 'partially-paid';
      }

      // Handle next service date & WhatsApp/SMS reminders
      if (req.body.nextServiceDate) {
        invoice.nextServiceDate = new Date(req.body.nextServiceDate);
      }
      if (req.body.sendWhatsApp) {
        invoice.reminderSent = true;
      }

      await invoice.save();

      // Write to audit log
      await logAction({
        req,
        action: 'invoice_payment',
        module: 'invoices',
        details: `Payment of Rs. ${pAmt.toFixed(2)} recorded for Invoice #${invoice.invoiceNo}. Status: ${invoice.status.toUpperCase()}.${req.body.nextServiceDate ? ` Next service scheduled: ${formatNepaliDate(req.body.nextServiceDate)}.` : ''}${req.body.sendWhatsApp ? ' WhatsApp reminder simulated.' : ''}`
      });

      // Auto-trigger loyalty points if invoice becomes fully paid (only if loyalty system is enabled)
      if (invoice.status === 'paid') {
        const loyaltySettings = await Settings.findOne().lean();
        if (loyaltySettings?.loyaltySystemEnabled !== false) {
          const pointsEarned = Math.floor(invoice.total / 10); // 1 point per Rs. 10
          if (pointsEarned > 0) {
            const ledger = new LoyaltyLedger({
              customerId: invoice.customerId,
              invoiceId: invoice._id,
              points: pointsEarned,
              transactionType: 'earned',
              notes: `Points earned from Invoice #${invoice.invoiceNo}`
            });
            await ledger.save();

            await Customer.findByIdAndUpdate(invoice.customerId, {
              $inc: { loyaltyPoints: pointsEarned }
            });
          }
        }
      }

      // Send notifications
      const customer = await Customer.findById(invoice.customerId).lean();
      await createNotification({
        recipientRoles: ['admin', 'accountant'],
        title: 'Payment Received',
        message: `Payment of Rs. ${pAmt.toFixed(2)} received for Invoice #${invoice.invoiceNo} (${method}).`,
        type: 'payment',
        link: '/invoices'
      });

      await createNotification({
        recipientRoles: ['admin', 'receptionist'],
        title: 'Vehicle Release Authorization',
        message: `Invoice #${invoice.invoiceNo} for ${customer?.name || 'Customer'} is now ${invoice.status.toUpperCase()}.`,
        type: 'payment',
        link: '/invoices'
      });

      res.status(201).json({ invoice, payment });
    } catch (err) {
      console.error('Record payment error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/invoices/:id/credit-note
// @desc    Issue a credit note against an invoice
// @access  Private (admin, accountant)
router.post(
  '/:id/credit-note',
  authenticate,
  authorize('admin', 'accountant'),
  [
    body('reason').notEmpty().withMessage('Reason is required').trim(),
    body('amount').isFloat({ min: 0.01 }).withMessage('Credit note amount must be positive')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reason, amount } = req.body;

    try {
      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      const crAmt = parseFloat(amount);
      if (crAmt > invoice.amountDue) {
        return res.status(400).json({
          message: `Credit note amount (Rs. ${crAmt}) cannot exceed remaining amount due (Rs. ${invoice.amountDue})`
        });
      }

      invoice.creditNotes.push({
        reason,
        amount: crAmt,
        createdAt: new Date()
      });

      // Reduce total invoice balance and due amount
      invoice.amountDue = Math.max(0, invoice.amountDue - crAmt);
      if (invoice.amountDue === 0) {
        invoice.status = invoice.amountPaid > 0 ? 'paid' : 'credited';
      }

      await invoice.save();

      // Write to audit log
      await logAction({
        req,
        action: 'credit_note_issued',
        module: 'invoices',
        details: `Credit note of Rs. ${crAmt.toFixed(2)} issued for Invoice #${invoice.invoiceNo}. Reason: ${reason}`
      });

      res.json(invoice);
    } catch (err) {
      console.error('Issue credit note error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/invoices/:id/redeem-points
// @desc    Redeem loyalty points against invoice balance
// @access  Private (admin, receptionist, accountant)
router.post(
  '/:id/redeem-points',
  authenticate,
  authorize('admin', 'receptionist', 'accountant'),
  [
    body('points').isInt({ min: 1 }).withMessage('Must redeem at least 1 point')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { points } = req.body;

    try {
      // Check if loyalty system is enabled before allowing redemption
      const loyaltySettings = await Settings.findOne().lean();
      if (loyaltySettings?.loyaltySystemEnabled === false) {
        return res.status(403).json({ message: 'Loyalty points system is currently disabled in global settings.' });
      }

      const invoice = await Invoice.findById(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      if (invoice.status === 'paid' || invoice.status === 'credited') {
        return res.status(400).json({ message: 'Invoice is already settled' });
      }

      const customer = await Customer.findById(invoice.customerId);
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      if (customer.loyaltyPoints < points) {
        return res.status(400).json({
          message: `Insufficient loyalty points. Customer balance: ${customer.loyaltyPoints}, requested redemption: ${points}`
        });
      }

      // Conversion: 1 point = Rs. 1 discount
      const discountValue = points;
      if (discountValue > invoice.amountDue) {
        return res.status(400).json({
          message: `Redemption value (Rs. ${discountValue}) exceeds invoice amount due (Rs. ${invoice.amountDue})`
        });
      }

      // Deduct points from Customer
      customer.loyaltyPoints -= points;
      await customer.save();

      // Log to Loyalty Ledger
      const ledger = new LoyaltyLedger({
        customerId: customer._id,
        invoiceId: invoice._id,
        points: -points,
        transactionType: 'redeemed',
        notes: `Points redeemed against Invoice #${invoice.invoiceNo}`
      });
      await ledger.save();

      // Log credit note against invoice
      invoice.creditNotes.push({
        reason: `Redeemed ${points} loyalty points`,
        amount: discountValue,
        createdAt: new Date()
      });

      invoice.amountDue = Math.max(0, invoice.amountDue - discountValue);
      if (invoice.amountDue === 0) {
        invoice.status = 'paid';
      }

      await invoice.save();

      // Write to audit log
      await logAction({
        req,
        action: 'loyalty_redemption',
        module: 'loyalty',
        details: `Redeemed ${points} points (Rs. ${discountValue.toFixed(2)} value) against Invoice #${invoice.invoiceNo} for customer ${customer.name}`
      });

      res.json({ invoice, customer, ledger });
    } catch (err) {
      console.error('Redeem points error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);
// @desc    Generate printable HTML Invoice
// @access  Private (admin, receptionist, accountant)
router.get('/:id/pdf', authenticate, authorize('admin', 'receptionist', 'accountant'), async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('vehicleId', 'plateNo make model year colour')
      .populate({
        path: 'servicingId',
        select: 'parts labour'
      })
      .lean();

    if (!invoice) {
      return res.status(404).send('Invoice not found');
    }

    const payments = await Payment.find({ invoiceId: invoice._id })
      .populate('receivedBy', 'name')
      .lean();

    const settings = await Settings.findOne().lean();
    const garageName = settings ? settings.garageName.toUpperCase() : 'PM AUTOMOBILES';
    const garageAddress = settings ? settings.garageAddress : 'Kathmandu, Nepal';
    const garagePhone = settings ? settings.garagePhone : '+977-1-4444444';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.invoiceNo}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #10b981; }
          .title { text-align: right; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 45px; }
          .section-title { font-size: 12px; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f9fafb; border-bottom: 2px solid #eee; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #666; }
          td { border-bottom: 1px solid #eee; padding: 12px; font-size: 13px; }
          .totals { width: 40%; margin-left: auto; text-align: right; font-size: 14px; margin-bottom: 30px; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #eee; padding-top: 10px; color: #10b981; }
          .footer { text-align: center; margin-top: 60px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          .badge { inline-block; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; border: 1px solid #eee; }
          .badge-paid { background: #d1fae5; color: #065f46; border-color: #a7f3d0; }
          .badge-unpaid { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
          ${invoice.isPC ? `
          @page {
            size: A5 portrait;
            margin: 8mm;
          }
          body {
            margin: 15px;
            font-size: 11px;
          }
          .logo {
            font-size: 18px;
          }
          .grand-total {
            font-size: 14px;
          }
          table {
            margin-bottom: 15px;
          }
          td, th {
            padding: 6px;
            font-size: 11px;
          }
          .header {
            margin-bottom: 15px;
            padding-bottom: 10px;
          }
          .grid {
            margin-bottom: 15px;
            gap: 15px;
          }
          .footer {
            margin-top: 25px;
            padding-top: 10px;
          }
          ` : ''}
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Invoice</button>
        </div>

        <div class="header">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="/assets/logo.png" style="height: 50px; width: 50px; object-fit: contain;" alt="Logo" />
            <div>
              <div class="logo" style="line-height: 1.1;">${escapeHtml(garageName)}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">${escapeHtml(garageAddress)} | Phone: ${escapeHtml(garagePhone)}</div>
            </div>
          </div>
          <div class="title">
            <h2 style="margin: 0; color: #10b981;">${invoice.invoiceType === 'vat' ? 'OFFICIAL TAX INVOICE (VAT)' : 'OFFICIAL INVOICE (NON-VAT)'}</h2>
            <div style="font-size: 13px; color: #555; margin-top: 5px;">Invoice No: ${invoice.invoiceNo}</div>
            <div style="font-size: 12px; color: #888;">Date: ${formatNepaliDate(invoice.createdAt)}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="section-title">Invoiced To</div>
            <strong>Name:</strong> ${escapeHtml(invoice.customerId?.name) || 'N/A'}<br>
            <strong>Phone:</strong> ${escapeHtml(invoice.customerId?.phone) || 'N/A'}<br>
            <strong>Email:</strong> ${escapeHtml(invoice.customerId?.email) || 'N/A'}<br>
            <strong>Address:</strong> ${escapeHtml(invoice.customerId?.address) || 'N/A'}
          </div>
          <div>
            <div class="section-title">Vehicle & Reference Details</div>
            ${invoice.isPC ? `
              <strong>Billing Type:</strong> Parts & Counter Sales<br>
              ${invoice.vehicleId ? `
                <strong>Make / Model:</strong> ${escapeHtml(invoice.vehicleId?.make)} ${escapeHtml(invoice.vehicleId?.model)}<br>
                <strong>Plate No:</strong> ${escapeHtml(invoice.vehicleId?.plateNo) || 'N/A'}<br>
                <strong>Odometer:</strong> ${invoice.odometer ? invoice.odometer + ' km' : 'N/A'}
              ` : '<strong>PC counter sale (No Vehicle)</strong>'}
            ` : `
              <strong>Servicing Record ID:</strong> ${invoice.servicingId?._id || 'N/A'}<br>
              <strong>Make / Model:</strong> ${escapeHtml(invoice.vehicleId?.make)} ${escapeHtml(invoice.vehicleId?.model)}<br>
              <strong>Plate No:</strong> ${escapeHtml(invoice.vehicleId?.plateNo) || 'N/A'}<br>
              <strong>Odometer:</strong> ${invoice.odometer ? invoice.odometer + ' km' : 'N/A'}
            `}
          </div>
        </div>

        <h3>Billable Spares & Labour Details</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th style="text-align: center;">Qty / Hours</th>
              <th style="text-align: right;">Unit Rate</th>
              <th style="text-align: right;">Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.isPC ? (
              invoice.items.map(item => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td><span style="font-size: 10px; color: #888; text-transform: uppercase;">${escapeHtml(item.itemType)}</span></td>
                  <td style="text-align: center;">${item.qty}</td>
                  <td style="text-align: right;">Rs. ${item.unitPrice.toFixed(2)}</td>
                  <td style="text-align: right;">Rs. ${item.total.toFixed(2)}</td>
                </tr>
              `).join('')
            ) : `
              ${invoice.servicingId?.parts.map(p => `
                <tr>
                  <td>${escapeHtml(p.name)}</td>
                  <td><span style="font-size: 10px; color: #888; text-transform: uppercase;">Part</span></td>
                  <td style="text-align: center;">${p.qty}</td>
                  <td style="text-align: right;">Rs. ${p.unitPrice.toFixed(2)}</td>
                  <td style="text-align: right;">Rs. ${p.total.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
              ${invoice.servicingId?.labour.map(l => `
                <tr>
                  <td>${escapeHtml(l.name)}</td>
                  <td><span style="font-size: 10px; color: #888; text-transform: uppercase;">Labour</span></td>
                  <td style="text-align: center;">${l.hours} hrs</td>
                  <td style="text-align: right;">Rs. ${l.unitPrice.toFixed(2)}</td>
                  <td style="text-align: right;">Rs. ${l.total.toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            `}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <strong>Rs. ${invoice.subtotal.toFixed(2)}</strong>
          </div>
          <div>
            <span>Discount Applied:</span>
            <strong>-Rs. ${invoice.discount.toFixed(2)}</strong>
          </div>
          ${invoice.invoiceType === 'vat' ? `
          <div>
            <span>VAT (13%):</span>
            <strong>Rs. ${invoice.vat.toFixed(2)}</strong>
          </div>` : ''}
          <div class="grand-total">
            <span>Total Payable:</span>
            <span>Rs. ${invoice.total.toFixed(2)}</span>
          </div>
          <div style="font-size: 12px; color: #555; border-top: 1px dashed #eee; padding-top: 5px;">
            <span>Amount Paid:</span>
            <span>Rs. ${invoice.amountPaid.toFixed(2)}</span>
          </div>
          <div style="font-size: 12px; color: #dd5555;">
            <span>Amount Due:</span>
            <strong>Rs. ${invoice.amountDue.toFixed(2)}</strong>
          </div>
        </div>

        ${payments.length > 0 ? `
          <h3>Payment Transactions Log</h3>
          <table>
            <thead>
              <tr>
                <th>Transaction Date</th>
                <th>Payment Mode</th>
                <th>Reference Details</th>
                <th style="text-align: right;">Amount Logged</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${formatNepaliDateTime(p.createdAt)}</td>
                  <td><span style="text-transform: uppercase; font-size: 11px;">${escapeHtml(p.method)}</span></td>
                  <td>${escapeHtml(p.reference) || 'N/A'}</td>
                  <td style="text-align: right; font-weight: bold;">Rs. ${p.amount.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <p>This is a computer-generated tax invoice. No signature required.</p>
          <p>&copy; ${new Date().getFullYear()} PM Auto Mobiles. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    res.send(htmlContent);
  } catch (err) {
    console.error('Invoice print template error:', err.message);
    res.status(500).send('Server error');
  }
});

export default router;
