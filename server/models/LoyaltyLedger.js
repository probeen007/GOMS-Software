import mongoose from 'mongoose';

const loyaltyLedgerSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required']
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null
    },
    points: {
      type: Number,
      required: [true, 'Points value is required']
    },
    transactionType: {
      type: String,
      enum: ['earned', 'redeemed', 'adjusted'],
      required: true
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

loyaltyLedgerSchema.index({ customerId: 1 });

const LoyaltyLedger = mongoose.model('LoyaltyLedger', loyaltyLedgerSchema);

export default LoyaltyLedger;
