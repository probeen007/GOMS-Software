import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientRoles: {
      type: [String],
      enum: ['admin', 'receptionist', 'technician', 'accountant'],
      default: []
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['appointment', 'quotation', 'job-card', 'inventory', 'payment', 'system'],
      default: 'system'
    },
    link: {
      type: String,
      default: ''
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
