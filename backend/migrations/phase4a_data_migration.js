import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Organization from '../models/Organization.js';
import Employee from '../models/Employee.js';
import JobDescription from '../models/jobDescriptions.js';
import SuccessionPlan from '../models/SuccessionPlan.js';
import LeadershipPipeline from '../models/LeadershipPipeline.js';
import FTEWorkload from '../models/FTEWorkload.js';
import DepartmentHealth from '../models/DepartmentHealth.js';
import PeerFeedback from '../models/PeerFeedback.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import Result from '../models/Result.js';

export async function up() {
  console.log('--- STARTING PHASE 4A-1: DATA MIGRATION ---');

  const unmappableReports = [];

  const handleUnmappable = (model, _id, reason) => {
    unmappableReports.push({ model, _id: _id.toString(), reason });
  };

  // 1. LeadershipPipeline
  const pipelines = await LeadershipPipeline.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
  for (const p of pipelines) {
    if (p.employeeId) {
      const emp = await Employee.findById(p.employeeId);
      if (emp && emp.organizationId) {
        p.organizationId = emp.organizationId;
        await p.save();
      } else {
        handleUnmappable('LeadershipPipeline', p._id, 'Referenced Employee has no organizationId or does not exist');
      }
    } else {
      handleUnmappable('LeadershipPipeline', p._id, 'No employeeId reference');
    }
  }

  // 2. PeerFeedback
  const feedbacks = await PeerFeedback.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
  for (const f of feedbacks) {
    if (f.targetEmployeeId) {
      const emp = await Employee.findById(f.targetEmployeeId);
      if (emp && emp.organizationId) {
        f.organizationId = emp.organizationId;
        await f.save();
      } else {
        handleUnmappable('PeerFeedback', f._id, 'Referenced targetEmployee has no organizationId or does not exist');
      }
    } else {
      handleUnmappable('PeerFeedback', f._id, 'No targetEmployeeId reference');
    }
  }

  // 3. PerformanceRecord
  const perfRecords = await PerformanceRecord.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
  for (const pr of perfRecords) {
    if (pr.employee_id) {
      const emp = await Employee.findById(pr.employee_id);
      if (emp && emp.organizationId) {
        pr.organizationId = emp.organizationId;
        await pr.save();
      } else {
        handleUnmappable('PerformanceRecord', pr._id, 'Referenced Employee has no organizationId or does not exist');
      }
    } else {
      handleUnmappable('PerformanceRecord', pr._id, 'No employee_id reference');
    }
  }

  // 4. Result
  const results = await Result.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
  for (const r of results) {
    if (r.employeeId) {
      const emp = await Employee.findById(r.employeeId);
      if (emp && emp.organizationId) {
        r.organizationId = emp.organizationId;
        await r.save();
      } else {
        handleUnmappable('Result', r._id, 'Referenced Employee has no organizationId or does not exist');
      }
    } else {
       handleUnmappable('Result', r._id, 'No employeeId reference');
    }
  }

  // 5. SuccessionPlan
  const plans = await SuccessionPlan.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
  for (const sp of plans) {
    if (sp.candidates && sp.candidates.length > 0 && sp.candidates[0].employeeId) {
      const emp = await Employee.findById(sp.candidates[0].employeeId);
      if (emp && emp.organizationId) {
        sp.organizationId = emp.organizationId;
        await sp.save();
      } else {
        handleUnmappable('SuccessionPlan', sp._id, 'First candidate employee has no organizationId or does not exist');
      }
    } else {
      handleUnmappable('SuccessionPlan', sp._id, 'No candidates to infer organizationId from');
    }
  }

  // 6. JobDescription
  const jds = await JobDescription.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
  for (const jd of jds) {
    // Check if any SuccessionPlan links to it
    const sp = await SuccessionPlan.findOne({ targetRoleId: jd._id, organizationId: { $ne: null } });
    if (sp && sp.organizationId) {
      jd.organizationId = sp.organizationId;
      await jd.save();
    } else {
      handleUnmappable('JobDescription', jd._id, 'No linked SuccessionPlan with an organizationId');
    }
  }

  // 7. FTEWorkload
  const workloads = await FTEWorkload.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
  for (const w of workloads) {
     handleUnmappable('FTEWorkload', w._id, 'No logical relationship available to infer organizationId');
  }

  // 8. DepartmentHealth
  const healths = await DepartmentHealth.find({ $or: [{ organizationId: { $exists: false } }, { organizationId: null }] });
  for (const h of healths) {
     handleUnmappable('DepartmentHealth', h._id, 'No logical relationship available to infer organizationId');
  }

  console.log('--- PHASE 4A-1 MIGRATION COMPLETE ---');
  if (unmappableReports.length > 0) {
    console.log('Unmappable Records:');
    console.table(unmappableReports);
  } else {
    console.log('No unmappable records found.');
  }
  
  return { unmappableReports };
}

if (import.meta.url.startsWith('file:') && (process.argv[1]?.endsWith('phase4a_data_migration.js'))) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:64115/').then(async () => {
    await up();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
