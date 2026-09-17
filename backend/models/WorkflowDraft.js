import mongoose from 'mongoose';

const workflowDraftSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  workflowType: {
    type: String,
    required: true,
    enum: ['peer_feedback', 'add_employee', 'edit_employee_profile']
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { timestamps: true });

// Ensure only 1 draft per user per workflow instance in an org
workflowDraftSchema.index(
  { userId: 1, organizationId: 1, workflowType: 1, referenceId: 1 },
  { unique: true }
);

export default mongoose.model('WorkflowDraft', workflowDraftSchema);
