import mongoose from 'mongoose';

const simulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: String,
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending',
  },
  results: {
    vulnerabilitiesFound: Number,
    exploitsSuccessful: Number,
    riskScore: String,
    duration: String,
    packetsAnalyzed: Number,
  },
  runBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

simulationSchema.index({ createdAt: -1 });
simulationSchema.index({ status: 1 });

const Simulation = mongoose.model('Simulation', simulationSchema);
export default Simulation;
