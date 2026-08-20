import mongoose from 'mongoose';
const { Schema } = mongoose;

const EmployeeSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // reference to users collection
  employeeId: { type: String, index: true }, // external id if present
  fullName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String },
  department: { type: String, index: true },
  designation: { type: String },
  joiningDate: { type: Date },
  experience: { type: Number, default: 0 }, // years
  completedSprintCount: { type: Number, default: 0 },

  // Scores
  fitmentScore: { type: Number, default: 0 },
  softSkillsScore: { type: Number, default: 0 },
  hardSkillsScore: { type: Number, default: 0 },
  communicationScore: { type: Number, default: 0 },
  overallProfileScore: { type: Number, default: 0 },

  // Media & files
  imageUrl: { type: String },
  resumeUrl: { type: String },

  // Denormalized summary fields
  topSkills: [{ type: String }],

  meta: { type: Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
