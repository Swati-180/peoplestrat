import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Models
import JobDescription from '../models/jobDescriptions.js';
import SuccessionPlan from '../models/SuccessionPlan.js';
import LeadershipPipeline from '../models/LeadershipPipeline.js';
import DepartmentHealth from '../models/DepartmentHealth.js';
import FTEWorkload from '../models/FTEWorkload.js';
import PeerFeedback from '../models/PeerFeedback.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import Result from '../models/Result.js';
import Assessment from '../models/Assessment.js';
import Question from '../models/Question.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';

export async function up() {
  console.log('--- STARTING PHASE 4A MIGRATION ---');

  // 1. JobDescription
  const jds = await JobDescription.find({ organizationId: { $exists: false } });
  let unmappableJDs = 0;
  for (const jd of jds) {
    if (jd.createdBy) {
      const user = await User.findById(jd.createdBy);
      if (user && user.email) {
        const emp = await Employee.findOne({ email: user.email });
        if (emp && emp.organizationId) {
          jd.organizationId = emp.organizationId;
          await jd.save();
          continue;
        }
      }
    }
    unmappableJDs++;
  }
  console.log(`JobDescription: Migrated ${jds.length - unmappableJDs}, Unmappable: ${unmappableJDs}`);

  // 2. SuccessionPlan
  const plans = await SuccessionPlan.find({ organizationId: { $exists: false } });
  let unmappablePlans = 0;
  for (const plan of plans) {
    if (plan.targetRoleId) {
      const jd = await JobDescription.findById(plan.targetRoleId);
      if (jd && jd.organizationId) {
        plan.organizationId = jd.organizationId;
        await plan.save();
        continue;
      }
    }
    unmappablePlans++;
  }
  console.log(`SuccessionPlan: Migrated ${plans.length - unmappablePlans}, Unmappable: ${unmappablePlans}`);

  // 3. LeadershipPipeline
  const pipelines = await LeadershipPipeline.find({ organizationId: { $exists: false } });
  let unmappablePipelines = 0;
  for (const p of pipelines) {
    if (p.employeeId) {
      const emp = await Employee.findById(p.employeeId);
      if (emp && emp.organizationId) {
        p.organizationId = emp.organizationId;
        await p.save();
        continue;
      }
    }
    unmappablePipelines++;
  }
  console.log(`LeadershipPipeline: Migrated ${pipelines.length - unmappablePipelines}, Unmappable: ${unmappablePipelines}`);

  // 4. DepartmentHealth (Unmappable by design)
  const dHealth = await DepartmentHealth.find({ organizationId: { $exists: false } });
  console.log(`DepartmentHealth: Found ${dHealth.length} existing records. Unmappable: ${dHealth.length} (By design, strict non-inference).`);

  // 5. FTEWorkload (Unmappable by design)
  const fte = await FTEWorkload.find({ organizationId: { $exists: false } });
  console.log(`FTEWorkload: Found ${fte.length} existing records. Unmappable: ${fte.length} (By design, strict non-inference).`);

  // 6. PeerFeedback
  const feedbacks = await PeerFeedback.find({ organizationId: { $exists: false } });
  let unmappableFeedbacks = 0;
  for (const f of feedbacks) {
    if (f.targetEmployeeId) {
      const emp = await Employee.findById(f.targetEmployeeId);
      if (emp && emp.organizationId) {
        f.organizationId = emp.organizationId;
        await f.save();
        continue;
      }
    }
    unmappableFeedbacks++;
  }
  console.log(`PeerFeedback: Migrated ${feedbacks.length - unmappableFeedbacks}, Unmappable: ${unmappableFeedbacks}`);

  // 7. PerformanceRecord
  const perfs = await PerformanceRecord.find({ organizationId: { $exists: false } });
  let unmappablePerfs = 0;
  for (const p of perfs) {
    if (p.employee_id) {
      const emp = await Employee.findById(p.employee_id);
      if (emp && emp.organizationId) {
        p.organizationId = emp.organizationId;
        await p.save();
        continue;
      }
    }
    unmappablePerfs++;
  }
  console.log(`PerformanceRecord: Migrated ${perfs.length - unmappablePerfs}, Unmappable: ${unmappablePerfs}`);

  // 8. Result
  const results = await Result.find({ organizationId: { $exists: false } });
  let unmappableResults = 0;
  for (const r of results) {
    if (r.employeeId) {
      const emp = await Employee.findById(r.employeeId);
      if (emp && emp.organizationId) {
        r.organizationId = emp.organizationId;
        await r.save();
        continue;
      }
    }
    unmappableResults++;
  }
  console.log(`Result: Migrated ${results.length - unmappableResults}, Unmappable: ${unmappableResults}`);

  // 9. Assessment (Defaults to null)
  const assessments = await Assessment.find({ organizationId: { $exists: false } });
  for (const a of assessments) {
    a.organizationId = null; // Mark as global template
    await a.save();
  }
  console.log(`Assessment: Migrated ${assessments.length} to Global Templates (null organizationId)`);

  // 10. Question
  const questions = await Question.find({ organizationId: { $exists: false } });
  let unmappableQuestions = 0;
  for (const q of questions) {
    if (q.assessmentId) {
      const a = await Assessment.findById(q.assessmentId);
      if (a) {
        q.organizationId = a.organizationId; // copy from Assessment
        await q.save();
        continue;
      }
    }
    unmappableQuestions++;
  }
  console.log(`Question: Migrated ${questions.length - unmappableQuestions}, Unmappable: ${unmappableQuestions}`);

  console.log('--- PHASE 4A MIGRATION COMPLETE ---');
}

if (import.meta.url.startsWith('file:') && (process.argv[1]?.endsWith('phase4a_data_ownership.js') || process.argv[1]?.endsWith('phase4a_data_ownership'))) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-workforce').then(async () => {
    await up();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
