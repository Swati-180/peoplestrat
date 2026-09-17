import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import Employee from '../models/Employee.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import FTEWorkload from '../models/FTEWorkload.js';

export async function up() {
  console.log('--- STARTING PHASE 4: MULTI-ORG TEST DATA ---');

  // 1. Find or create the Acme Corp organization
  let acmeOrg = await Organization.findOne({ name: 'Acme Corp' });
  if (!acmeOrg) {
    acmeOrg = await Organization.create({
      name: 'Acme Corp',
      domain: 'acmecorp.example.com',
      status: 'active'
    });
    console.log(`✓ Created Acme Corp organization (${acmeOrg._id})`);
  } else {
    console.log(`- Acme Corp already exists (${acmeOrg._id})`);
  }

  const demoOrg = await Organization.findOne({ name: 'Quintes Global Demo' });
  if (!demoOrg) {
    console.log('WARNING: Quintes Global Demo not found. Seed might not have run.');
  }

  // 2. Assign memberships to demo users
  const demoUsers = [
    { email: 'admin@peoplestat.com', role: 'admin' },
    { email: 'manager@peoplestat.com', role: 'manager' },
    { email: 'employee@peoplestat.com', role: 'employee' }
  ];

  for (const creds of demoUsers) {
    const user = await User.findOne({ email: creds.email });
    if (user) {
      const existingMem = await OrganizationMembership.findOne({
        userId: user._id,
        organizationId: acmeOrg._id
      });
      if (!existingMem) {
        await OrganizationMembership.create({
          organizationId: acmeOrg._id,
          userId: user._id,
          role: creds.role,
          status: 'active'
        });
        console.log(`✓ Created Acme Corp membership for ${creds.email} (${creds.role})`);
      } else {
        console.log(`- ${creds.email} already has Acme Corp membership. Skipping.`);
      }
    } else {
      console.log(`WARNING: User ${creds.email} not found.`);
    }
  }

  // 3. Create minimal test workforce data for Acme Corp to make switching visibly verifiable
  const acmeEmployees = [
    { name: 'Alice Smith', email: 'alice.smith@acmecorp.example.com', position: 'Acme Manager', department: 'Operations' },
    { name: 'Bob Jones', email: 'bob.jones@acmecorp.example.com', position: 'Acme Specialist', department: 'Operations' },
    { name: 'Demo Employee (Acme)', email: 'employee@peoplestat.com', position: 'Acme Tester', department: 'Testing' }
  ];

  for (const empData of acmeEmployees) {
    let emp = await Employee.findOne({ email: empData.email, organizationId: acmeOrg._id });
    if (!emp) {
      emp = await Employee.create({
        userid: `ACME-${empData.name.split(' ')[0].toUpperCase()}`,
        organizationId: acmeOrg._id,
        name: empData.name,
        email: empData.email,
        department: empData.department,
        position: empData.position,
        tenure: 2,
        baseSalary: 60000,
        currency: 'USD'
      });
      console.log(`✓ Created Acme Employee: ${empData.name}`);
      
      // Give them some PerformanceRecords so dashboard has stats
      await PerformanceRecord.create({
        organizationId: acmeOrg._id,
        employee_id: emp._id,
        tasks_completed: 100,
        expected_tasks: 100,
        working_hours: 40,
        error_rate: 0.05,
        department_process: empData.department
      });
    } else {
      console.log(`- Acme Employee ${empData.name} already exists. Skipping.`);
    }
  }

  // 4. Create one FTEWorkload record for Acme Corp
  const workloadExists = await FTEWorkload.findOne({ organizationId: acmeOrg._id });
  if (!workloadExists) {
    await FTEWorkload.create({
      organizationId: acmeOrg._id,
      process_name: 'Acme General Operations',
      sub_process: 'General',
      band: 'OR',
      required_fte: 2.5,
      actual_fte: 2,
      workload_volume: 500
    });
    console.log(`✓ Created Acme FTEWorkload`);
  } else {
    console.log(`- Acme FTEWorkload already exists. Skipping.`);
  }

  console.log('--- PHASE 4 MULTI-ORG TEST DATA COMPLETE ---');
}

if (import.meta.url.startsWith('file:') && (process.argv[1]?.endsWith('phase4_multi_org_test_data.js') || process.argv[1]?.endsWith('phase4_multi_org_test_data'))) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:64115/').then(async () => {
    await up();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
