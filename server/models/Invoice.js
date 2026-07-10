import mongoose from 'mongoose';
import crypto from 'crypto';

const creditNoteSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Credit note amount cannot be negative']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const invoiceSchema = new mongoose.Schema(
  {
    servicingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Servicing',
      required: [true, 'Servicing record reference is required']
    },
    invoiceType: {
      type: String,
      enum: ['vat', 'non-vat'],
      default: 'vat'
    },
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
    invoiceNo: {
      type: String,
      unique: true,
      default: () => 'INV-' + crypto.randomBytes(4).toString('hex').toUpperCase()
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
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
      min: [0, 'Total cannot be negative'],
      default: 0
    },
    amountPaid: {
      type: Number,
      required: true,
      min: [0, 'Amount paid cannot be negative'],
      default: 0
    },
    amountDue: {
      type: Number,
      required: true,
      min: [0, 'Amount due cannot be negative'],
      default: 0
    },
    status: {
      type: String,
      enum: ['unpaid', 'partially-paid', 'paid', 'credited'],
      default: 'unpaid'
    },
    creditNotes: [creditNoteSchema],
    nextServiceDate: {
      type: Date,
      default: null
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Indexes
invoiceSchema.index({ status: 1 });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
