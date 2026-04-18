import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  category: {
    type: String,
    enum: ['general', 'security', 'notifications', 'appearance', 'api', 'system'],
    default: 'general',
  },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now },
});

settingSchema.index({ key: 1 });
settingSchema.index({ category: 1 });

// Static method to get a setting value
settingSchema.statics.getValue = async function (key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Static method to set a setting value
settingSchema.statics.setValue = async function (key, value, category = 'general', userId = null) {
  return this.findOneAndUpdate(
    { key },
    { value, category, updatedBy: userId, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
