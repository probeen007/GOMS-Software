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
    // Identifies the single currently-valid login session for this account.
    // Regenerated on every successful login; any previously-issued token
    // carrying an older sessionId is rejected by the authenticate middleware,
    // effectively signing that device out.
    activeSessionId: {
      type: String,
      default: null
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

// Helper method to strip internal auth fields when converting to JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.activeSessionId;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
