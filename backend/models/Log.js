import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  event: { type: String, required: true },
  source: String,
  details: String,
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info',
  },
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now },
});

logSchema.index({ timestamp: -1 });
logSchema.index({ level: 1 });
logSchema.index({ source: 1 });

const Log = mongoose.model('Log', logSchema);
export default Log;
