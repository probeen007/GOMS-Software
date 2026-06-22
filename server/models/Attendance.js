import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Staff reference is required']
    },
    date: {
      type: Date,
      required: [true, 'Attendance date is required']
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'leave'],
      default: 'present'
    },
    workingHours: {
      type: Number,
      default: 8,
      min: [0, 'Hours cannot be negative']
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate attendance entries for the same staff member on the same day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
