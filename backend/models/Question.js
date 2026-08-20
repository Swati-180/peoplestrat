const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false }
});

const QuestionSchema = new mongoose.Schema({
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assessment', required: true },
  text: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Programming', 'Logical Reasoning', 'Communication', 'Leadership', 'Domain Knowledge', 'Other']
  },
  options: [OptionSchema],
  weight: { type: Number, default: 1 }
});

module.exports = mongoose.model('Question', QuestionSchema);
