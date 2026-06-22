import mongoose from 'mongoose';

const checkInSchema = new mongoose.Schema({
  mileageIn: {
    type: Number,
    required: [true, 'Mileage is required for check-in'],
    min: [0, 'Mileage cannot be negative']
  },
  conditionNotes: {
    type: String,
    trim: true,
    default: ''
  },
  photos: [{
    type: String
  }]
}, { _id: false });

const appointmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required']
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required']
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Technician assignment is required']
    },
    dateTime: {
      type: Date,
      required: [true, 'Appointment date and time is required']
    },
    serviceType: {
      type: String,
      required: [true, 'Service type is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['scheduled', 'checked-in', 'in-progress', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    checkIn: {
      type: checkInSchema,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast querying
appointmentSchema.index({ dateTime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ technicianId: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
