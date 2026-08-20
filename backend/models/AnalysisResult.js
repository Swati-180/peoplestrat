import mongoose from 'mongoose';

const analysisResultSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
  productivity_score: { type: Number, default: 0, min: 0, max: 100 },
  utilization_score: { type: Number, default: 0, min: 0, max: 100 },
  fitment_score: { type: Number, default: 0, min: 0, max: 100 },
  fatigue_score: { type: Number, default: 0, min: 0, max: 100 },
  recommendation: { type: String, default: '' },
  recommendation_type: { 
    type: String, 
    enum: [
      'high_performer', 
      'promotion_candidate', 
      'burnout_risk', 
      'role_misalignment', 
      'underutilized', 
      'overloaded', 
      'automation_opportunity',
      'stable'
    ],
    default: 'stable'
  },
  matrix_x: { type: Number, min: 1, max: 6, default: 3 }, // Potential axis
  matrix_y: { type: Number, min: 1, max: 6, default: 3 }, // Performance axis
  talent_category: { type: String, default: 'Core Contributor' },
  analysis_date: { type: Date, default: Date.now, index: true },
  details: {
    overtime_index: { type: Number, default: 0 },
    workload_intensity: { type: Number, default: 0 },
    performance_decline: { type: Number, default: 0 },
    skill_match_score: { type: Number, default: 0 },
    experience_score: { type: Number, default: 0 },
    quality_score: { type: Number, default: 0 },
  },
  flightRiskScore: { type: Number, min: 0, max: 100 },
  flightRiskFactors: [{ type: String }],
  stressPredictionScore: { type: Number, min: 0, max: 100 },
  criticalTalentRiskScore: { type: Number, min: 0, max: 100 },
  workforceReadinessScore: { type: Number, min: 0, max: 100 },
  actionItems: [{
    action: String,
    priority: String,
    timeline: String,
    status: { type: String, enum: ['Suggested', 'Accepted', 'Completed', 'Ignored'], default: 'Suggested' }
  }]
}, { timestamps: true });

// Only keep the latest analysis per employee (or use for historical trend)
analysisResultSchema.index({ employee_id: 1, analysis_date: -1 });

export default mongoose.model('AnalysisResult', analysisResultSchema);
