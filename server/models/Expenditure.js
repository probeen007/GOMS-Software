import mongoose from 'mongoose';

const expenditureSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Expenditure category is required'],
      default: 'Inventory Purchase',
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Expenditure amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    note: {
      type: String,
      trim: true,
      default: ''
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    // Set when this expenditure was auto-created from recording a supplier
    // restock, so deleting that Purchase can clean this up too.
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Expenditure = mongoose.model('Expenditure', expenditureSchema);

export default Expenditure;
