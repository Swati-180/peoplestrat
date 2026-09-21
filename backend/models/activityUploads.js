import mongoose from 'mongoose';
const { Schema } = mongoose;

const ActivityUploadSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  user: { type: String, required: true },
  activityType: { type: String, required: true },
  date: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  tower: String,
  category: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

ActivityUploadSchema.index({ organizationId: 1 });

export default mongoose.model('ActivityUpload', ActivityUploadSchema);
