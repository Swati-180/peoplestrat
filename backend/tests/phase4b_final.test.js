import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import { migrateData } from '../migrations/phase4b_data_migration.js';

import Organization from '../models/Organization.js';
import User from '../models/User.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import JobDescription from '../models/jobDescriptions.js';
import cvUploads from '../models/cvUploads.js';
import ActivityUpload from '../models/activityUploads.js';
import WellbeingCheckin from '../models/WellbeingCheckin.js';
import Employee from '../models/Employee.js';

import { getUploadStats } from '../controllers/uploadController.js';

// Setup Mock App
const app = express();
app.use(express.json());

// Mock middleware to simulate authenticated organization routes
const mockAuthAndOrg = (req, res, next) => {
  req.organizationId = req.headers['x-org-id'];
  req.user = { id: new mongoose.Types.ObjectId() }; // mock user ID
  next();
};

app.get('/api/stats', mockAuthAndOrg, getUploadStats);

let mongoServer;
let orgAId;
let orgBId;
let userAId;

beforeAll(async () => {
  process.env.NODE_ENV = 'test-migration';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await mongoose.connection.dropDatabase();
  
  // Setup Orgs
  const orgA = await Organization.create({ name: 'Org A', domains: ['orga.com'], tier: 'Enterprise' });
  const orgB = await Organization.create({ name: 'Org B', domains: ['orgb.com'], tier: 'Pro' });
  orgAId = orgA._id;
  orgBId = orgB._id;
  
  // Create user and membership for Org A
  const userA = await User.create({ username: 'usera', name: 'User A', email: 'a@orga.com', password: 'password', role: 'manager' });
  userAId = userA._id;
  await OrganizationMembership.create({ organizationId: orgAId, userId: userAId, role: 'manager', status: 'active' });
  // Routes are already setup to use x-org-id header
});

describe('Phase 4B Security & Migration Tests', () => {
  
  test('WellbeingCheckin rejects creation without organizationId', async () => {
    const checkin = new WellbeingCheckin({
      employeeId: new mongoose.Types.ObjectId(),
      date: new Date(),
      source: 'SelfCheckin',
      moodScore: 3
    });
    
    let error;
    try {
      await checkin.save();
    } catch (err) {
      error = err;
    }
    
    expect(error).toBeDefined();
    expect(error.name).toBe('ValidationError');
    expect(error.errors.organizationId).toBeDefined();
  });
  
  test('Migration never assigns an unmappable record to a default organization and leaves it untouched', async () => {
    // Insert cvUploads without organizationId directly via native driver to bypass mongoose schema validation if needed
    await cvUploads.collection.insertOne({
      candidateName: 'Orphan Candidate',
      email: 'orphan@test.com',
      uploadedBy: new mongoose.Types.ObjectId() // No membership exists for this user
    });
    
    const initialCount = await cvUploads.collection.countDocuments({ organizationId: { $exists: false } });
    expect(initialCount).toBe(1);
    
    const report = await migrateData();
    
    expect(report.cvUploads.unmappable).toBe(1);
    expect(report.cvUploads.migrated).toBe(0);
    
    const finalCount = await cvUploads.collection.countDocuments({ organizationId: { $exists: false } });
    expect(finalCount).toBe(1); // Left untouched
  });

  test('Migration correctly maps mappable records', async () => {
    // Create record with uploadedBy linked to User A (Org A)
    await cvUploads.collection.insertOne({
      candidateName: 'Mappable Candidate',
      uploadedBy: userAId
    });
    
    const report = await migrateData();
    expect(report.cvUploads.migrated).toBe(1);
    
    const mapped = await cvUploads.findOne({ candidateName: 'Mappable Candidate' });
    expect(mapped.organizationId.toString()).toBe(orgAId.toString());
  });

  test('getUploadStats strictly counts records for the active organization only', async () => {
    // Org A records
    await JobDescription.create({ organizationId: orgAId, title: 'JD A' });
    await cvUploads.create({ organizationId: orgAId, candidateName: 'CV A' });
    await ActivityUpload.create({ organizationId: orgAId, user: 'A', activityType: 'meeting', date: new Date(), durationMinutes: 60 });
    
    // Org B records
    await JobDescription.create({ organizationId: orgBId, title: 'JD B1' });
    await JobDescription.create({ organizationId: orgBId, title: 'JD B2' });
    await cvUploads.create({ organizationId: orgBId, candidateName: 'CV B1' });
    
    // Stats for Org A
    const resA = await request(app).get(`/api/stats`).set('x-org-id', orgAId.toString());
    expect(resA.status).toBe(200);
    
    const statsA = resA.body;
    expect(statsA.find(s => s.type === 'jd').count).toBe(1);
    expect(statsA.find(s => s.type === 'cv').count).toBe(1);
    expect(statsA.find(s => s.type === 'activity').count).toBe(1);
    
    // Stats for Org B
    const resB = await request(app).get(`/api/stats`).set('x-org-id', orgBId.toString());
    expect(resB.status).toBe(200);
    
    const statsB = resB.body;
    expect(statsB.find(s => s.type === 'jd').count).toBe(2);
    expect(statsB.find(s => s.type === 'cv').count).toBe(1);
    expect(statsB.find(s => s.type === 'activity').count).toBe(0);
  });
});
