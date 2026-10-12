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
    // Set ONLY on webhook completion. Must stay absent (not null) on
    // initiated docs: a stored null IS indexed and breaks the unique
    // constraint on the second document. See index below.
    webhookEventId: { type: String, default: undefined },
  },
  { timestamps: true }
);

quizResultSchema.index({ userId: 1 });
// Partial (not sparse): uniqueness enforced only when a real string event id
// is present. Missing or null values are excluded from the index, so any
// number of initiated docs can coexist.
quizResultSchema.index(
  { webhookEventId: 1 },
  {
    unique: true,
    partialFilterExpression: { webhookEventId: { $exists: true, $type: 'string' } },
  }
);
quizResultSchema.index({ organizationId: 1, userId: 1 });

export default mongoose.model('QuizResult', quizResultSchema);
