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
    }
  },
  {
    timestamps: true
  }
);

const Expenditure = mongoose.model('Expenditure', expenditureSchema);

export default Expenditure;
