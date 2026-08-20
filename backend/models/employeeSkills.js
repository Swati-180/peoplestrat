const mongoose = require('mongoose');
const { Schema } = mongoose;

const EmployeeSkillsSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  extractedHardSkills: [String],
  categorizedSkills: [{ category: String, skills: [String] }],
  parsedResumeSkills: [String],
  endorsements: [{ byUserId: Schema.Types.ObjectId, skill: String, createdAt: Date }],
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmployeeSkills', EmployeeSkillsSchema);
