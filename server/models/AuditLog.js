import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userEmail: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    module: {
      type: String,
      required: true,
      enum: [
        'auth',
        'customers',
        'inventory',
        'appointments',
        'servicing',
        'invoices',
        'loyalty',
        'finance',
        'staff',
        'tasks',
        'settings'
      ]
    },
    details: {
      type: String,
      default: ''
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false } // Only track creation time
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
