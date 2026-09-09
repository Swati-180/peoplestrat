import mongoose from 'mongoose';

// Ported from mayamaya_plan.md §4 (Eleviq `quiz-result.model.ts`).
// Adapted to peoplestrat ESM conventions. organizationId is optional/null
// because peoplestrat has no org concept (userId-only integration).
const quizResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null },
    status: { type: String, enum: ['initiated', 'completed'], required: true },
    quizLink: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
    cycleNumber: { type: Number, default: null },
    sprintNumber: { type: Number, default: null },
    assessmentVersion: { type: String, enum: ['v1'], default: 'v1' },
    scoringVersion: { type: String, enum: ['v1'], default: 'v1' },
    totalQuestionsAnswered: { type: Number, default: null },
    results: { type: mongoose.Schema.Types.Mixed, default: null },
    skills: { type: [mongoose.Schema.Types.Mixed], default: null },
    webhookEventId: { type: String, default: null },
  },
  { timestamps: true }
);

quizResultSchema.index({ userId: 1 });
quizResultSchema.index({ webhookEventId: 1 }, { unique: true, sparse: true });

export default mongoose.model('QuizResult', quizResultSchema);
