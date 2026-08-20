import mongoose from 'mongoose';

const performanceRecordSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  tasks_completed: { type: Number, required: true, default: 0 },
  expected_tasks: { type: Number, required: true, default: 1 },
  working_hours: { type: Number, required: true, default: 8 },
  overtime_hours: { type: Number, default: 0 },
  error_rate: { type: Number, default: 0, min: 0, max: 1 }, // 0 to 1 (percentage as decimal)
  department_process: { type: String, index: true },
  record_date: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

// Compound index for efficient querying
performanceRecordSchema.index({ employee_id: 1, record_date: -1 });

export default mongoose.model('PerformanceRecord', performanceRecordSchema);
