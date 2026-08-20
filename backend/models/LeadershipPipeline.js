import mongoose from 'mongoose';

const LeadershipPipelineSchema = new mongoose.Schema({
  employeeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Employee', 
    required: true,
    unique: true
  },
  stage: { 
    type: String, 
    enum: ['Executive Track', 'Ready for Management', 'Emerging Leader', 'Individual Contributor'],
    required: true
  },
  source: {
    type: String,
    enum: ['AI Recommended', 'Manual Override'],
    required: true
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
});

const LeadershipPipeline = mongoose.model('LeadershipPipeline', LeadershipPipelineSchema);
export default LeadershipPipeline;
