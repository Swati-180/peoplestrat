import mongoose from 'mongoose';

const departmentHealthSchema = new mongoose.Schema({
  department: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  overallHealthScore: { type: Number, min: 0, max: 100, required: true },
  workforceReadinessScore: { type: Number, min: 0, max: 100 },
  attritionRiskAvg: { type: Number, min: 0, max: 100 },
  productivityAvg: { type: Number, min: 0, max: 100 }
}, { timestamps: true });

export default mongoose.model('DepartmentHealth', departmentHealthSchema);
