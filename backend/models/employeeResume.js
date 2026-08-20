const mongoose = require('mongoose');
const { Schema } = mongoose;

const EducationSchema = new Schema({
  degree: String,
  institution: String,
  startDate: Date,
  endDate: Date,
  grade: String,
  details: String
}, { _id: false });

const ExperienceSchema = new Schema({
  title: String,
  company: String,
  startDate: Date,
  endDate: Date,
  description: String,
  employmentType: String
}, { _id: false });

const ProjectSchema = new Schema({
  title: String,
  description: String,
  technologies: [String],
  startDate: Date,
  endDate: Date
}, { _id: false });

const ResumeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rawText: { type: String }, // full parsed text
  education: [EducationSchema],
  experience: [ExperienceSchema],
  projects: [ProjectSchema],
  skills: [String],
  summary: String,
  parsedAt: { type: Date, default: Date.now },
  rawJson: { type: Schema.Types.Mixed } // store original parsed structure
}, { timestamps: true });

module.exports = mongoose.model('EmployeeResume', ResumeSchema);
