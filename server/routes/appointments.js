import express from 'express';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Appointment from '../models/Appointment.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createNotification } from '../utils/notifier.js';
import { logAction } from '../utils/logger.js';

const router = express.Router();

// ES module compatibility for uploads path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');

// Ensure uploads folder exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'checkin-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, PNG, and WEBP image files are allowed.'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// @route   GET /api/appointments/technicians
// @desc    Fetch all registered technicians
// @access  Private (admin, receptionist)
router.get('/technicians', authenticate, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const techs = await User.find({ role: 'technician', isActive: true }).select('name email');
    res.json(techs);
  } catch (err) {
    console.error('Fetch technicians error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/appointments
// @desc    Get all appointments (with optional date & status filtering)
// @access  Private (admin, receptionist, technician)
router.get('/', authenticate, authorize('admin', 'receptionist', 'technician'), async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    let query = {};

    // Date range filter
    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) {
        query.dateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.dateTime.$lte = end;
      }
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Technicians can only view their own assigned appointments
    if (req.user.role === 'technician') {
      query.technicianId = req.user.id;
    }

    const appointments = await Appointment.find(query)
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'plateNo make model year colour')
      .populate('technicianId', 'name email')
      .sort({ dateTime: 1 });

    res.json(appointments);
  } catch (err) {
    console.error('Fetch appointments error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/appointments
// @desc    Create a new appointment booking with double-booking check
// @access  Private (admin, receptionist)
router.post(
  '/',
  authenticate,
  authorize('admin', 'receptionist'),
  [
    body('customerId').notEmpty().withMessage('Customer ID is required'),
    body('vehicleId').notEmpty().withMessage('Vehicle ID is required'),
    body('technicianId').notEmpty().withMessage('Technician assignment is required'),
    body('dateTime').notEmpty().withMessage('Appointment date and time is required').isISO8601().withMessage('Please enter a valid ISO date'),
    body('serviceType').notEmpty().withMessage('Service type is required').trim(),
    body('note').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customerId, vehicleId, technicianId, dateTime, serviceType, note } = req.body;

    try {
      // 1. Verify customer exists
      const customer = await Customer.findOne({ _id: customerId, deletedAt: null });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // 2. Verify vehicle exists and belongs to the customer
      const vehicle = await Vehicle.findOne({ _id: vehicleId, customerId: customer._id });
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not registered to this customer' });
      }

      // 3. Verify technician exists and is a technician
      const technician = await User.findOne({ _id: technicianId, role: 'technician', isActive: true });
      if (!technician) {
        return res.status(404).json({ message: 'Technician not found or inactive' });
      }

      // 4. Double-Booking Check: Verify slot availability for the technician
      // We define a 1-hour service duration block. Tech cannot have other active appointments in [dateTime - 59 mins, dateTime + 59 mins]
      const apptTime = new Date(dateTime);
      const minTime = new Date(apptTime.getTime() - 59 * 60 * 1000);
      const maxTime = new Date(apptTime.getTime() + 59 * 60 * 1000);

      const conflict = await Appointment.findOne({
        technicianId: technician._id,
        status: { $in: ['scheduled', 'checked-in', 'in-progress'] },
        dateTime: { $gte: minTime, $lte: maxTime }
      });

      if (conflict) {
        const conflictTime = new Date(conflict.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return res.status(400).json({
          message: `Double-Booking Warning: Technician ${technician.name} is already booked for another appointment at ${conflictTime}.`
        });
      }

      // 5. Save Appointment
      const appointment = new Appointment({
        customerId: customer._id,
        vehicleId: vehicle._id,
        technicianId: technician._id,
        dateTime: apptTime,
        serviceType,
        note: note || '',
        status: 'scheduled'
      });

      await appointment.save();

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('customerId', 'name phone')
        .populate('vehicleId', 'plateNo make model year')
        .populate('technicianId', 'name');

      // Send in-app notifications
      await createNotification({
        recipientId: populatedAppointment.technicianId._id,
        title: 'New Appointment Assigned',
        message: `You have been assigned to service ${populatedAppointment.vehicleId.make} ${populatedAppointment.vehicleId.model} for ${populatedAppointment.customerId.name} at ${new Date(populatedAppointment.dateTime).toLocaleString()}`,
        type: 'appointment',
        link: '/appointments'
      });

      await createNotification({
        recipientRoles: ['admin', 'receptionist'],
        title: 'New Appointment Scheduled',
        message: `Appointment scheduled for ${populatedAppointment.customerId.name} (${populatedAppointment.vehicleId.plateNo})`,
        type: 'appointment',
        link: '/appointments'
      });

      // Write to audit log
      await logAction({
        req,
        action: 'appointment_created',
        module: 'appointments',
        details: `Scheduled appointment for ${populatedAppointment.customerId.name} (${populatedAppointment.vehicleId.plateNo}) with tech ${populatedAppointment.technicianId.name} on ${new Date(populatedAppointment.dateTime).toLocaleString()}`
      });

      res.status(201).json(populatedAppointment);
    } catch (err) {
      console.error('Create appointment error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   PATCH /api/appointments/:id
// @desc    Update appointment details or transition status
// @access  Private (admin, receptionist, technician)
router.patch(
  '/:id',
  authenticate,
  authorize('admin', 'receptionist', 'technician'),
  [
    body('dateTime').optional().isISO8601().withMessage('Please enter a valid ISO date'),
    body('serviceType').optional().notEmpty().withMessage('Service type cannot be empty').trim(),
    body('status').optional().isIn(['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
    body('note').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Technician authorization constraint
      if (req.user.role === 'technician' && req.body.status) {
        const allowedTechStatuses = ['in-progress', 'completed'];
        if (!allowedTechStatuses.includes(req.body.status)) {
          return res.status(453).json({ message: 'Technicians are only permitted to transition status to in-progress or completed.' });
        }
      }

      const previousStatus = appointment.status;

      const fields = ['dateTime', 'serviceType', 'status', 'note'];
      fields.forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === 'dateTime') {
            appointment[field] = new Date(req.body[field]);
          } else {
            appointment[field] = req.body[field];
          }
        }
      });

      await appointment.save();

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('customerId', 'name phone email')
        .populate('vehicleId', 'plateNo make model year colour')
        .populate('technicianId', 'name email');

      // Send status change notifications
      if (req.body.status && req.body.status !== previousStatus) {
        if (req.body.status === 'cancelled') {
          await createNotification({
            recipientId: populatedAppointment.technicianId._id,
            title: 'Appointment Cancelled',
            message: `Your assigned service for ${populatedAppointment.customerId.name} has been cancelled.`,
            type: 'appointment',
            link: '/appointments'
          });

          await createNotification({
            recipientRoles: ['admin', 'receptionist'],
            title: 'Appointment Cancelled',
            message: `Appointment for ${populatedAppointment.customerId.name} (${populatedAppointment.vehicleId.plateNo}) was cancelled.`,
            type: 'appointment',
            link: '/appointments'
          });
        } else if (req.body.status === 'completed') {
          await createNotification({
            recipientRoles: ['admin', 'receptionist'],
            title: 'Appointment Completed',
            message: `Appointment for ${populatedAppointment.customerId.name} (${populatedAppointment.vehicleId.plateNo}) is completed.`,
            type: 'appointment',
            link: '/appointments'
          });
        }
      }

      // Write to audit log
      await logAction({
        req,
        action: req.body.status ? `appointment_${req.body.status}` : 'appointment_updated',
        module: 'appointments',
        details: `Updated appointment (ID: ${populatedAppointment._id}) for ${populatedAppointment.customerId.name}. Previous Status: ${previousStatus.toUpperCase()}, New Status: ${populatedAppointment.status.toUpperCase()}`
      });

      res.json(populatedAppointment);
    } catch (err) {
      console.error('Update appointment error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   POST /api/appointments/:id/checkin
// @desc    Check in a vehicle, record mileage, intake condition notes, and upload inspection photos
// @access  Private (admin, receptionist)
router.post(
  '/:id/checkin',
  authenticate,
  authorize('admin', 'receptionist'),
  upload.array('photos', 5),
  async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      const { mileageIn, conditionNotes } = req.body;
      if (!mileageIn) {
        return res.status(400).json({ message: 'Mileage-in value is required for check-in' });
      }

      // Format uploaded filenames to URLs
      const photoUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

      appointment.checkIn = {
        mileageIn: parseInt(mileageIn),
        conditionNotes: conditionNotes || '',
        photos: photoUrls
      };

      appointment.status = 'checked-in';
      await appointment.save();

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('customerId', 'name phone email')
        .populate('vehicleId', 'plateNo make model year colour')
        .populate('technicianId', 'name email');

      // Send notifications
      await createNotification({
        recipientId: populatedAppointment.technicianId._id,
        title: 'Vehicle Checked-In',
        message: `Vehicle ${populatedAppointment.vehicleId.make} ${populatedAppointment.vehicleId.model} (${populatedAppointment.vehicleId.plateNo}) is checked in and ready for service.`,
        type: 'appointment',
        link: '/job-cards'
      });

      await createNotification({
        recipientRoles: ['admin', 'receptionist'],
        title: 'Vehicle Checked-In',
        message: `Client ${populatedAppointment.customerId.name} vehicle ${populatedAppointment.vehicleId.plateNo} checked in.`,
        type: 'appointment',
        link: '/appointments'
      });

      // Write to audit log
      await logAction({
        req,
        action: 'appointment_checked_in',
        module: 'appointments',
        details: `Checked in vehicle ${populatedAppointment.vehicleId.plateNo} for customer ${populatedAppointment.customerId.name}. Intake Mileage: ${populatedAppointment.checkIn?.mileageIn || 0} km.`
      });

      res.json(populatedAppointment);
    } catch (err) {
      console.error('Check-in error:', err.message);
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }
);

export default router;
