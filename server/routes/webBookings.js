import express from 'express';
import { body, validationResult } from 'express-validator';
import WebBooking from '../models/WebBooking.js';
import Customer from '../models/Customer.js';
import Vehicle from '../models/Vehicle.js';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { createNotification } from '../utils/notifier.js';
import { logAction } from '../utils/logger.js';
import { formatNepaliDateTime, formatNepaliTime } from '../utils/nepaliDate.js';

const router = express.Router();

// @route   POST /api/web-bookings/public
// @desc    Public appointment booking request from website
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
      plateNo,
      vehicleMake,
      vehicleModel,
      year,
      service,
      preferredDate,
      preferredTime,
      additionalNotes
    } = req.body;

    try {
      let prefDate = new Date(preferredDate);
      if (isNaN(prefDate.getTime())) {
        prefDate = new Date();
      }

      const webBooking = new WebBooking({
        fullName,
        phone,
        email: email || '',
        plateNo: plateNo || '',
        vehicleMake,
        vehicleModel,
        year: year || '',
        service,
        preferredDate: prefDate,
        preferredTime: preferredTime || '',
        additionalNotes: additionalNotes || '',
        status: 'pending'
      });

      await webBooking.save();

      // Notify front desk staff
      await createNotification({
        recipientRoles: ['admin', 'receptionist'],
        title: 'New Web Appointment Request',
        message: `Web booking request from ${fullName} (${phone}) for ${vehicleMake} ${vehicleModel} - ${service}`,
        type: 'appointment',
        link: '/appointments'
      });

      // Write to audit log
      await logAction({
        req,
        action: 'web_booking_received',
        module: 'appointments',
        details: `Public web appointment request submitted by ${fullName} (${phone}) for ${vehicleMake} ${vehicleModel}`
      });

      res.status(201).json({
        success: true,
        message: 'Your appointment request has been submitted successfully! Our front desk will verify and contact you shortly.',
        webBooking
      });
    } catch (err) {
      console.error('Public web booking error:', err);
      res.status(500).json({ message: 'Failed to process web booking request' });
    }
  }
);

