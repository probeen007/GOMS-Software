import express from 'express';
import { body, validationResult } from 'express-validator';
import Servicing from '../models/Servicing.js';
import InventoryStock from '../models/InventoryStock.js';
import Appointment from '../models/Appointment.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createNotification } from '../utils/notifier.js';
import { logAction } from '../utils/logger.js';
import { formatNepaliDate } from '../utils/nepaliDate.js';
import { escapeHtml } from '../utils/htmlEscape.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// Helper to recalculate Servicing pricing totals
const recalculateServicingTotals = (record) => {
  let subtotal = 0;

  record.parts.forEach(part => {
    subtotal += part.total;
  });

  record.labour.forEach(labour => {
    subtotal += labour.total;
  });

  const discVal = record.discount || 0;
  const taxedBase = subtotal - discVal;

  // Apply 13% VAT standard if subtotal is positive and no VAT is specified
  const vatPct = 13;
  const vatVal = Math.max(0, taxedBase * (vatPct / 100));

  record.subtotal = subtotal;
  record.vat = vatVal;
  record.total = Math.max(0, taxedBase + vatVal);
};

// @route   GET /api/servicing/unbilled
// @desc    Get closed servicing records that have not yet been invoiced
// @access  Private (admin, receptionist, accountant)
router.get('/unbilled', authenticate, authorize('admin', 'receptionist', 'accountant'), async (req, res) => {
  try {
    const records = await Servicing.find({ status: 'closed', invoiceId: null })
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'plateNo make model')
      .sort({ closedAt: -1 });

    res.json(records);
  } catch (err) {
    console.error('Fetch unbilled servicing records error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/servicing/search
// @desc    Search service records by vehicle plate number, customer name, or customer phone
// @access  Private (admin, receptionist, technician, accountant)
router.get('/search', authenticate, authorize('admin', 'receptionist', 'technician', 'accountant'), async (req, res) => {
  try {
    const { q, by } = req.query;
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const term = q.trim();
    const regex = { $regex: term, $options: 'i' };

    let customerIds = null;
    let vehicleIds = null;

    if (by === 'customer-name') {
      const customers = await Customer.find({ name: regex, deletedAt: null }).select('_id');
      customerIds = customers.map(c => c._id);
    } else if (by === 'customer-phone') {
      const customers = await Customer.find({ phone: regex, deletedAt: null }).select('_id');
      customerIds = customers.map(c => c._id);
    } else if (by === 'vehicle-number') {
      const vehicles = await Vehicle.find({ plateNo: regex }).select('_id');
      vehicleIds = vehicles.map(v => v._id);
    } else {
      // No field specified: search across all three
      const [customers, vehicles] = await Promise.all([
        Customer.find({ $or: [{ name: regex }, { phone: regex }], deletedAt: null }).select('_id'),
        Vehicle.find({ plateNo: regex }).select('_id')
      ]);
      customerIds = customers.map(c => c._id);
      vehicleIds = vehicles.map(v => v._id);
    }

    const orConditions = [];
    if (customerIds) orConditions.push({ customerId: { $in: customerIds } });
    if (vehicleIds) orConditions.push({ vehicleId: { $in: vehicleIds } });

    if (orConditions.length === 0) {
      return res.json([]);
    }

    const records = await Servicing.find({ $or: orConditions })
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'plateNo make model')
      .sort({ createdAt: -1 });

    res.json(records);
  } catch (err) {
    console.error('Search servicing records error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/servicing
// @desc    Get all servicing records
// @access  Private (admin, receptionist, technician, accountant)
router.get('/', authenticate, authorize('admin', 'receptionist', 'technician', 'accountant'), async (req, res) => {
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
        Customer.find({ name: regex, deletedAt: null }).select('_id'),
        Vehicle.find({ $or: [{ plateNo: regex }, { make: regex }, { model: regex }] }).select('_id')
      ]);
      query.$or = [
        { customerId: { $in: matchingCustomers.map((c) => c._id) } },
        { vehicleId: { $in: matchingVehicles.map((v) => v._id) } }
      ];
    }

    const [records, total] = await Promise.all([
      Servicing.find(query)
        .populate('customerId', 'name phone email')
        .populate('vehicleId', 'plateNo make model year')
        .populate({
          path: 'appointmentId',
          populate: { path: 'technicianId', select: 'name' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Servicing.countDocuments(query)
    ]);

    res.json({
      records,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (err) {
    console.error('Fetch servicing records error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/servicing/:id
// @desc    Get specific servicing record by ID
// @access  Private (admin, receptionist, technician, accountant)
router.get('/:id', authenticate, authorize('admin', 'receptionist', 'technician', 'accountant'), async (req, res) => {
  try {
    const record = await Servicing.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('vehicleId', 'plateNo make model year colour')
      .populate({
        path: 'appointmentId',
        populate: { path: 'technicianId', select: 'name' }
      });

    if (!record) {
      return res.status(404).json({ message: 'Servicing record not found' });
    }

    res.json(record);
  } catch (err) {
    console.error('Fetch servicing record error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/servicing
// @desc    Create a new open servicing record for a customer's vehicle
// @access  Private (admin, receptionist, technician)
router.post(
  '/',
  authenticate,
  authorize('admin', 'receptionist', 'technician'),
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('appointmentId').optional({ checkFalsy: true }),
    body('findings').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, vehicleId, appointmentId, findings } = req.body;

    try {
      const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      const vehicle = await Vehicle.findOne({ _id: vehicleId, customerId: customer._id });
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not registered to this customer' });
      }

      const record = new Servicing({
        customerId: customer._id,
        vehicleId: vehicle._id,
        appointmentId: appointmentId || null,
        findings: findings || '',
        status: 'open'
      });

      await record.save();

      if (record.appointmentId) {
        await Appointment.findByIdAndUpdate(record.appointmentId, { status: 'in-progress' });
      }

      await logAction({
        req,
        action: 'servicing_created',
        module: 'servicing',
        details: `Opened servicing record for ${customer.name} (Vehicle: ${vehicle.plateNo})`
      });

      const populated = await Servicing.findById(record._id)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'plateNo make model');

      res.status(201).json(populated);
    } catch (err) {
      console.error('Create servicing record error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/servicing/:id/parts
// @desc    Allocate parts from inventory to a servicing record (Decrements stock)
// @access  Private (admin, receptionist, technician)
router.post(
  '/:id/parts',
  authenticate,
  authorize('admin', 'receptionist', 'technician'),
  [
    body('partId').notEmpty().withMessage('Part ID is required'),
    body('qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { partId, qty } = req.body;

    try {
      const record = await Servicing.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Servicing record not found' });
      }

      if (record.status === 'closed') {
        return res.status(400).json({ message: 'Cannot add parts to a closed servicing record' });
      }

      const part = await InventoryStock.findById(partId);
      if (!part) {
        return res.status(404).json({ message: 'Part not found in inventory stock' });
      }

      if (part.qty < qty) {
        return res.status(400).json({
          message: `Insufficient stock. Requested: ${qty}, Available in stock: ${part.qty}`
        });
      }

      part.qty -= qty;
      await part.save();

      const itemTotal = qty * part.unitPrice;

      const existingPartIndex = record.parts.findIndex(p => p.partId.toString() === partId);
      if (existingPartIndex > -1) {
        record.parts[existingPartIndex].qty += qty;
        record.parts[existingPartIndex].total = record.parts[existingPartIndex].qty * record.parts[existingPartIndex].unitPrice;
      } else {
        record.parts.push({
          partId: part._id,
          name: part.name,
          qty,
          unitPrice: part.unitPrice,
          total: itemTotal
        });
      }

      recalculateServicingTotals(record);
      await record.save();

      const populated = await Servicing.findById(record._id)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'plateNo make model');

      await logAction({
        req,
        action: 'servicing_parts_added',
        module: 'servicing',
        details: `Allocated ${qty} x ${part.name} to Servicing record #${record._id.toString().substring(18)} (Customer: ${populated?.customerId?.name || 'N/A'})`
      });

      res.json(populated);
    } catch (err) {
      console.error('Add parts to servicing record error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/servicing/:id/labour
// @desc    Add labor hours to a servicing record
// @access  Private (admin, receptionist, technician)
router.post(
  '/:id/labour',
  authenticate,
  authorize('admin', 'receptionist', 'technician'),
  [
    body('name').notEmpty().withMessage('Labour task description is required').trim(),
    body('hours').isFloat({ min: 0.1 }).withMessage('Hours must be greater than 0'),
    body('unitPrice').isFloat({ min: 0 }).withMessage('Labour rate must be positive')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, hours, unitPrice } = req.body;

    try {
      const record = await Servicing.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Servicing record not found' });
      }

      if (record.status === 'closed') {
        return res.status(400).json({ message: 'Cannot add labour to a closed servicing record' });
      }

      const itemTotal = Number(hours) * Number(unitPrice);
      record.labour.push({
        name,
        hours: Number(hours),
        unitPrice: Number(unitPrice),
        total: itemTotal
      });

      recalculateServicingTotals(record);
      await record.save();

      const populated = await Servicing.findById(record._id)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'plateNo make model');

      await logAction({
        req,
        action: 'servicing_labour_added',
        module: 'servicing',
        details: `Added labor task "${name}" (${hours} hrs @ Rs. ${unitPrice}/hr) to Servicing record #${record._id.toString().substring(18)} (Customer: ${populated?.customerId?.name || 'N/A'})`
      });

      res.json(populated);
    } catch (err) {
      console.error('Add labour to servicing record error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PATCH /api/servicing/:id/close
// @desc    Close a servicing record (ready to be invoiced)
// @access  Private (admin, receptionist)
router.patch(
  '/:id/close',
  authenticate,
  authorize('admin', 'receptionist'),
  [
    body('mileageOut').optional().isInt({ min: 0 }).withMessage('Mileage out must be a positive number'),
    body('findings').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mileageOut, findings } = req.body;

    try {
      const record = await Servicing.findById(req.params.id);
      if (!record) {
        return res.status(404).json({ message: 'Servicing record not found' });
      }

      if (record.status === 'closed') {
        return res.status(400).json({ message: 'Servicing record is already closed' });
      }

      record.status = 'closed';
      record.closedAt = new Date();
      if (mileageOut) record.mileageOut = mileageOut;
      if (findings) record.findings = findings;

      await record.save();

      if (record.appointmentId) {
        await Appointment.findByIdAndUpdate(record.appointmentId, { status: 'completed' });
      }

      const customer = await Customer.findById(record.customerId);
      const appointment = record.appointmentId ? await Appointment.findById(record.appointmentId) : null;

      await createNotification({
        recipientRoles: ['admin', 'receptionist', 'accountant'],
        title: 'Servicing Closed',
        message: `Servicing record for client ${customer?.name || 'Customer'} has been closed. Ready to generate invoice.`,
        type: 'servicing',
        link: '/invoices'
      });

      if (appointment && appointment.technicianId) {
        await createNotification({
          recipientId: appointment.technicianId,
          title: 'Servicing Closed',
          message: `The servicing record you worked on for ${customer?.name || 'Customer'} has been closed.`,
          type: 'servicing',
          link: '/servicing'
        });
      }

      await logAction({
        req,
        action: 'servicing_closed',
        module: 'servicing',
        details: `Closed servicing record #${record._id.toString().substring(18)} for client ${customer?.name || 'Customer'}. Total: Rs. ${record.total.toFixed(2)}`
      });

      res.json(record);
    } catch (err) {
      console.error('Close servicing record error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/servicing/:id/pdf
// @desc    Generate printable HTML worksheet for a servicing record
// @access  Private (admin, receptionist, technician, accountant)
router.get('/:id/pdf', authenticate, authorize('admin', 'receptionist', 'technician', 'accountant'), async (req, res) => {
  try {
    const record = await Servicing.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('vehicleId', 'plateNo make model year colour')
      .populate({
        path: 'appointmentId',
        populate: { path: 'technicianId', select: 'name' }
      });

    if (!record) {
      return res.status(404).send('Servicing record not found');
    }

    const settings = await Settings.findOne();
    const garageName = settings ? settings.garageName.toUpperCase() : 'PM AUTOMOBILES';
    const garageAddress = settings ? settings.garageAddress : 'Kathmandu, Nepal';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Servicing Record #${record._id}</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 40px; line-height: 1.6; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
          .title { text-align: right; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 40px; }
          .section-title { font-size: 12px; text-transform: uppercase; color: #888; font-weight: bold; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #f9fafb; border-bottom: 2px solid #eee; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; color: #666; }
          td { border-bottom: 1px solid #eee; padding: 12px; font-size: 13px; }
          .footer { text-align: center; margin-top: 60px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 20px; text-align: right;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Service Sheet</button>
        </div>

        <div class="header">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="/assets/logo.png" style="height: 50px; width: 50px; object-fit: contain;" alt="Logo" />
            <div>
              <div class="logo" style="line-height: 1.1;">${escapeHtml(garageName)}</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">${escapeHtml(garageAddress)} | Service Worksheet</div>
            </div>
          </div>
          <div class="title">
            <h2 style="margin: 0; color: #6366f1;">SERVICING WORK SHEET</h2>
            <div style="font-size: 13px; color: #555; margin-top: 5px;">Record ID: ${record._id}</div>
            <div style="font-size: 12px; color: #888;">Status: ${record.status.toUpperCase()} | Opened: ${formatNepaliDate(record.createdAt)}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="section-title">Client Details</div>
            <strong>Name:</strong> ${escapeHtml(record.customerId?.name) || 'N/A'}<br>
            <strong>Phone:</strong> ${escapeHtml(record.customerId?.phone) || 'N/A'}<br>
            <strong>Email:</strong> ${escapeHtml(record.customerId?.email) || 'N/A'}
          </div>
          <div>
            <div class="section-title">Vehicle Specs</div>
            <strong>Make / Model:</strong> ${escapeHtml(record.vehicleId?.make)} ${escapeHtml(record.vehicleId?.model)}<br>
            <strong>Plate No:</strong> ${escapeHtml(record.vehicleId?.plateNo) || 'N/A'}<br>
            <strong>Colour / Year:</strong> ${escapeHtml(record.vehicleId?.colour)} / ${escapeHtml(record.vehicleId?.year)}
          </div>
        </div>

        <div style="margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 6px;">
          <div class="section-title">Technician Findings & Diagnoses</div>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">${escapeHtml(record.findings) || 'No diagnoses recorded yet.'}</p>
        </div>

        <h3>Allocated Spare Parts</h3>
        <table>
          <thead>
            <tr>
              <th>Part Name</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Rate</th>
              <th style="text-align: right;">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${record.parts.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #888;">No spare parts allocated yet.</td></tr>' : record.parts.map(p => `
              <tr>
                <td>${escapeHtml(p.name)}</td>
                <td style="text-align: center;">${p.qty}</td>
                <td style="text-align: right;">Rs. ${p.unitPrice.toFixed(2)}</td>
                <td style="text-align: right;">Rs. ${p.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h3>Labor & Servicing Operations</h3>
        <table>
          <thead>
            <tr>
              <th>Task Operations Description</th>
              <th style="text-align: center;">Billing Hours</th>
              <th style="text-align: right;">Hourly Rate</th>
              <th style="text-align: right;">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${record.labour.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #888;">No labor recorded yet.</td></tr>' : record.labour.map(l => `
              <tr>
                <td>${escapeHtml(l.name)}</td>
                <td style="text-align: center;">${l.hours} hrs</td>
                <td style="text-align: right;">Rs. ${l.unitPrice.toFixed(2)}</td>
                <td style="text-align: right;">Rs. ${l.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>PM Automobiles Auto-Services System. Customer copy on vehicle release.</p>
          <p>&copy; ${new Date().getFullYear()} PM Auto Mobiles. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    res.send(htmlContent);
  } catch (err) {
    console.error('Servicing sheet print template error:', err.message);
    res.status(500).send('Server error');
  }
});

export default router;
