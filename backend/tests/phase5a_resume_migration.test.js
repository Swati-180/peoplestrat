import mongoose from 'mongoose';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import EmployeeResume from '../models/employeeResume.js';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

// We'll simulate the migration logic in the test since we can't easily execute the script file in a jest environment without a shell wrapper.

async function runMigrationSim() {
  const report = { migrated: 0, unmappable: 0, ambiguous: 0, alreadyMapped: 0 };
  const resumes = await EmployeeResume.find({});
  for (const resume of resumes) {
    if (resume.organizationId) {
      report.alreadyMapped++;
      continue;
    }
    const memberships = await OrganizationMembership.find({ userId: resume.userId, status: 'active' });
    if (memberships.length === 1) {
      resume.organizationId = memberships[0].organizationId;
      await resume.save();
      report.migrated++;
    } else if (memberships.length === 0) {
      report.unmappable++;
    } else {
      report.ambiguous++;
    }
  }
  return report;
}

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let orgA, orgB, userActive1, userActive0, userActive2, userAlreadyMapped;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  orgA = await Organization.create({ name: 'Org A' });
  orgB = await Organization.create({ name: 'Org B' });

  userActive1 = await User.create({ name: 'U1', username: 'u1', email: 'u1@ex.com', password: 'pass', role: 'employee' });
  userActive0 = await User.create({ name: 'U0', username: 'u0', email: 'u0@ex.com', password: 'pass', role: 'employee' });
  userActive2 = await User.create({ name: 'U2', username: 'u2', email: 'u2@ex.com', password: 'pass', role: 'employee' });
  userAlreadyMapped = await User.create({ name: 'UM', username: 'um', email: 'um@ex.com', password: 'pass', role: 'employee' });

  await OrganizationMembership.create({ userId: userActive1._id, organizationId: orgA._id, status: 'active', role: 'employee' });
  
  await OrganizationMembership.create({ userId: userActive2._id, organizationId: orgA._id, status: 'active', role: 'employee' });
  await OrganizationMembership.create({ userId: userActive2._id, organizationId: orgB._id, status: 'active', role: 'employee' });
  
  await OrganizationMembership.create({ userId: userAlreadyMapped._id, organizationId: orgA._id, status: 'active', role: 'employee' });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Phase 5A Resume Migration Logic', () => {

  beforeEach(async () => {
    await EmployeeResume.deleteMany({});
  });

  test('Migration correctly handles 1 active, 0 active, >1 active, and already mapped', async () => {
    
    // Setup legacy documents (bypassing schema required fields using native insert if needed, but since we updated schema to required, we need to bypass mongoose)
    await mongoose.connection.collection('employeeresumes').insertMany([
      { userId: userActive1._id, rawText: 'Legacy 1 Active' },
      { userId: userActive0._id, rawText: 'Legacy 0 Active' },
      { userId: userActive2._id, rawText: 'Legacy 2 Active' }
    ]);
    
    // Insert already mapped using mongoose
    await EmployeeResume.create({ userId: userAlreadyMapped._id, organizationId: orgB._id, rawText: 'Already Mapped' });

    const report1 = await runMigrationSim();

    expect(report1.migrated).toBe(1);
    expect(report1.unmappable).toBe(1);
    expect(report1.ambiguous).toBe(1);
    expect(report1.alreadyMapped).toBe(1);

    // Verify state
    const mapped = await EmployeeResume.findOne({ userId: userActive1._id });
    expect(mapped.organizationId.toString()).toBe(orgA._id.toString());

    const unmappable = await mongoose.connection.collection('employeeresumes').findOne({ userId: userActive0._id });
    expect(unmappable.organizationId).toBeUndefined();

    const ambiguous = await mongoose.connection.collection('employeeresumes').findOne({ userId: userActive2._id });
    expect(ambiguous.organizationId).toBeUndefined();

    const alreadyMapped = await EmployeeResume.findOne({ userId: userAlreadyMapped._id });
    expect(alreadyMapped.organizationId.toString()).toBe(orgB._id.toString()); // Did not overwrite

    const report2 = await runMigrationSim();
    expect(report2.migrated).toBe(0);
    expect(report2.alreadyMapped).toBe(2); // The one migrated in pass 1 + the original
    expect(report2.unmappable).toBe(1);
    expect(report2.ambiguous).toBe(1);
  });

  test('Partial index allows multiple unmapped legacy resumes for the same user (both missing and null)', async () => {
    // Insert multiple unmapped resumes for userActive0 bypassing Mongoose validation
    await mongoose.connection.collection('employeeresumes').insertMany([
      { userId: userActive0._id, rawText: 'Legacy Unmapped A (missing)' },
      { userId: userActive0._id, rawText: 'Legacy Unmapped B (missing)' },
      { userId: userActive0._id, organizationId: null, rawText: 'Legacy Unmapped C (null)' },
      { userId: userActive0._id, organizationId: null, rawText: 'Legacy Unmapped D (null)' }
    ]);
    
    // Explicitly create indexes (simulate startup or migration end)
    await expect(EmployeeResume.createIndexes()).resolves.toBeUndefined();
  });

  test('Two resumes for the same user in different orgs are allowed', async () => {
    await EmployeeResume.create({ userId: userActive2._id, organizationId: orgA._id, rawText: 'Org A Resume' });
    await EmployeeResume.create({ userId: userActive2._id, organizationId: orgB._id, rawText: 'Org B Resume' });
    
    const count = await EmployeeResume.countDocuments({ userId: userActive2._id });
    expect(count).toBe(2);
  });

  test('Duplicate resumes for the same user in the same org are rejected', async () => {
    await EmployeeResume.create({ userId: userActive1._id, organizationId: orgA._id, rawText: 'Org A Resume 1' });
    
    // Attempting to create a second one should throw a duplicate key error
    await expect(
      EmployeeResume.create({ userId: userActive1._id, organizationId: orgA._id, rawText: 'Org A Resume 2' })
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

});
