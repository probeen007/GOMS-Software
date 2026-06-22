import mongoose from 'mongoose';
import crypto from 'crypto';

const quotationItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['part', 'labour'],
    required: true
  },
  partId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InventoryStock',
    default: null
  },
  name: {
    type: String,
    required: [true, 'Line item name is required'],
    trim: true
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
    min: [0, 'Line total cannot be negative']
  }
}, { _id: false });

const quotationSchema = new mongoose.Schema(
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
    items: [quotationItemSchema],
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
    status: {
      type: String,
      enum: ['draft', 'sent', 'approved', 'rejected'],
      default: 'draft'
    },
    approvalToken: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(24).toString('hex')
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: ''
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
quotationSchema.index({ status: 1 });

const Quotation = mongoose.model('Quotation', quotationSchema);

export default Quotation;
