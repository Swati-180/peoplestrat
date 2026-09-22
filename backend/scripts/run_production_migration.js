import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Invitation from '../models/Invitation.js';
import BehavioralResult from '../models/BehavioralResult.js';
import PulseCheck from '../models/PulseCheck.js';
import AnalysisResult from '../models/AnalysisResult.js';
import QuizResult from '../models/QuizResult.js';
import cvUploads from '../models/cvUploads.js';
import ActivityUpload from '../models/activityUploads.js';
import FitmentMatch from '../models/fitmentMatches.js';
// Pull in Phase 4A logic dependencies
import LeadershipPipeline from '../models/LeadershipPipeline.js';
import PeerFeedback from '../models/PeerFeedback.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import Result from '../models/Result.js';
import SuccessionPlan from '../models/SuccessionPlan.js';
import JobDescription from '../models/jobDescriptions.js';
import FTEWorkload from '../models/FTEWorkload.js';
import DepartmentHealth from '../models/DepartmentHealth.js';

const runMigration = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('FATAL ERROR: process.env.MONGO_URI is missing. Migration requires a valid MongoDB connection string.');
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('Connected to MongoDB for Production Data Migration');

    const unmappableReports = [];
    const handleUnmappable = (model, _id, reason) => {
      unmappableReports.push({ model, _id: _id.toString(), reason });
    };

    // 1. Ensure Default Organization Exists (for admins/users without one)
    let defaultOrg = await Organization.findOne({ name: 'PeopleStrat Default' });
    if (!defaultOrg) {
      defaultOrg = await Organization.create({ name: 'PeopleStrat Default', status: 'active' });
      console.log('Created default organization.');
    }

    // 2. Create OrganizationMemberships for existing Users (who have none)
    const users = await User.find({});
    for (const user of users) {
      const membershipCount = await OrganizationMembership.countDocuments({ userId: user._id });
      if (membershipCount === 0) {
        await OrganizationMembership.create({
          userId: user._id,
          organizationId: defaultOrg._id,
          role: user.role || 'employee',
          status: 'active'
        });
      }
    }

    // Helper to get organizationId for a User
    const getOrgForUser = async (userId) => {
      const memberships = await OrganizationMembership.find({ userId, status: 'active' });
      if (memberships.length === 1) {
        return { orgId: memberships[0].organizationId, error: null };
      } else if (memberships.length > 1) {
        return { orgId: null, error: `Ambiguous: User has ${memberships.length} active memberships` };
      }
      return { orgId: null, error: 'User has no active memberships' };
    };

    // 3. Map Employees
    // Try to map by userid -> User -> OrganizationMembership
    const employees = await Employee.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const emp of employees) {
      let orgId = null;
      let errorReason = 'No userid or matching email to determine organization';
      if (emp.userid) {
        const result = await getOrgForUser(emp.userid);
        if (result.orgId) { orgId = result.orgId; }
        else { errorReason = `Userid: ${result.error}`; }
      } else if (emp.email) {
        // Fallback: look up user by email
        const user = await User.findOne({ email: emp.email.toLowerCase() });
        if (user) {
          const result = await getOrgForUser(user._id);
          if (result.orgId) { orgId = result.orgId; }
          else { errorReason = `Email: ${result.error}`; }
        }
      }

      if (orgId) {
        emp.organizationId = orgId;
        await emp.save();
      } else {
        handleUnmappable('Employee', emp._id, errorReason);
      }
    }

    // 4. Map Invitations (by invitedBy)
    const invitations = await Invitation.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const inv of invitations) {
      if (inv.invitedBy) {
        const result = await getOrgForUser(inv.invitedBy);
        if (result.orgId) {
          inv.organizationId = result.orgId;
          await inv.save();
        } else {
          handleUnmappable('Invitation', inv._id, `Inviter: ${result.error}`);
        }
      } else {
        handleUnmappable('Invitation', inv._id, 'No invitedBy reference');
      }
    }

    // 5. Map cvUploads (by uploadedBy)
    const uploads = await cvUploads.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const upload of uploads) {
      if (upload.uploadedBy) {
        const result = await getOrgForUser(upload.uploadedBy);
        if (result.orgId) {
          upload.organizationId = result.orgId;
          await upload.save();
        } else {
          handleUnmappable('cvUploads', upload._id, `Uploader: ${result.error}`);
        }
      } else {
        handleUnmappable('cvUploads', upload._id, 'No uploadedBy reference');
      }
    }

    // 6. Map other Employee-dependent records using Phase 4A Logic
    const employeeDependentModels = [
      { Model: BehavioralResult, field: 'employeeId', name: 'BehavioralResult' },
      { Model: PulseCheck, field: 'employeeId', name: 'PulseCheck' },
      { Model: AnalysisResult, field: 'employee_id', name: 'AnalysisResult' },
      { Model: QuizResult, field: 'employeeId', name: 'QuizResult' },
      { Model: LeadershipPipeline, field: 'employeeId', name: 'LeadershipPipeline' },
      { Model: PerformanceRecord, field: 'employee_id', name: 'PerformanceRecord' },
      { Model: Result, field: 'employeeId', name: 'Result' }
    ];

    for (const { Model, field, name } of employeeDependentModels) {
      const records = await Model.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
      for (const rec of records) {
        if (rec[field]) {
          const emp = await Employee.findById(rec[field]);
          if (emp && emp.organizationId) {
            rec.organizationId = emp.organizationId;
            await rec.save();
          } else {
            handleUnmappable(name, rec._id, `Referenced Employee (${rec[field]}) has no organization or does not exist`);
          }
        } else {
          handleUnmappable(name, rec._id, `No ${field} reference`);
        }
      }
    }

    // 7. Map PeerFeedback (targetEmployeeId)
    const feedbacks = await PeerFeedback.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const f of feedbacks) {
      if (f.targetEmployeeId) {
        const emp = await Employee.findById(f.targetEmployeeId);
        if (emp && emp.organizationId) {
          f.organizationId = emp.organizationId;
          await f.save();
        } else {
          handleUnmappable('PeerFeedback', f._id, 'Referenced targetEmployee has no organizationId');
        }
      } else {
        handleUnmappable('PeerFeedback', f._id, 'No targetEmployeeId reference');
      }
    }

    // 8. Map SuccessionPlan (infer from candidates)
    const plans = await SuccessionPlan.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const sp of plans) {
      if (sp.candidates && sp.candidates.length > 0 && sp.candidates[0].employeeId) {
        const emp = await Employee.findById(sp.candidates[0].employeeId);
        if (emp && emp.organizationId) {
          sp.organizationId = emp.organizationId;
          await sp.save();
        } else {
          handleUnmappable('SuccessionPlan', sp._id, 'Candidate employee has no organizationId');
        }
      } else {
        handleUnmappable('SuccessionPlan', sp._id, 'No candidates to infer organization from');
      }
    }

    // 9. Map JobDescription (infer from SuccessionPlan)
    const jds = await JobDescription.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const jd of jds) {
      const sp = await SuccessionPlan.findOne({ targetRoleId: jd._id, organizationId: { $ne: null } });
      if (sp && sp.organizationId) {
        jd.organizationId = sp.organizationId;
        await jd.save();
      } else {
        handleUnmappable('JobDescription', jd._id, 'No linked SuccessionPlan with an organizationId');
      }
    }

    // 10. Map ActivityUpload (by uploadedBy)
    const activities = await ActivityUpload.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const activity of activities) {
      if (activity.uploadedBy) {
        const result = await getOrgForUser(activity.uploadedBy);
        if (result.orgId) {
          activity.organizationId = result.orgId;
          await activity.save();
        } else {
          handleUnmappable('ActivityUpload', activity._id, `Uploader: ${result.error}`);
        }
      } else {
        handleUnmappable('ActivityUpload', activity._id, 'No uploadedBy reference');
      }
    }

    // 11. Map FitmentMatch (by employeeId, then userId, then jdId)
    const fitments = await FitmentMatch.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const fit of fitments) {
      let orgId = null;
      let errorReason = 'No valid employeeId, userId, or jdId reference to infer organization';
      if (fit.employeeId) {
        const emp = await Employee.findById(fit.employeeId);
        if (emp && emp.organizationId) { orgId = emp.organizationId; }
      }
      if (!orgId && fit.userId) {
        const result = await getOrgForUser(fit.userId);
        if (result.orgId) { orgId = result.orgId; }
        else { errorReason = `User: ${result.error}`; }
      }
      if (!orgId && fit.jdId) {
        const jd = await JobDescription.findById(fit.jdId);
        if (jd && jd.organizationId) { orgId = jd.organizationId; }
      }

      if (orgId) {
        fit.organizationId = orgId;
        await fit.save();
      } else {
        handleUnmappable('FitmentMatch', fit._id, errorReason);
      }
    }

    // 12. FTEWorkload / DepartmentHealth (No relations)
    const workloads = await FTEWorkload.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const w of workloads) {
      handleUnmappable('FTEWorkload', w._id, 'No logical relationship available to infer organizationId');
    }

    const healths = await DepartmentHealth.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
    for (const h of healths) {
      handleUnmappable('DepartmentHealth', h._id, 'No logical relationship available to infer organizationId');
    }

    console.log('--- PRODUCTION MIGRATION COMPLETE ---');
    if (unmappableReports.length > 0) {
      console.log(`Unmappable Records (${unmappableReports.length}):`);
      console.table(unmappableReports);
    } else {
      console.log('No unmappable records found.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runMigration();
