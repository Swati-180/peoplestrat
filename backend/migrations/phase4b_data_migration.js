import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import cvUploads from '../models/cvUploads.js';
import ActivityUpload from '../models/activityUploads.js';
import FitmentMatch from '../models/fitmentMatches.js';
import WellbeingCheckin from '../models/WellbeingCheckin.js';
import Employee from '../models/Employee.js';
import OrganizationMembership from '../models/OrganizationMembership.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplestrat';

async function migrateData() {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }
    console.log('Connected to DB for Phase 4B Migration');

    const report = {
      cvUploads: { migrated: 0, unmappable: 0, unmappableIds: [] },
      activityUploads: { migrated: 0, unmappable: 0, unmappableIds: [] },
      fitmentMatches: { migrated: 0, unmappable: 0, unmappableIds: [] },
      wellbeingCheckins: { migrated: 0, unmappable: 0, unmappableIds: [] }
    };

    // Helper to find organizationId for a user (assume first active membership)
    const getOrgForUser = async (userId) => {
      if (!userId) return null;
      const membership = await OrganizationMembership.findOne({ userId, status: 'active' });
      return membership ? membership.organizationId : null;
    };

    // Helper to find organizationId for an employee
    const getOrgForEmployee = async (employeeId) => {
      if (!employeeId) return null;
      const emp = await Employee.findById(employeeId);
      return emp ? emp.organizationId : null;
    };

    console.log('Processing cvUploads...');
    const cvs = await cvUploads.find({ organizationId: { $exists: false } });
    for (const cv of cvs) {
      const orgId = await getOrgForUser(cv.uploadedBy);
      if (orgId) {
        cv.organizationId = orgId;
        await cv.save();
        report.cvUploads.migrated++;
      } else {
        report.cvUploads.unmappable++;
        report.cvUploads.unmappableIds.push(cv._id);
      }
    }

    console.log('Processing ActivityUpload...');
    const activities = await ActivityUpload.find({ organizationId: { $exists: false } });
    for (const act of activities) {
      const orgId = await getOrgForUser(act.uploadedBy);
      if (orgId) {
        act.organizationId = orgId;
        await act.save();
        report.activityUploads.migrated++;
      } else {
        report.activityUploads.unmappable++;
        report.activityUploads.unmappableIds.push(act._id);
      }
    }

    console.log('Processing FitmentMatch...');
    const fitments = await FitmentMatch.find({ organizationId: { $exists: false } });
    for (const fit of fitments) {
      let orgId = await getOrgForEmployee(fit.employeeId);
      if (!orgId) {
        orgId = await getOrgForUser(fit.userId);
      }
      if (orgId) {
        fit.organizationId = orgId;
        await fit.save();
        report.fitmentMatches.migrated++;
      } else {
        report.fitmentMatches.unmappable++;
        report.fitmentMatches.unmappableIds.push(fit._id);
      }
    }

    console.log('Processing WellbeingCheckin...');
    const checkins = await WellbeingCheckin.find({ organizationId: { $exists: false } });
    for (const checkin of checkins) {
      const orgId = await getOrgForEmployee(checkin.employeeId);
      if (orgId) {
        checkin.organizationId = orgId;
        await checkin.save();
        report.wellbeingCheckins.migrated++;
      } else {
        report.wellbeingCheckins.unmappable++;
        report.wellbeingCheckins.unmappableIds.push(checkin._id);
      }
    }

    console.log('--- Phase 4B Migration Report ---');
    console.log(JSON.stringify(report, null, 2));
    
    // In test environment, don't exit process so tests can complete
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'test-migration') {
      process.exit(0);
    }
    return report;
  } catch (err) {
    console.error('Migration failed:', err);
    if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'test-migration') {
      process.exit(1);
    }
    throw err;
  }
}

// Add a way to invoke it conditionally
if (process.argv[1].includes('phase4b_data_migration.js')) {
  migrateData();
}

export { migrateData };
