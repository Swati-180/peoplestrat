import mongoose from 'mongoose';
const { Schema } = mongoose;

const CvUploadSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  candidateName: String,
  email: String,
  skills: [String],
  experience: String,
  education: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

CvUploadSchema.index({ organizationId: 1 });

export default mongoose.model('cvUploads', CvUploadSchema);
