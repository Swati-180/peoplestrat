import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Employee from './models/Employee.js';
import AnalysisResult from './models/AnalysisResult.js';

const fix = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const sarah = await Employee.findOneAndUpdate(
    { name: 'Sarah Johnson' },
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@peoplestat.com',
      position: 'Senior Financial Analyst',
      band: 'M4',
      process_area: 'F&A',
      sub_process: 'Payment Processing',
      productivity: 92,
      utilization: 68,
      fitmentScore: 89,
      fatigueScore: 45,
      skills: ['Excel', 'SAP', 'Audit', 'Forecasting'],
      joiningDate: new Date(2022, 5, 20)
    },
    { upsert: true, new: true }
  );

  await AnalysisResult.findOneAndUpdate(
    { employee_id: sarah._id },
    {
      employee_id: sarah._id,
      productivity_score: 92,
      utilization_score: 68,
      fitment_score: 89,
      fatigue_score: 45,
      talent_category: 'Elite Asset',
      recommendation_type: 'promotion_candidate',
      recommendation: 'Sarah is a top performer in F&A. High readiness for Band M3.',
      details: {
        skill_match_score: 95,
        experience_score: 85,
        quality_score: 90
      }
    },
    { upsert: true }
  );

  console.log('Sarah Johnson added/updated.');
  process.exit(0);
};

fix();
