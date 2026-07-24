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
import Servicing from '../models/Servicing.js';
import WebBooking from '../models/WebBooking.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createNotification } from '../utils/notifier.js';
import { logAction } from '../utils/logger.js';
import { formatNepaliTime, formatNepaliDateTime } from '../utils/nepaliDate.js';
import { isWithinSupportedDateRange } from '../utils/dateRange.js';

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

// @route   POST /api/appointments/public
// @desc    Public appointment booking from main website
// @access  Public
router.post(
  '/public',
  [
    body('fullName').notEmpty().withMessage('Full name is required').trim(),
    body('phone').notEmpty().withMessage('Phone number is required').trim(),
    body('vehicleMake').notEmpty().withMessage('Vehicle make is required').trim(),
    body('vehicleModel').notEmpty().withMessage('Vehicle model is required').trim(),
    body('service').notEmpty().withMessage('Service required is required').trim(),
    body('preferredDate').notEmpty().withMessage('Preferred date is required')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      fullName,
      phone,
      email,
      vehicleMake,
      vehicleModel,
      year,
      service,
      preferredDate,
      preferredTime,
      additionalNotes
    } = req.body;

    try {
      // 1. Find or create customer by phone
      let customer = await Customer.findOne({ phone, deletedAt: null });
      if (!customer) {
        customer = new Customer({
          name: fullName,
          phone,
          email: email || ''
        });
        await customer.save();
      } else if (email && !customer.email) {
        customer.email = email;
        await customer.save();
      }

      // 2. Find or create vehicle for customer
      let vehicle = await Vehicle.findOne({
        customerId: customer._id,
        make: new RegExp(`^${vehicleMake.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i'),
        model: new RegExp(`^${vehicleModel.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i'),
        deletedAt: null
      });

      if (!vehicle) {
        const randomPlate = 'ONLINE-' + Math.floor(1000 + Math.random() * 9000);
        vehicle = new Vehicle({
          customerId: customer._id,
          plateNo: randomPlate,
          make: vehicleMake,
          model: vehicleModel,
          year: Number(year) || new Date().getFullYear()
        });
        await vehicle.save();
      }

      // 3. Find an active technician or assign to admin
      let tech = await User.findOne({ role: 'technician', isActive: true });
      if (!tech) {
        tech = await User.findOne({ role: 'admin', isActive: true });
      }

      // 4. Construct appointment Date
      let apptDate = new Date(preferredDate);
      if (isNaN(apptDate.getTime())) {
        apptDate = new Date();
      }

      if (preferredTime) {
        const match = preferredTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          let hours = parseInt(match[1]);
          const minutes = parseInt(match[2]);
          const ampm = match[3].toUpperCase();
          if (ampm === 'PM' && hours < 12) hours += 12;
          if (ampm === 'AM' && hours === 12) hours = 0;
          apptDate.setHours(hours, minutes, 0, 0);
        }
      }

      // 5. Create Appointment
      const appointment = new Appointment({
        customerId: customer._id,
        vehicleId: vehicle._id,
        technicianId: tech ? tech._id : null,
        dateTime: apptDate,
        serviceType: service,
        note: additionalNotes ? `[Online Web Booking]: ${additionalNotes}` : '[Online Web Booking]',
        status: 'scheduled'
      });

      await appointment.save();

      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('customerId', 'name phone email')
        .populate('vehicleId', 'plateNo make model year')
        .populate('technicianId', 'name email')
        .lean();

      // 6. Send in-app notification to Admin & Receptionist
      await createNotification({
        recipientRoles: ['admin', 'receptionist'],
        title: 'New Online Booking Request',
        message: `Online booking from ${fullName} (${phone}) for ${vehicleMake} ${vehicleModel} - ${service}`,
        type: 'appointment',
        link: '/appointments'
      });

      // 7. Write to audit log
      await logAction({
        req,
        action: 'public_appointment_booked',
        module: 'appointments',
        details: `Public online appointment booked by ${fullName} (${phone}) for ${vehicleMake} ${vehicleModel}`
      });

      res.status(201).json({
        success: true,
        message: 'Appointment request submitted successfully',
        appointment: populatedAppointment
      });
    } catch (err) {
      console.error('Public appointment booking error:', err);
      res.status(500).json({ message: 'Failed to process online booking request' });
    }
  }
);

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
      .sort({ dateTime: 1 })
      .lean();

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
    body('dateTime')
      .notEmpty().withMessage('Appointment date and time is required')
      .isISO8601().withMessage('Please enter a valid ISO date')
      .bail()
      .custom(isWithinSupportedDateRange).withMessage('Appointment date is out of the supported range'),
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
      const customer = await Customer.findOne({ _id: customerId, deletedAt: null }).lean();
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found' });
      }

      // 2. Verify vehicle exists and belongs to the customer
      const vehicle = await Vehicle.findOne({ _id: vehicleId, customerId: customer._id }).lean();
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
      }).lean();

      if (conflict) {
        const conflictTime = formatNepaliTime(conflict.dateTime);
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
        .populate('technicianId', 'name')
        .lean();

      // Referenced customer/vehicle may be soft-deleted between selection and
      // save — populate returns null in that case, so fall back instead of crashing.
      const newCustomerName = populatedAppointment.customerId?.name || 'Deleted Customer';
      const newVehiclePlate = populatedAppointment.vehicleId?.plateNo || 'Unknown Vehicle';
      const newVehicleLabel = populatedAppointment.vehicleId
        ? `${populatedAppointment.vehicleId.make} ${populatedAppointment.vehicleId.model}`
        : 'Unknown Vehicle';
      const newTechName = populatedAppointment.technicianId?.name || 'Unassigned';

      // Send in-app notifications
      if (populatedAppointment.technicianId?._id) {
        await createNotification({
          recipientId: populatedAppointment.technicianId._id,
          title: 'New Appointment Assigned',
          message: `You have been assigned to service ${newVehicleLabel} for ${newCustomerName} at ${formatNepaliDateTime(populatedAppointment.dateTime)}`,
          type: 'appointment',
          link: '/appointments'
        });
      }

      await createNotification({
        recipientRoles: ['admin', 'receptionist'],
        title: 'New Appointment Scheduled',
        message: `Appointment scheduled for ${newCustomerName} (${newVehiclePlate})`,
        type: 'appointment',
        link: '/appointments'
      });

      // Write to audit log
      await logAction({
        req,
        action: 'appointment_created',
        module: 'appointments',
        details: `Scheduled appointment for ${newCustomerName} (${newVehiclePlate}) with tech ${newTechName} on ${formatNepaliDateTime(populatedAppointment.dateTime)}`
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
    body('dateTime')
      .optional()
      .isISO8601().withMessage('Please enter a valid ISO date')
      .bail()
      .custom(isWithinSupportedDateRange).withMessage('Appointment date is out of the supported range'),
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

      // Technician authorization constraint: can only update the status of
      // their own assigned appointments, and only to an allowed transition.
      if (req.user.role === 'technician') {
        if (!appointment.technicianId || appointment.technicianId.toString() !== req.user.id) {
          return res.status(403).json({ message: 'Forbidden: You can only update appointments assigned to you.' });
        }

        const requestedKeys = Object.keys(req.body).filter((k) => req.body[k] !== undefined);
        if (requestedKeys.some((k) => k !== 'status')) {
          return res.status(403).json({ message: 'Forbidden: Technicians are only permitted to update appointment status.' });
        }

        const allowedTechStatuses = ['in-progress', 'completed'];
        if (req.body.status && !allowedTechStatuses.includes(req.body.status)) {
          return res.status(403).json({ message: 'Technicians are only permitted to transition status to in-progress or completed.' });
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
        .populate('technicianId', 'name email')
        .lean();

      // Referenced customer/vehicle/technician may be soft-deleted (or, for
      // technician, removed) by the time this runs — populate returns null
      // in that case, so fall back to placeholder text instead of crashing.
      const customerName = populatedAppointment.customerId?.name || 'Deleted Customer';
      const vehiclePlate = populatedAppointment.vehicleId?.plateNo || 'Unknown Vehicle';

      // Send status change notifications
      if (req.body.status && req.body.status !== previousStatus) {
        if (req.body.status === 'cancelled') {
          if (populatedAppointment.technicianId?._id) {
            await createNotification({
              recipientId: populatedAppointment.technicianId._id,
              title: 'Appointment Cancelled',
              message: `Your assigned service for ${customerName} has been cancelled.`,
              type: 'appointment',
              link: '/appointments'
            });
          }

          await createNotification({
            recipientRoles: ['admin', 'receptionist'],
            title: 'Appointment Cancelled',
            message: `Appointment for ${customerName} (${vehiclePlate}) was cancelled.`,
            type: 'appointment',
            link: '/appointments'
          });
        } else if (req.body.status === 'completed') {
          await createNotification({
            recipientRoles: ['admin', 'receptionist'],
            title: 'Appointment Completed',
            message: `Appointment for ${customerName} (${vehiclePlate}) is completed.`,
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
        details: `Updated appointment (ID: ${populatedAppointment._id}) for ${customerName}. Previous Status: ${previousStatus.toUpperCase()}, New Status: ${populatedAppointment.status.toUpperCase()}`
      });

      res.json(populatedAppointment);
    } catch (err) {
      console.error('Update appointment error:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @route   DELETE /api/appointments/:id
// @desc    Permanently delete an appointment. Refused once real service work
//          (a Servicing record — and by extension any invoice/payment chain
//          hanging off it) exists for it, since that would orphan financial
//          data; cancel it via PATCH status instead in that case. If the
//          appointment originated from a web booking request, that request's
//          link is cleared so it doesn't keep pointing at a deleted record.
// @access  Private (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const hasServicing = await Servicing.exists({ appointmentId: appointment._id });
    if (hasServicing) {
      return res.status(400).json({
        message: 'This appointment already has service records (and possibly invoices/payments) attached — it cannot be deleted. Cancel it instead.'
      });
    }

    await WebBooking.updateMany(
      { createdAppointmentId: appointment._id },
      { $set: { createdAppointmentId: null, status: 'customer-created' } }
    );

    await Appointment.findByIdAndDelete(appointment._id);

    await logAction({
      req,
      action: 'appointment_deleted',
      module: 'appointments',
      details: `Deleted appointment (ID: ${appointment._id}, service: ${appointment.serviceType}, was scheduled ${formatNepaliDateTime(appointment.dateTime)})`
    });

    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error('Delete appointment error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

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
        .populate('technicianId', 'name email')
        .lean();

      // Referenced customer/vehicle may be soft-deleted — populate returns
      // null in that case, so fall back instead of crashing.
      const checkinCustomerName = populatedAppointment.customerId?.name || 'Deleted Customer';
      const checkinVehiclePlate = populatedAppointment.vehicleId?.plateNo || 'Unknown Vehicle';
      const checkinVehicleLabel = populatedAppointment.vehicleId
        ? `${populatedAppointment.vehicleId.make} ${populatedAppointment.vehicleId.model}`
        : 'Unknown Vehicle';

      // Send notifications
      if (populatedAppointment.technicianId?._id) {
        await createNotification({
          recipientId: populatedAppointment.technicianId._id,
          title: 'Vehicle Checked-In',
          message: `Vehicle ${checkinVehicleLabel} (${checkinVehiclePlate}) is checked in and ready for service.`,
          type: 'appointment',
          link: '/servicing'
        });
      }

      await createNotification({
        recipientRoles: ['admin', 'receptionist'],
        title: 'Vehicle Checked-In',
        message: `Client ${checkinCustomerName} vehicle ${checkinVehiclePlate} checked in.`,
        type: 'appointment',
        link: '/appointments'
      });

      // Write to audit log
      await logAction({
        req,
        action: 'appointment_checked_in',
        module: 'appointments',
        details: `Checked in vehicle ${checkinVehiclePlate} for customer ${checkinCustomerName}. Intake Mileage: ${populatedAppointment.checkIn?.mileageIn || 0} km.`
      });

      res.json(populatedAppointment);
    } catch (err) {
      console.error('Check-in error:', err.message);
      res.status(500).json({ message: err.message || 'Server error' });
    }
  }
);

export default router;
