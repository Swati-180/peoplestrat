import mongoose from "mongoose";

const BANDS = ['OR', 'D3', 'D2', 'D1', 'M4', 'M3', 'M2', 'M1', 'L3', 'L2', 'L1'];
const PROCESS_AREAS = ['F&A', 'PSS', 'SAP'];

const employeeSchema = new mongoose.Schema({
  userid: { type: String, unique: true, sparse: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, sparse: true },
  department: String,
  position: String,
  band: { type: String, enum: BANDS },
  process_area: { type: String, enum: PROCESS_AREAS, index: true },
  sub_process: { type: String }, // e.g., Invoice Posting, SAP Support
  salary: Number,
  joiningDate: Date,
  experience_years: { type: Number, default: 0 },
  location: String,
  
  // Direct scores (computed by analytics engine)
  productivity: { type: Number, min: 0, max: 100, default: 0 },
  utilization: { type: Number, min: 0, max: 100, default: 0 },
  fitmentScore: { type: Number, min: 0, max: 100, default: 0 },
  fatigueScore: { type: Number, min: 0, max: 100, default: 0 },
  automationPotential: { type: Number, default: 0 },
  
  // Soft skills scores
  communication: { type: Number, min: 0, max: 100, default: 0 },
  problemSolving: { type: Number, min: 0, max: 100, default: 0 },
  teamwork: { type: Number, min: 0, max: 100, default: 0 },
  adaptability: { type: Number, min: 0, max: 100, default: 0 },
  creativity: { type: Number, min: 0, max: 100, default: 0 },
  
  // Role info
  currentRole: String,
  recommendedRole: String,
  performance: String, // 'High', 'Average', 'Low'
  
  // Skills (flat array)
  skills: [String],
  
  tags: [String],
  
  // Process workload tracking
  processes: [{
    name: String,
    hours: Number,
    output: String,
    repetitiveScore: Number,
  }],
  
  // Documents
  documents: [{
    name: String,
    type: String,
    uploadDate: Date,
  }],
  
  // History
  productivityHistory: [{
    month: String,
    value: Number,
  }],
  
  // Legacy compatibility fields
  softskills: String,
  consolidatedCount: Number,
  nonConsolidatedCount: Number,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for common queries
employeeSchema.index({ band: 1, process_area: 1 });
employeeSchema.index({ department: 1 });

export default mongoose.model("Employee", employeeSchema);
