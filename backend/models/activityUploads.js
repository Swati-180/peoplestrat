import mongoose from 'mongoose';
const { Schema } = mongoose;

const ActivityUploadSchema = new Schema({
  user: { type: String, required: true },
  activityType: { type: String, required: true },
  date: { type: Date, required: true },
  durationMinutes: { type: Number, required: true },
  tower: String,
  category: String,
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('ActivityUpload', ActivityUploadSchema);
