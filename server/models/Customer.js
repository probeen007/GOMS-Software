import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Customer phone number is required'],
      trim: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    type: {
      type: String,
      enum: ['individual', 'corporate'],
      default: 'individual'
    },
    loyaltyPoints: {
      type: Number,
      default: 0
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Query middleware to filter out soft-deleted customers by default
customerSchema.pre(/^find/, function (next) {
  this.find({ deletedAt: null });
  next();
});

const Customer = mongoose.model('Customer', customerSchema);

export default Customer;
