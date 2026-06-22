import express from 'express';
import { body, validationResult } from 'express-validator';
import Quotation from '../models/Quotation.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import InventoryStock from '../models/InventoryStock.js';
import JobCard from '../models/JobCard.js';
import Appointment from '../models/Appointment.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createNotification } from '../utils/notifier.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// Helper to compile a JobCard from an approved Quotation
const createJobCardFromQuotation = async (quotation, req = null) => {
  const existing = await JobCard.findOne({ quotationId: quotation._id });
  if (existing) return;

  const parts = [];
  const labour = [];

  quotation.items.forEach(item => {
    if (item.type === 'part') {
      parts.push({
        partId: item.partId,
        name: item.name,
        qty: item.qty,
        unitPrice: item.unitPrice,
        total: item.total
      });
    } else {
      labour.push({
        name: item.name,
        hours: item.qty, // Map quantity as billable hours
        unitPrice: item.unitPrice,
        total: item.total
      });
    }
  });

  const jobCard = new JobCard({
    quotationId: quotation._id,
    customerId: quotation.customerId,
    vehicleId: quotation.vehicleId,
    appointmentId: quotation.appointmentId,
    parts,
    labour,
    subtotal: quotation.subtotal,
    discount: quotation.discount,
    vat: quotation.vat,
    total: quotation.total,
    status: 'open'
  });

  await jobCard.save();

  // Write to audit log
  await logAction({
    req,
    action: 'job_card_created',
    module: 'job-cards',
    details: `Job Card created from approved Quotation (ID: ${quotation._id}). Status: OPEN`
  });

  // Mark linked appointment as in-progress
  if (quotation.appointmentId) {
    await Appointment.findByIdAndUpdate(quotation.appointmentId, { status: 'in-progress' });
  }

  // Send notifications
  const customer = await Customer.findById(quotation.customerId);
  await createNotification({
    recipientRoles: ['admin', 'receptionist', 'technician'],
    title: 'Quotation Approved & Job Card Opened',
    message: `Quotation approved for ${customer?.name || 'Customer'}. Job Card #${jobCard._id.toString().substring(18)} is open.`,
    type: 'job-card',
    link: '/job-cards'
  });
};

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// @route   GET /api/quotations/public/:token
// @desc    Fetch quotation details for public approval
// @access  Public
router.get('/public/:token', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ approvalToken: req.params.token })
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'plateNo make model year colour');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (err) {
    console.error('Fetch public quotation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quotations/public/:token/approve
// @desc    Approve quotation public link
// @access  Public
router.post('/public/:token/approve', async (req, res) => {
  try {
    const quotation = await Quotation.findOne({ approvalToken: req.params.token });
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (quotation.status === 'approved') {
      return res.status(400).json({ message: 'Quotation is already approved' });
    }

    quotation.status = 'approved';
    quotation.approvedAt = new Date();
    await quotation.save();

    // Write audit log
    await logAction({
      req,
      action: 'quotation_approved',
      module: 'quotations',
      details: `Quotation approved via public customer portal (ID: ${quotation._id})`
    });

    // Trigger auto-creation
    await createJobCardFromQuotation(quotation, req);

    res.json({ message: 'Quotation successfully approved', status: quotation.status });
  } catch (err) {
    console.error('Approve quotation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quotations/public/:token/reject
// @desc    Reject quotation public link
// @access  Public
router.post('/public/:token/reject', async (req, res) => {
  const { reason } = req.body;

  try {
    const quotation = await Quotation.findOne({ approvalToken: req.params.token });
    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    if (quotation.status === 'rejected') {
      return res.status(400).json({ message: 'Quotation is already rejected' });
    }

    quotation.status = 'rejected';
    quotation.rejectionReason = reason || 'Declined by customer';
    quotation.rejectedAt = new Date();
    await quotation.save();

    // Write audit log
    await logAction({
      req,
      action: 'quotation_declined',
      module: 'quotations',
      details: `Quotation declined via public customer portal (ID: ${quotation._id}). Reason: ${quotation.rejectionReason}`
    });

    // Send notifications to admins/receptionists
    const customer = await Customer.findById(quotation.customerId);
    await createNotification({
      recipientRoles: ['admin', 'receptionist'],
      title: 'Quotation Declined',
      message: `Quotation for ${customer?.name || 'Customer'} was declined. Reason: ${quotation.rejectionReason}`,
      type: 'quotation',
      link: '/quotations'
    });

    res.json({ message: 'Quotation successfully declined', status: quotation.status });
  } catch (err) {
    console.error('Reject quotation error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// PRIVATE ROUTES (Authentication required)
// ==========================================

// @route   GET /api/quotations
// @desc    Get all quotations
// @access  Private (admin, receptionist, accountant, technician)
router.get('/', authenticate, authorize('admin', 'receptionist', 'accountant', 'technician'), async (req, res) => {
  try {
    const quotations = await Quotation.find()
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'plateNo make model year')
      .sort({ createdAt: -1 });

    res.json(quotations);
  } catch (err) {
    console.error('Fetch quotations error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/quotations/:id
// @desc    Get specific quotation by ID
// @access  Private (admin, receptionist, accountant, technician)
router.get('/:id', authenticate, authorize('admin', 'receptionist', 'accountant', 'technician'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('vehicleId', 'plateNo make model year colour engineNo chassisNo');

    if (!quotation) {
      return res.status(404).json({ message: 'Quotation not found' });
    }

    res.json(quotation);
  } catch (err) {
    console.error('Fetch quotation by id error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/quotations
// @desc    Create a new repair quotation
// @access  Private (admin, receptionist, accountant)
router.post(
  '/',
  authenticate,
  authorize('admin', 'receptionist', 'accountant'),
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least 1 line item is required'),
    body('items.*.type').isIn(['part', 'labour']).withMessage('Item type must be part or labour'),
    body('items.*.name').notEmpty().withMessage('Item description is required'),
    body('items.*.qty').isInt({ min: 1 }).withMessage('Item quantity must be 1 or more'),
    body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be a positive number'),
    body('discount').optional().isFloat({ min: 0 }).withMessage('Discount cannot be negative'),
    body('vat').optional().isFloat({ min: 0 }).withMessage('VAT cannot be negative')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, vehicleId, appointmentId, items, discount, vat } = req.body;

    try {
      // 1. Verify customer and vehicle
      const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const vehicle = await Vehicle.findOne({ _id: vehicleId, customerId: customer._id });
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not registered to this customer' });
      }

      // 2. Compute pricing math
      let subtotal = 0;
      const formattedItems = items.map((item) => {
        const itemTotal = Number(item.qty) * Number(item.unitPrice);
        subtotal += itemTotal;
        return {
          type: item.type,
          partId: item.partId || null,
          name: item.name,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
          total: itemTotal
        };
      });

      const discVal = Number(discount) || 0;
      const vatPct = Number(vat) || 0; // VAT percentage, e.g. 13%
      const taxedBase = subtotal - discVal;
      const vatVal = Math.max(0, taxedBase * (vatPct / 100));
      const total = Math.max(0, taxedBase + vatVal);

      // 3. Save Quotation
      const quotation = new Quotation({
        customerId: customer._id,
        vehicleId: vehicle._id,
        appointmentId: appointmentId || null,
        items: formattedItems,
        subtotal,
        discount: discVal,
        vat: vatVal, // Store computed VAT value
        total,
        status: 'draft'
      });

      await quotation.save();

      // Write to audit log
      await logAction({
        req,
        action: 'quotation_created',
        module: 'quotations',
        details: `Created repair estimate/quotation (ID: ${quotation._id}) for customer ${customer.name}. Total: Rs. ${quotation.total.toFixed(2)}`
      });

      res.status(201).json(quotation);
    } catch (err) {
      console.error('Create quotation error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PATCH /api/quotations/:id
// @desc    Update quotation details or set status
// @access  Private (admin, receptionist, accountant)
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'receptionist', 'accountant'),
  [
    body('items').optional().isArray({ min: 1 }).withMessage('Items list must contain at least 1 item'),
    body('discount').optional().isFloat({ min: 0 }),
    body('vat').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(['draft', 'sent', 'approved', 'rejected']).withMessage('Invalid status')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const quotation = await Quotation.findById(req.params.id);
      if (!quotation) {
        return res.status(404).json({ message: 'Quotation not found' });
      }

      // Update status if present
      if (req.body.status) {
        quotation.status = req.body.status;
        if (req.body.status === 'approved') quotation.approvedAt = new Date();
        if (req.body.status === 'rejected') quotation.rejectedAt = new Date();
      }

      // Recalculate if items or discount/vat are supplied
      if (req.body.items || req.body.discount !== undefined || req.body.vat !== undefined) {
        const itemsList = req.body.items || quotation.items;
        let subtotal = 0;

        const formattedItems = itemsList.map((item) => {
          const itemTotal = Number(item.qty) * Number(item.unitPrice);
          subtotal += itemTotal;
          return {
            type: item.type,
            partId: item.partId || null,
            name: item.name,
            qty: Number(item.qty),
            unitPrice: Number(item.unitPrice),
            total: itemTotal
          };
        });

        const discVal = req.body.discount !== undefined ? Number(req.body.discount) : quotation.discount;
        const vatPct = req.body.vat !== undefined ? Number(req.body.vat) : 13; // default VAT percentage if recalculating
        const taxedBase = subtotal - discVal;
        const vatVal = Math.max(0, taxedBase * (vatPct / 100));
        const total = Math.max(0, taxedBase + vatVal);

        quotation.items = formattedItems;
        quotation.subtotal = subtotal;
        quotation.discount = discVal;
        quotation.vat = vatVal;
        quotation.total = total;
      }

      await quotation.save();

      // Write audit log
      await logAction({
        req,
        action: req.body.status ? `quotation_${req.body.status}` : 'quotation_updated',
        module: 'quotations',
        details: `Quotation ID: ${quotation._id} was updated/modified.`
      });

      if (req.body.status === 'approved') {
        await createJobCardFromQuotation(quotation, req);
      } else if (req.body.status === 'rejected') {
        const customer = await Customer.findById(quotation.customerId);
        await createNotification({
          recipientRoles: ['admin', 'receptionist'],
          title: 'Quotation Declined',
          message: `Quotation for ${customer?.name || 'Customer'} was declined.`,
          type: 'quotation',
          link: '/quotations'
        });
      }

      res.json(quotation);
    } catch (err) {
      console.error('Update quotation error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/quotations/:id/pdf
// @desc    Generate a clean printable HTML invoice layout for printing
// @access  Private (admin, receptionist, accountant, technician)
router.get('/:id/pdf', authenticate, authorize('admin', 'receptionist', 'accountant', 'technician'), async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('vehicleId', 'plateNo make model year colour');

    if (!quotation) {
      return res.status(404).send('Quotation not found');
    }

    // Return a clean, standalone, printable HTML document
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation #${quotation._id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .title { text-align: right; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .section-title { font-size: 12px; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f9fafb; border-bottom: 2px solid #eee; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #666; }
          td { border-bottom: 1px solid #eee; padding: 12px; font-size: 14px; }
          .totals { width: 40%; margin-left: auto; text-align: right; font-size: 14px; }
          .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand-total { font-size: 18px; font-weight: bold; border-top: 2px solid #eee; padding-top: 10px; color: #4f46e5; }
          .footer { text-align: center; margin-top: 60px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Invoice / Save as PDF</button>
        </div>

        <div class="header">
          <div>
            <div class="logo">DRIVESYNC AUTOMOTIVE</div>
            <div style="font-size: 12px; color: #666;">Kathmandu, Nepal | Phone: +977-1-4444444</div>
          </div>
          <div class="title">
            <h2 style="margin: 0; color: #4f46e5;">ESTIMATE / QUOTATION</h2>
            <div style="font-size: 13px; color: #555; margin-top: 5px;">Quote Reference: ${quotation._id}</div>
            <div style="font-size: 12px; color: #888;">Date: ${new Date(quotation.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="section-title">Client Information</div>
            <strong>Name:</strong> ${quotation.customerId?.name || 'N/A'}<br>
            <strong>Phone:</strong> ${quotation.customerId?.phone || 'N/A'}<br>
            <strong>Email:</strong> ${quotation.customerId?.email || 'N/A'}<br>
            <strong>Address:</strong> ${quotation.customerId?.address || 'N/A'}
          </div>
          <div>
            <div class="section-title">Vehicle Specifications</div>
            <strong>Make / Model:</strong> ${quotation.vehicleId?.make} ${quotation.vehicleId?.model}<br>
            <strong>Plate No:</strong> ${quotation.vehicleId?.plateNo || 'N/A'}<br>
            <strong>Year / Color:</strong> ${quotation.vehicleId?.year} / ${quotation.vehicleId?.colour || 'N/A'}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total Price</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td><span style="font-size: 11px; text-transform: uppercase; color: #888;">${item.type}</span></td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">Rs. ${item.unitPrice.toFixed(2)}</td>
                <td style="text-align: right;">Rs. ${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div>
            <span>Subtotal:</span>
            <strong>Rs. ${quotation.subtotal.toFixed(2)}</strong>
          </div>
          <div>
            <span>Discount Applied:</span>
            <strong>-Rs. ${quotation.discount.toFixed(2)}</strong>
          </div>
          <div>
            <span>VAT (13%):</span>
            <strong>Rs. ${quotation.vat.toFixed(2)}</strong>
          </div>
          <div class="grand-total">
            <span>Estimated Total:</span>
            <span>Rs. ${quotation.total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing DriveSync Automotive. This is a repair estimate valid for 30 days from date of issuance.</p>
          <p>&copy; ${new Date().getFullYear()} DriveSync. All rights reserved.</p>
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
