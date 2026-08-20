const mongoose = require('mongoose');
const { Schema } = mongoose;

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending','in_progress','completed','blocked'], default: 'pending' },
  priority: { type: String, enum: ['low','medium','high'], default: 'medium' },
  dueDate: Date,
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  meta: Schema.Types.Mixed
});

module.exports = mongoose.model('Task', TaskSchema);
