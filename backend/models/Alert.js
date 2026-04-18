import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  title: { type: String, required: true },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    required: true,
  },
  sourceIP: String,
  targetIP: String,
  description: String,
  type: String,
  timestamp: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['active', 'investigating', 'resolved', 'dismissed'],
    default: 'active',
  },
  confidence: { type: Number, min: 0, max: 100 },
  mitreAttack: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
});

alertSchema.index({ severity: 1 });
alertSchema.index({ status: 1 });
alertSchema.index({ timestamp: -1 });
alertSchema.index({ type: 1 });

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;
