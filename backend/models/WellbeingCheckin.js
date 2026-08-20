import mongoose from 'mongoose';

const wellbeingCheckinSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  source: { 
    type: String, 
    enum: ['Survey', 'SelfCheckin', 'Pulse', 'Feedback'], 
    required: true 
  },
  engagementScore: { type: Number, min: 0, max: 100 },
  moodScore: { type: Number, min: 1, max: 5 },
  stressLevel: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

// Ensure fast queries for history
wellbeingCheckinSchema.index({ employeeId: 1, date: -1 });

export default mongoose.model('WellbeingCheckin', wellbeingCheckinSchema);
