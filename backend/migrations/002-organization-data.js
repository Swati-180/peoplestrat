import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../models/Organization.js';
import Employee from '../models/Employee.js';
import Invitation from '../models/Invitation.js';
import BehavioralResult from '../models/BehavioralResult.js';
import PulseCheck from '../models/PulseCheck.js';
import AnalysisResult from '../models/AnalysisResult.js';
import QuizResult from '../models/QuizResult.js';

dotenv.config();

const runMigration = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/peoplestrat_local');
      console.log('Connected to MongoDB for Phase 3A Migration');
    }

    // 1. Get Default Organization
    let defaultOrg = await Organization.findOne({ name: 'PeopleStrat Default' });
    if (!defaultOrg) {
      console.log('Default organization not found. Creating it just in case...');
      defaultOrg = await Organization.create({
        name: 'PeopleStrat Default',
        status: 'active'
      });
    }
    const orgId = defaultOrg._id;
    console.log(`Using default organization: ${defaultOrg.name} (${orgId})`);

    // Helper for idempotency
    const updateRecords = async (Model, modelName) => {
      const result = await Model.updateMany(
        { $or: [{ organizationId: { $exists: false } }, { organizationId: null }] },
        { $set: { organizationId: orgId } }
      );
      console.log(`- ${modelName}: Updated ${result.modifiedCount} records.`);
      return result.modifiedCount;
    };

    // 2. Map existing records
    console.log('\nMapping existing records to default organization...');
    const migratedCounts = {
      Employee: await updateRecords(Employee, 'Employee'),
      Invitation: await updateRecords(Invitation, 'Invitation'),
      BehavioralResult: await updateRecords(BehavioralResult, 'BehavioralResult'),
      PulseCheck: await updateRecords(PulseCheck, 'PulseCheck'),
      AnalysisResult: await updateRecords(AnalysisResult, 'AnalysisResult'),
      QuizResult: await updateRecords(QuizResult, 'QuizResult')
    };

    console.log('\nMigration Complete.');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    // Only exit if we initiated the connection (not if running in a test suite)
    if (process.argv[1].endsWith('002-organization-data.js')) {
      await mongoose.disconnect();
      process.exit(0);
    }
  }
};

// Execute if run directly
if (process.argv[1].endsWith('002-organization-data.js')) {
  runMigration();
}

export default runMigration;