// @route   GET /api/web-bookings
// @desc    Get all web booking requests for staff verification
// @access  Private (admin, receptionist, technician)
router.get('/', authenticate, authorize('admin', 'receptionist', 'technician'), async (req, res) => {
  try {
    const requests = await WebBooking.find()
      .populate('createdCustomerId', 'name phone email')
      .populate('createdVehicleId', 'plateNo make model year')
      .populate('createdAppointmentId')
      .sort({ createdAt: -1 })
      .lean();

    res.json(requests);
  } catch (err) {
    console.error('Fetch web bookings error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/web-bookings/:id
// @desc    Edit web booking request details (e.g. adjust date, fix typos)
// @access  Private (admin, receptionist)
router.put('/:id', authenticate, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const booking = await WebBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Web booking request not found' });
    }

    const {
      fullName,
      phone,
      email,
      plateNo,
      vehicleMake,
      vehicleModel,
      year,
      service,
      preferredDate,
      preferredTime,
      additionalNotes
    } = req.body;

    if (fullName !== undefined) booking.fullName = fullName;
    if (phone !== undefined) booking.phone = phone;
    if (email !== undefined) booking.email = email;
    if (plateNo !== undefined) booking.plateNo = plateNo;
    if (vehicleMake !== undefined) booking.vehicleMake = vehicleMake;
    if (vehicleModel !== undefined) booking.vehicleModel = vehicleModel;
    if (year !== undefined) booking.year = year;
    if (service !== undefined) booking.service = service;
    if (preferredDate !== undefined) booking.preferredDate = new Date(preferredDate);
    if (preferredTime !== undefined) booking.preferredTime = preferredTime;
    if (additionalNotes !== undefined) booking.additionalNotes = additionalNotes;

    await booking.save();
    res.json(booking);
  } catch (err) {
    console.error('Update web booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/web-bookings/:id/create-customer
// @desc    1-Click: Create or Link Customer & Vehicle in database from web request
// @access  Private (admin, receptionist)
router.post('/:id/create-customer', authenticate, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const booking = await WebBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Web booking request not found' });
    }

    // 1. Find existing customer by phone or create new Customer
    let customer = await Customer.findOne({ phone: booking.phone, deletedAt: null });
    if (!customer) {
      customer = new Customer({
        name: booking.fullName,
        phone: booking.phone,
        email: booking.email || ''
      });
      await customer.save();
    } else {
      let updated = false;
      if (!customer.email && booking.email) {
        customer.email = booking.email;
        updated = true;
      }
      if (updated) await customer.save();
    }

    // 2. Find existing vehicle or create new Vehicle
    const plate = booking.plateNo && booking.plateNo.trim() !== ''
      ? booking.plateNo.trim().toUpperCase()
      : 'WEB-' + Math.floor(1000 + Math.random() * 9000);

    let vehicle = await Vehicle.findOne({
      customerId: customer._id,
      plateNo: plate,
      deletedAt: null
    });

    if (!vehicle) {
      vehicle = new Vehicle({
        customerId: customer._id,
        plateNo: plate,
        make: booking.vehicleMake,
        model: booking.vehicleModel,
        year: Number(booking.year) || new Date().getFullYear()
      });
      await vehicle.save();
    }

    // 3. Link customer and vehicle to WebBooking request
    booking.createdCustomerId = customer._id;
    booking.createdVehicleId = vehicle._id;
    if (booking.status === 'pending') {
      booking.status = 'customer-created';
    }
    await booking.save();

    await logAction({
      req,
      action: 'web_booking_customer_created',
      module: 'customers',
      details: `Created/Linked customer ${customer.name} and vehicle ${vehicle.plateNo} from web booking request #${booking._id}`
    });

    res.json({
      message: `Customer ${customer.name} and Vehicle ${vehicle.plateNo} successfully created/linked.`,
      customer,
      vehicle,
      webBooking: booking
    });
  } catch (err) {
    console.error('Create customer from web booking error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   POST /api/web-bookings/:id/approve
// @desc    1-Click: Approve and schedule official Appointment from web request
// @access  Private (admin, receptionist)
router.post('/:id/approve', authenticate, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const booking = await WebBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Web booking request not found' });
    }

    const { technicianId, dateTime, serviceType, note } = req.body;

    // 1. Auto-Ensure Customer & Vehicle exist
    let customerId = booking.createdCustomerId;
    let vehicleId = booking.createdVehicleId;

    if (!customerId || !vehicleId) {
      // Auto-create customer & vehicle if not already created
      let customer = await Customer.findOne({ phone: booking.phone, deletedAt: null });
      if (!customer) {
        customer = new Customer({
          name: booking.fullName,
          phone: booking.phone,
          email: booking.email || ''
        });
        await customer.save();
      }

      const plate = booking.plateNo && booking.plateNo.trim() !== ''
        ? booking.plateNo.trim().toUpperCase()
        : 'WEB-' + Math.floor(1000 + Math.random() * 9000);

      let vehicle = await Vehicle.findOne({
        customerId: customer._id,
        plateNo: plate,
        deletedAt: null
      });

      if (!vehicle) {
        vehicle = new Vehicle({
          customerId: customer._id,
          plateNo: plate,
          make: booking.vehicleMake,
          model: booking.vehicleModel,
          year: Number(booking.year) || new Date().getFullYear()
        });
        await vehicle.save();
      }

      booking.createdCustomerId = customer._id;
      booking.createdVehicleId = vehicle._id;
      customerId = customer._id;
      vehicleId = vehicle._id;
    }

    // 2. Determine Technician
    let selectedTechId = technicianId;
    if (!selectedTechId) {
      const defaultTech = await User.findOne({ role: 'technician', isActive: true });
      if (defaultTech) {
        selectedTechId = defaultTech._id;
      } else {
        selectedTechId = req.user.id; // Admin / receptionist fallback
      }
    }

    // 3. Determine Appointment Date/Time
    let finalDateTime = dateTime ? new Date(dateTime) : new Date(booking.preferredDate);
    if (isNaN(finalDateTime.getTime())) {
      finalDateTime = new Date();
    }

    if (!dateTime && booking.preferredTime) {
      const match = booking.preferredTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        finalDateTime.setHours(hours, minutes, 0, 0);
      }
    }

    // 4. Double-Booking Conflict Check
    const minTime = new Date(finalDateTime.getTime() - 59 * 60 * 1000);
    const maxTime = new Date(finalDateTime.getTime() + 59 * 60 * 1000);

    const conflict = await Appointment.findOne({
      technicianId: selectedTechId,
      status: { $in: ['scheduled', 'checked-in', 'in-progress'] },
      dateTime: { $gte: minTime, $lte: maxTime }
    }).lean();

    if (conflict) {
      const conflictTime = formatNepaliTime(conflict.dateTime);
      return res.status(400).json({
        message: `Date/Time Conflict: Assigned technician is already booked at ${conflictTime}. Please select a different time or technician.`
      });
    }

    // 5. Create Official Appointment
    const appointment = new Appointment({
      customerId,
      vehicleId,
      technicianId: selectedTechId,
      dateTime: finalDateTime,
      serviceType: serviceType || booking.service,
      note: note || booking.additionalNotes ? `[Web Booking]: ${booking.additionalNotes}` : '[Web Booking]',
      status: 'scheduled'
    });

    await appointment.save();

    booking.status = 'approved';
    booking.createdAppointmentId = appointment._id;
    await booking.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('customerId', 'name phone email')
      .populate('vehicleId', 'plateNo make model year')
      .populate('technicianId', 'name email')
      .lean();

    // 6. In-App Notifications
    await createNotification({
      recipientId: selectedTechId,
      title: 'New Service Appointment Assigned',
      message: `You have been assigned to service ${populatedAppointment.vehicleId.make} ${populatedAppointment.vehicleId.model} for ${populatedAppointment.customerId.name} at ${formatNepaliDateTime(finalDateTime)}`,
      type: 'appointment',
      link: '/appointments'
    });

    await createNotification({
      recipientRoles: ['admin', 'receptionist'],
      title: 'Web Booking Approved & Scheduled',
      message: `Appointment scheduled for ${populatedAppointment.customerId.name} (${populatedAppointment.vehicleId.plateNo})`,
      type: 'appointment',
      link: '/appointments'
    });

    await logAction({
      req,
      action: 'web_booking_approved',
      module: 'appointments',
      details: `Approved web booking #${booking._id} and scheduled appointment for ${populatedAppointment.customerId.name}`
    });

    res.json({
      message: 'Web booking request successfully approved and scheduled as an official appointment!',
      appointment: populatedAppointment,
      webBooking: booking
    });
  } catch (err) {
    console.error('Approve web booking error:', err.message);
    res.status(500).json({ message: err.message || 'Server error' });
  }
});

// @route   PATCH /api/web-bookings/:id/reject
// @desc    Reject / Dismiss a web booking request
// @access  Private (admin, receptionist)
router.patch('/:id/reject', authenticate, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const booking = await WebBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Web booking request not found' });
    }

    booking.status = 'rejected';
    await booking.save();

    await logAction({
      req,
      action: 'web_booking_rejected',
      module: 'appointments',
      details: `Rejected web booking request #${booking._id} from ${booking.fullName}`
    });

    res.json({ message: 'Web booking request rejected', webBooking: booking });
  } catch (err) {
    console.error('Reject web booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/web-bookings/:id
// @desc    Delete a web booking request record. If it already produced a
//          scheduled Appointment, that appointment is cancelled first so it
//          doesn't keep running with no visible source request left behind.
//          The linked Customer/Vehicle (real business records, not owned by
//          this request) are left untouched.
// @access  Private (admin)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const booking = await WebBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Web booking request not found' });
    }

    if (booking.createdAppointmentId) {
      const appointment = await Appointment.findById(booking.createdAppointmentId);
      if (appointment && !['completed', 'cancelled'].includes(appointment.status)) {
        appointment.status = 'cancelled';
        appointment.note = `${appointment.note ? appointment.note + ' ' : ''}[Auto-cancelled: source web booking request was deleted]`;
        await appointment.save();

        if (appointment.technicianId) {
          await createNotification({
            recipientId: appointment.technicianId,
            title: 'Appointment Cancelled',
            message: `An appointment assigned to you was cancelled because its source web booking request was deleted.`,
            type: 'appointment',
            link: '/appointments'
          });
        }

        await logAction({
          req,
          action: 'appointment_cancelled',
          module: 'appointments',
          details: `Auto-cancelled appointment (ID: ${appointment._id}) because its source web booking request (#${booking._id}) was deleted`
        });
      }
    }

    await WebBooking.findByIdAndDelete(req.params.id);

    await logAction({
      req,
      action: 'web_booking_deleted',
      module: 'appointments',
      details: `Deleted web booking request #${booking._id} from ${booking.fullName} (${booking.phone})`
    });

    res.json({ message: 'Web booking record deleted successfully' });
  } catch (err) {
    console.error('Delete web booking error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
