const mongoose = require('mongoose');
const { Schema } = mongoose;

const ActivityLogSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: String,
  message: String,
  ip: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
