import mongoose from 'mongoose';

const peerFeedbackSchema = new mongoose.Schema({
  sourceEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  targetEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  rating: { type: Number, min: 1, max: 5 },
  collaborationTags: [{ type: String }]
}, { timestamps: true });

peerFeedbackSchema.index({ targetEmployeeId: 1, date: -1 });

export default mongoose.model('PeerFeedback', peerFeedbackSchema);
