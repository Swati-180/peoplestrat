const mongoose = require('mongoose');
const { Schema } = mongoose;

const ReportSchema = new Schema({
  title: String,
  reportType: String,
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  url: String,
  params: Schema.Types.Mixed,
  aiSummary: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);
