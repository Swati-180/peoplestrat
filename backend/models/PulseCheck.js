import mongoose from 'mongoose';

const pulseCheckSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  checkDate: { type: Date, default: Date.now },
  stressLevel: { type: Number, required: true }, // 1-5
  workloadManageability: { type: Number, required: true }, // 1-5
  sleepQuality: { type: Number, required: true }, // 1-5
  fatigueScore: { type: Number, required: true } // Combined calculated score (0-100)
});

// Do not index sensitive fields, but index employeeId
pulseCheckSchema.index({ employeeId: 1, checkDate: -1 });

export default mongoose.model('PulseCheck', pulseCheckSchema);
