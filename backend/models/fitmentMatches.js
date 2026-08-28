import mongoose from 'mongoose';
const { Schema } = mongoose;

const FitmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  jdId: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
  matchScore: Number,
  matchedSkills: [String],
  missingSkills: [String],
  reasons: [String],
  isInternalMobility: { type: Boolean, default: false },
  mobilityReadinessScore: { type: Number, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('FitmentMatch', FitmentSchema);

