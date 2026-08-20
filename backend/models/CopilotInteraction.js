import mongoose from 'mongoose';

const copilotInteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model('CopilotInteraction', copilotInteractionSchema);
