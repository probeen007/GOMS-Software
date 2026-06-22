import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'receptionist', 'technician', 'accountant'],
      default: 'admin'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    baseSalary: {
      type: Number,
      default: 30000
    },
    hourlyRate: {
      type: Number,
      default: 200
    }
  },
  {
    timestamps: true
  }
);

// Helper method to strip password hash when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
