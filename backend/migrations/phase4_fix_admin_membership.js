import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import Employee from '../models/Employee.js';

export async function up() {
  console.log('--- STARTING PHASE 4 REPAIR: ADMIN/MANAGER MEMBERSHIPS ---');

  // 1. Find the default Demo Organization
  const demoOrg = await Organization.findOne({ name: 'Quintes Global Demo' });
  if (!demoOrg) {
    console.log('No default Organization found. Ensure seed.js has run. Aborting repair.');
    return;
  }
  console.log(`Found Organization: ${demoOrg.name} (${demoOrg._id})`);

  // 2. Find Admin User
  const adminUser = await User.findOne({ email: 'admin@peoplestat.com', role: 'admin' });
  if (adminUser) {
    const existingAdminMem = await OrganizationMembership.findOne({
      userId: adminUser._id,
      organizationId: demoOrg._id
    });
    if (!existingAdminMem) {
      await OrganizationMembership.create({
        organizationId: demoOrg._id,
        userId: adminUser._id,
        role: 'admin',
        status: 'active'
      });
      console.log(`✓ Created missing OrganizationMembership for Admin (${adminUser.email})`);
    } else {
      console.log(`- Admin already has an OrganizationMembership. Skipping.`);
    }
  } else {
    console.log('- Admin user not found. Skipping.');
  }

  // 3. Find Manager User
  const managerUser = await User.findOne({ email: 'manager@peoplestat.com', role: 'manager' });
  if (managerUser) {
    const existingManagerMem = await OrganizationMembership.findOne({
      userId: managerUser._id,
      organizationId: demoOrg._id
    });
    if (!existingManagerMem) {
      await OrganizationMembership.create({
        organizationId: demoOrg._id,
        userId: managerUser._id,
        role: 'manager',
        status: 'active'
      });
      console.log(`✓ Created missing OrganizationMembership for Manager (${managerUser.email})`);
    } else {
      console.log(`- Manager already has an OrganizationMembership. Skipping.`);
    }
  } else {
    console.log('- Manager user not found. Skipping.');
  }

  // 4. Find ALL Employee Users and create Memberships based on Employee Document
  const employeeUsers = await User.find({ role: 'employee' });
  for (const empUser of employeeUsers) {
    // Deterministic match by email to find corresponding Employee record
    const empDoc = await Employee.findOne({ email: empUser.email });
    
    if (empDoc && empDoc.organizationId) {
      const existingEmpMem = await OrganizationMembership.findOne({
        userId: empUser._id,
        organizationId: empDoc.organizationId
      });

      if (!existingEmpMem) {
        await OrganizationMembership.create({
          organizationId: empDoc.organizationId,
          userId: empUser._id,
          role: 'employee',
          status: 'active'
        });
        console.log(`✓ Created missing OrganizationMembership for Employee (${empUser.email}) linked to Org (${empDoc.organizationId})`);
      } else {
        console.log(`- Employee ${empUser.email} already has an OrganizationMembership. Skipping.`);
      }
    } else {
      console.log(`- No valid Employee document with organizationId found for user ${empUser.email}. Skipping.`);
    }
  }

  console.log('--- PHASE 4 REPAIR COMPLETE ---');
}

if (import.meta.url.startsWith('file:') && (process.argv[1]?.endsWith('phase4_fix_admin_membership.js') || process.argv[1]?.endsWith('phase4_fix_admin_membership'))) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/peoplestrat_local').then(async () => {
    await up();
    process.exit(0);
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
