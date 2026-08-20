import mongoose from 'mongoose';
const { Schema } = mongoose;

const AnalyticsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  date: { type: Date, default: Date.now },
  productivity: Number,
  fatigueScore: Number,
  softSkillScore: Number,
  hardSkillScore: Number,
  cognitiveHealthIndex: { type: Number, min: 0, max: 100 },
  notes: String,
  meta: Schema.Types.Mixed
});

export default mongoose.model('Analytics', AnalyticsSchema);
