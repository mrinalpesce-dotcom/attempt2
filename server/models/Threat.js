import mongoose from 'mongoose';

const threatSchema = new mongoose.Schema({
  type: { type: String, required: true },
  sourceIP: String,
  targetIP: String,
  sourceLat: Number,
  sourceLng: Number,
  targetLat: Number,
  targetLng: Number,
  country: String,
  city: String,
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
  },
  blocked: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

threatSchema.index({ timestamp: -1 });
threatSchema.index({ country: 1 });
threatSchema.index({ severity: 1 });

const Threat = mongoose.model('Threat', threatSchema);
export default Threat;
