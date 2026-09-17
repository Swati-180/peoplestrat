import mongoose from 'mongoose';

const behavioralResultSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  assessmentDate: { type: Date, default: Date.now },
  scores: {
    communication: { type: Number, required: true }, // 0-100
    leadership: { type: Number, required: true },
    adaptability: { type: Number, required: true },
    resilience: { type: Number, required: true },
    teamwork: { type: Number, required: true }
  },
  rawResponses: [{
    questionId: { type: String, required: true },
    responseValue: { type: Number, required: true } // e.g., 1-5 Likert scale
  }]
});

behavioralResultSchema.index({ employeeId: 1, assessmentDate: -1 });
behavioralResultSchema.index({ organizationId: 1, employeeId: 1 });

export default mongoose.model('BehavioralResult', behavioralResultSchema);
