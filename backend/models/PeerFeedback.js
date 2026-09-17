import mongoose from 'mongoose';

const peerFeedbackSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  sourceEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  targetEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  rating: { type: Number, min: 1, max: 5 },
  collaborationTags: [{ type: String }]
}, { timestamps: true });

peerFeedbackSchema.index({ targetEmployeeId: 1, date: -1 });
peerFeedbackSchema.index({ organizationId: 1, targetEmployeeId: 1, date: -1 });

export default mongoose.model('PeerFeedback', peerFeedbackSchema);
