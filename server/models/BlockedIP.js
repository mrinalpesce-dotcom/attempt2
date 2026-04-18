import mongoose from 'mongoose';

const blockedIPSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  reason: String,
  blockedAt: { type: Date, default: Date.now },
  blockedBy: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  autoBlocked: { type: Boolean, default: false },
  expiresAt: Date,
});

blockedIPSchema.index({ ip: 1 });
blockedIPSchema.index({ blockedAt: -1 });

const BlockedIP = mongoose.model('BlockedIP', blockedIPSchema);
export default BlockedIP;
