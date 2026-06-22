import express from 'express';
import { body, validationResult } from 'express-validator';
import JobCard from '../models/JobCard.js';
import InventoryStock from '../models/InventoryStock.js';
import Appointment from '../models/Appointment.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import Invoice from '../models/Invoice.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createNotification } from '../utils/notifier.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// Helper to recalculate JobCard pricing totals
const recalculateJobCardTotals = (jobCard) => {
  let subtotal = 0;

  jobCard.parts.forEach(part => {
    subtotal += part.total;
  });

  jobCard.labour.forEach(labour => {
    subtotal += labour.total;
  });

  const discVal = jobCard.discount || 0;
  const taxedBase = subtotal - discVal;
  
  // Apply 13% VAT standard if subtotal is positive and no VAT is specified
  const vatPct = 13;
  const vatVal = Math.max(0, taxedBase * (vatPct / 100));
  
  jobCard.subtotal = subtotal;
  jobCard.vat = vatVal;
  jobCard.total = Math.max(0, taxedBase + vatVal);
};

// @route   GET /api/job-cards
// @desc    Get all job cards
// @access  Private (admin, receptionist, technician, accountant)
router.get('/', authenticate, authorize('admin', 'receptionist', 'technician', 'accountant'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};

    if (status) {
      query.status = status;
    }

    // Technicians can only see job cards for their assigned appointments
    if (req.user.role === 'technician') {
      const appointments = await Appointment.find({ technicianId: req.user.id }).select('_id');
      const apptIds = appointments.map(a => a._id);
      query.appointmentId = { $in: apptIds };
    }

    const jobCards = await JobCard.find(query)
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'plateNo make model year')
      .populate({
        path: 'appointmentId',
        populate: { path: 'technicianId', select: 'name' }
      })
      .sort({ createdAt: -1 });

    res.json(jobCards);
  } catch (err) {
    console.error('Fetch job cards error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/job-cards/:id
// @desc    Get specific job card by ID
// @access  Private (admin, receptionist, technician, accountant)
router.get('/:id', authenticate, authorize('admin', 'receptionist', 'technician', 'accountant'), async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('vehicleId', 'plateNo make model year colour')
      .populate({
        path: 'appointmentId',
        populate: { path: 'technicianId', select: 'name' }
      });

    if (!jobCard) {
      return res.status(404).json({ message: 'Job Card not found' });
    }

    res.json(jobCard);
  } catch (err) {
    console.error('Fetch job card error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/job-cards/:id/parts
// @desc    Allocate parts from inventory to a job card (Decrements stock)
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
      const jobCard = await JobCard.findById(req.params.id);
      if (!jobCard) {
        return res.status(404).json({ message: 'Job Card not found' });
      }

      if (jobCard.status === 'closed') {
        return res.status(400).json({ message: 'Cannot add parts to a closed Job Card' });
      }

      // Check inventory stock levels
      const part = await InventoryStock.findById(partId);
      if (!part) {
        return res.status(404).json({ message: 'Part not found in inventory stock' });
      }

      if (part.qty < qty) {
        return res.status(400).json({
          message: `Insufficient stock. Requested: ${qty}, Available in stock: ${part.qty}`
        });
      }

      // Deduct inventory
      part.qty -= qty;
      await part.save();

      // Add to Job Card
      const itemTotal = qty * part.unitPrice;
      
      // Check if part already allocated, if so increment quantity
      const existingPartIndex = jobCard.parts.findIndex(p => p.partId.toString() === partId);
      if (existingPartIndex > -1) {
        jobCard.parts[existingPartIndex].qty += qty;
        jobCard.parts[existingPartIndex].total = jobCard.parts[existingPartIndex].qty * jobCard.parts[existingPartIndex].unitPrice;
      } else {
        jobCard.parts.push({
          partId: part._id,
          name: part.name,
          qty,
          unitPrice: part.unitPrice,
          total: itemTotal
        });
      }

      recalculateJobCardTotals(jobCard);
      await jobCard.save();

      const populated = await JobCard.findById(jobCard._id)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'plateNo make model');

      // Write to audit log
      await logAction({
        req,
        action: 'job_card_parts_added',
        module: 'job-cards',
        details: `Allocated ${qty} x ${part.name} to Job Card #${jobCard._id.toString().substring(18)} (Customer: ${populated?.customerId?.name || 'N/A'})`
      });

      res.json(populated);
    } catch (err) {
      console.error('Add parts to job card error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/job-cards/:id/labour
// @desc    Add labor hours to a job card
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
      const jobCard = await JobCard.findById(req.params.id);
      if (!jobCard) {
        return res.status(404).json({ message: 'Job Card not found' });
      }

      if (jobCard.status === 'closed') {
        return res.status(400).json({ message: 'Cannot add labour to a closed Job Card' });
      }

      const itemTotal = Number(hours) * Number(unitPrice);
      jobCard.labour.push({
        name,
        hours: Number(hours),
        unitPrice: Number(unitPrice),
        total: itemTotal
      });

      recalculateJobCardTotals(jobCard);
      await jobCard.save();

      const populated = await JobCard.findById(jobCard._id)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'plateNo make model');

      // Write to audit log
      await logAction({
        req,
        action: 'job_card_labour_added',
        module: 'job-cards',
        details: `Added labor task "${name}" (${hours} hrs @ Rs. ${unitPrice}/hr) to Job Card #${jobCard._id.toString().substring(18)} (Customer: ${populated?.customerId?.name || 'N/A'})`
      });

      res.json(populated);
    } catch (err) {
      console.error('Add labour to job card error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PATCH /api/job-cards/:id/close
// @desc    Close a job card
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
      const jobCard = await JobCard.findById(req.params.id);
      if (!jobCard) {
        return res.status(404).json({ message: 'Job Card not found' });
      }

      if (jobCard.status === 'closed') {
        return res.status(400).json({ message: 'Job Card is already closed' });
      }

      jobCard.status = 'closed';
      jobCard.closedAt = new Date();
      if (mileageOut) jobCard.mileageOut = mileageOut;
      if (findings) jobCard.findings = findings;

      await jobCard.save();

      // Update linked appointment status to completed
      if (jobCard.appointmentId) {
        await Appointment.findByIdAndUpdate(jobCard.appointmentId, { status: 'completed' });
      }

      // Auto-generate invoice
      const invoice = new Invoice({
        jobCardId: jobCard._id,
        customerId: jobCard.customerId,
        vehicleId: jobCard.vehicleId,
        subtotal: jobCard.subtotal,
        discount: jobCard.discount,
        vat: jobCard.vat,
        total: jobCard.total,
        amountPaid: 0,
        amountDue: jobCard.total,
        status: 'unpaid'
      });
      await invoice.save();

      // Send notifications
      const customer = await Customer.findById(jobCard.customerId);
      const appointment = jobCard.appointmentId ? await Appointment.findById(jobCard.appointmentId) : null;

      await createNotification({
        recipientRoles: ['admin', 'receptionist'],
        title: 'Job Card Closed',
        message: `Job Card for client ${customer?.name || 'Customer'} has been closed.`,
        type: 'job-card',
        link: '/job-cards'
      });

      if (appointment && appointment.technicianId) {
        await createNotification({
          recipientId: appointment.technicianId,
          title: 'Job Card Closed',
          message: `The job card you worked on for ${customer?.name || 'Customer'} has been closed.`,
          type: 'job-card',
          link: '/job-cards'
        });
      }

      await createNotification({
        recipientRoles: ['admin', 'accountant'],
        title: 'New Invoice Generated',
        message: `Invoice generated for ${customer?.name || 'Customer'} (Total: Rs. ${invoice.total.toFixed(2)})`,
        type: 'payment',
        link: '/invoices'
      });

      // Write to audit log
      await logAction({
        req,
        action: 'job_card_closed',
        module: 'job-cards',
        details: `Closed Job Card #${jobCard._id.toString().substring(18)} for client ${customer?.name || 'Customer'}. Auto-generated Invoice #${invoice._id}. Total: Rs. ${invoice.total.toFixed(2)}`
      });

      res.json(jobCard);
    } catch (err) {
      console.error('Close job card error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   GET /api/job-cards/:id/pdf
// @desc    Generate printable HTML worksheet for Job Card
// @access  Private (admin, receptionist, technician, accountant)
router.get('/:id/pdf', authenticate, authorize('admin', 'receptionist', 'technician', 'accountant'), async (req, res) => {
  try {
    const jobCard = await JobCard.findById(req.params.id)
      .populate('customerId', 'name phone email address')
      .populate('vehicleId', 'plateNo make model year colour')
      .populate({
        path: 'appointmentId',
        populate: { path: 'technicianId', select: 'name' }
      });

    if (!jobCard) {
      return res.status(404).send('Job Card not found');
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Job Card #${jobCard._id}</title>
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
          <button onclick="window.print()" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">Print Job Sheet</button>
        </div>

        <div class="header">
          <div>
            <div class="logo">DRIVESYNC WORKSHOP</div>
            <div style="font-size: 12px; color: #666;">Kathmandu, Nepal | Job Worksheet</div>
          </div>
          <div class="title">
            <h2 style="margin: 0; color: #6366f1;">JOB CARD / WORK SHEET</h2>
            <div style="font-size: 13px; color: #555; margin-top: 5px;">Card ID: ${jobCard._id}</div>
            <div style="font-size: 12px; color: #888;">Status: ${jobCard.status.toUpperCase()} | Opened: ${new Date(jobCard.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        <div class="grid">
          <div>
            <div class="section-title">Client Details</div>
            <strong>Name:</strong> ${jobCard.customerId?.name || 'N/A'}<br>
            <strong>Phone:</strong> ${jobCard.customerId?.phone || 'N/A'}<br>
            <strong>Email:</strong> ${jobCard.customerId?.email || 'N/A'}
          </div>
          <div>
            <div class="section-title">Vehicle Specs</div>
            <strong>Make / Model:</strong> ${jobCard.vehicleId?.make} ${jobCard.vehicleId?.model}<br>
            <strong>Plate No:</strong> ${jobCard.vehicleId?.plateNo || 'N/A'}<br>
            <strong>Colour / Year:</strong> ${jobCard.vehicleId?.colour} / ${jobCard.vehicleId?.year}
          </div>
        </div>

        <div style="margin-bottom: 30px; background: #f9fafb; padding: 15px; border-radius: 6px;">
          <div class="section-title">Technician Findings & Diagnoses</div>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #555;">${jobCard.findings || 'No diagnoses recorded yet.'}</p>
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
            ${jobCard.parts.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #888;">No spare parts allocated yet.</td></tr>' : jobCard.parts.map(p => `
              <tr>
                <td>${p.name}</td>
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
            ${jobCard.labour.length === 0 ? '<tr><td colspan="4" style="text-align: center; color: #888;">No labor recorded yet.</td></tr>' : jobCard.labour.map(l => `
              <tr>
                <td>${l.name}</td>
                <td style="text-align: center;">${l.hours} hrs</td>
                <td style="text-align: right;">Rs. ${l.unitPrice.toFixed(2)}</td>
                <td style="text-align: right;">Rs. ${l.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>DriveSync Automotive Services System. Customer copy on vehicle release.</p>
          <p>&copy; ${new Date().getFullYear()} DriveSync. All rights reserved.</p>
        </div>
      </body>
      </html>
    `;

    res.send(htmlContent);
  } catch (err) {
    console.error('Job sheet print template error:', err.message);
    res.status(500).send('Server error');
  }
});

export default router;
