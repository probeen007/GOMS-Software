import mongoose from 'mongoose';

const webBookingSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    plateNo: {
      type: String,
      trim: true,
      default: ''
    },
    vehicleMake: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true
    },
    vehicleModel: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    year: {
      type: String,
      trim: true,
      default: ''
    },
    service: {
      type: String,
      required: [true, 'Service required is required'],
      trim: true
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required']
    },
    preferredTime: {
      type: String,
      trim: true,
      default: ''
    },
    additionalNotes: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'customer-created', 'approved', 'rejected'],
      default: 'pending'
    },
    createdCustomerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    },
    createdVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null
    },
    createdAppointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    }
  },
  {
    timestamps: true
  }
);

webBookingSchema.index({ status: 1 });
webBookingSchema.index({ createdAt: -1 });

const WebBooking = mongoose.model('WebBooking', webBookingSchema);

export default WebBooking;
