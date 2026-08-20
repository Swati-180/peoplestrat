import mongoose from 'mongoose';

const successionPlanSchema = new mongoose.Schema({
  targetRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobDescription', required: true },
  department: { type: String, required: true },
  candidates: [{
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    readinessTimeframe: { type: String, enum: ['Ready Now', 'Ready in 1 Year', 'Ready in 3 Years'] },
    source: { type: String, enum: ['AI Recommended', 'Manager Nominated'] }
  }],
  status: { type: String, enum: ['Active', 'Draft', 'Closed'], required: true }
}, { timestamps: true });

export default mongoose.model('SuccessionPlan', successionPlanSchema);
