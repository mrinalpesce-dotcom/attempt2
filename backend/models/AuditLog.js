import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  target: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
  ip: String,
  userAgent: String,
  details: String,
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
