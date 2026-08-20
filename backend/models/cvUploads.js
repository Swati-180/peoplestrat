import mongoose from 'mongoose';
const { Schema } = mongoose;

const CvUploadSchema = new Schema({
  candidateName: String,
  email: String,
  skills: [String],
  experience: String,
  education: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('cvUploads', CvUploadSchema);
