import mongoose from 'mongoose';

const servicingPartSchema = new mongoose.Schema({
  partId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryStock',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  qty: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  }
}, { _id: false });

const servicingLabourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  hours: {
    type: Number,
    required: true,
    min: [0.1, 'Hours must be positive'],
    default: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: [0, 'Unit price cannot be negative']
  },
  total: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative']
  }
}, { _id: false });

const servicingSchema = new mongoose.Schema(
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
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    },
    mileageOut: {
      type: Number,
      min: [0, 'Mileage cannot be negative'],
      default: null
    },
    findings: {
      type: String,
      trim: true,
      default: ''
    },
    parts: [servicingPartSchema],
    labour: [servicingLabourSchema],
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative']
    },
    vat: {
      type: Number,
      default: 0,
      min: [0, 'VAT cannot be negative']
    },
    total: {
      type: Number,
      required: true,
      default: 0
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
servicingSchema.index({ status: 1 });
servicingSchema.index({ customerId: 1 });

const Servicing = mongoose.model('Servicing', servicingSchema);

export default Servicing;
