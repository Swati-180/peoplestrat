import mongoose from 'mongoose';
const { Schema } = mongoose;

const JobDescriptionSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  jdId: { type: String, index: true },
  title: String,
  department: String,
  location: String,
  requiredSkills: [String],
  preferredSkills: [String],
  experienceRequired: Number,
  responsibilities: [String],
  roleCriticality: { type: String, enum: ['High', 'Medium', 'Low'] },
  requiredBehavioralTraits: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

JobDescriptionSchema.index({ organizationId: 1, department: 1 });

export default mongoose.model('JobDescription', JobDescriptionSchema);
