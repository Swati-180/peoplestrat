import mongoose from 'mongoose';

const CategoryScoreSchema = new mongoose.Schema({
  category: String,
  score: Number,
  maxScore: Number
});

const ResultSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  
  overallScore: { type: Number, required: true },
  maxPossibleScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  
  categoryScores: [CategoryScoreSchema],
  
  timeTakenMinutes: { type: Number },
  completedAt: { type: Date, default: Date.now }
});

ResultSchema.index({ organizationId: 1, employeeId: 1, assessmentId: 1 });

export default mongoose.model('Result', ResultSchema);
