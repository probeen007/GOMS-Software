import mongoose from 'mongoose';

const dayBookSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true // One day book entry per calendar day
    },
    openingBalanceCash: {
      type: Number,
      default: 0
    },
    openingBalanceBank: {
      type: Number,
      default: 0
    },
    closingBalanceCash: {
      type: Number,
      default: 0
    },
    closingBalanceBank: {
      type: Number,
      default: 0
    },
    isClosed: {
      type: Boolean,
      default: false
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

const DayBook = mongoose.model('DayBook', dayBookSchema);
export default DayBook;
