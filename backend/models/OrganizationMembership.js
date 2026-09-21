import mongoose from 'mongoose';

const organizationMembershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  role: { type: String, enum: ['employee', 'manager', 'admin'], required: true },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  deactivatedByTermination: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent duplicate active memberships for the same organisation
organizationMembershipSchema.index({ userId: 1, organizationId: 1 }, { unique: true });

export default mongoose.model('OrganizationMembership', organizationMembershipSchema);
