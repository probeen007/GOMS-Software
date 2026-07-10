import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer ID is required']
    },
    plateNo: {
      type: String,
      required: [true, 'License plate number is required'],
      trim: true,
      uppercase: true
    },
    make: {
      type: String,
      trim: true,
      default: ''
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear()
    },
    vin: {
      type: String,
      trim: true,
      uppercase: true,
      default: ''
    },
    colour: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes for fast searching
vehicleSchema.index({ plateNo: 1 });
vehicleSchema.index({ customerId: 1 });

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
