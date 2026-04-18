import mongoose from 'mongoose';

const playbookSchema = new mongoose.Schema({
  playbookId: { type: String, required: true },
  title: { type: String, required: true },
  description: String,
  status: {
    type: String,
    enum: ['idle', 'running', 'completed', 'failed'],
    default: 'idle',
  },
  triggeredBy: String,
  alertId: String,
  steps: [{
    text: String,
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    completedAt: Date,
  }],
  startedAt: Date,
  completedAt: Date,
  result: {
    success: Boolean,
    stepsCompleted: Number,
    duration: String,
    threatsNeutralized: Number,
  },
});

playbookSchema.index({ startedAt: -1 });
playbookSchema.index({ status: 1 });

const Playbook = mongoose.model('Playbook', playbookSchema);
export default Playbook;
