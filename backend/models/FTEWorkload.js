import mongoose from 'mongoose';

const fteWorkloadSchema = new mongoose.Schema({
  process_name: { type: String, required: true, index: true }, // F&A, PSS, SAP
  sub_process: { type: String, required: true }, // Invoice Posting, SAP Support, etc.
  band: { 
    type: String, 
    enum: ['OR', 'D3', 'D2', 'D1', 'M4', 'M3', 'M2', 'M1', 'L3', 'L2', 'L1'],
    required: true 
  },
  required_fte: { type: Number, required: true, default: 0 }, // Full-time equivalent needed
  actual_fte: { type: Number, default: 0 }, // Actual FTE allocated
  workload_volume: { type: Number, default: 0 }, // Volume of work items
  is_repetitive: { type: Boolean, default: false },
  is_rule_based: { type: Boolean, default: false },
  automation_potential: { type: Number, default: 0, min: 0, max: 100 }, // 0-100 score
  estimated_cost_per_fte: { type: Number, default: 0 }, // Annual cost per FTE for savings calc
  projectedGrowthRate: { type: Number },
  forecastedFte: { type: Number },
}, { timestamps: true });

// Compound index for process + band queries
fteWorkloadSchema.index({ process_name: 1, band: 1 });

export default mongoose.model('FTEWorkload', fteWorkloadSchema);
