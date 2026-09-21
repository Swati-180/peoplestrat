import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' }
}, { timestamps: true });

organizationSchema.index({ name: 1 });
organizationSchema.index({ domain: 1 });

export default mongoose.model('Organization', organizationSchema);
