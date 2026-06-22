import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      required: [true, 'Invoice reference is required']
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero']
    },
    method: {
      type: String,
      enum: ['cash', 'card', 'fonepay', 'bank-transfer'],
      default: 'cash'
    },
    reference: {
      type: String,
      trim: true,
      default: ''
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

paymentSchema.index({ invoiceId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
