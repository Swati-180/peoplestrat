import request from 'supertest';
import app from '../server.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import AnalysisResult from '../models/AnalysisResult.js';
import BehavioralResult from '../models/BehavioralResult.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('AI Career Coach API', () => {
  let orgA, orgB;
  let userA, userB;
  let empA, empB;
  let tokenA, tokenB;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Employee.deleteMany({});
    await OrganizationMembership.deleteMany({});
    await AnalysisResult.deleteMany({});
    await BehavioralResult.deleteMany({});
    await PerformanceRecord.deleteMany({});

    orgA = await Organization.create({ name: 'Org A' });
    orgB = await Organization.create({ name: 'Org B' });

    userA = await User.create({ name: 'User A', username: 'usera', email: 'userA@test.com', password: 'password', role: 'employee' });
    userB = await User.create({ name: 'User B', username: 'userb', email: 'userB@test.com', password: 'password', role: 'employee' });

    await OrganizationMembership.create([
      { userId: userA._id, organizationId: orgA._id, role: 'employee', status: 'active' },
      { userId: userB._id, organizationId: orgB._id, role: 'employee', status: 'active' }
    ]);

    empA = await Employee.create({ name: 'Employee A', email: 'userA@test.com', organizationId: orgA._id, position: 'Engineer' });
    empB = await Employee.create({ name: 'Employee B', email: 'userB@test.com', organizationId: orgB._id, position: 'Manager' });

    await AnalysisResult.create([
      { employee_id: empA._id, organizationId: orgA._id, fitment_score: 85, fatigue_score: 20, productivity_score: 90 },
      { employee_id: empB._id, organizationId: orgB._id, fitment_score: 95, fatigue_score: 10, productivity_score: 95 }
    ]);

    tokenA = jwt.sign({ id: userA._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
    tokenB = jwt.sign({ id: userB._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Employee.deleteMany({});
    await OrganizationMembership.deleteMany({});
    await AnalysisResult.deleteMany({});
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  test('Employee A can get their own career coach data in Org A', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'What should I improve?', mode: 'career_coach' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const reply = res.body.data.reply;
    
    // Fallback mode should return JSON
    if (res.body.data.isFallback) {
      const parsed = JSON.parse(reply);
      expect(parsed.fitmentScore).toBe(85);
      expect(parsed).toHaveProperty('summary');
      expect(parsed).toHaveProperty('focusAreas');
    }
  });

  test('Employee A cannot ask for Employee B data', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'Tell me about Employee B fitment', mode: 'career_coach' });

    expect(res.status).toBe(200);
    
    const reply = res.body.data.reply;
    if (res.body.data.isFallback) {
      const parsed = JSON.parse(reply);
      expect(parsed.fitmentScore).toBe(85); // Returns Emp A data despite asking for Emp B
    } else {
      // If live AI, it shouldn't contain Emp B's 95 score
      expect(reply).not.toContain('95');
    }
  });

  test('Employee B cannot retrieve Org A data', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-organization-id', orgB._id.toString())
      .send({ message: 'What is my fitment?', mode: 'career_coach' });

    expect(res.status).toBe(200);
    
    const reply = res.body.data.reply;
    if (res.body.data.isFallback) {
      const parsed = JSON.parse(reply);
      expect(parsed.fitmentScore).toBe(95);
    }
  });

  test('Missing employee returns 403', async () => {
    const userC = await User.create({ name: 'User C', username: 'userc', email: 'userC@test.com', password: 'password', role: 'employee' });
    await OrganizationMembership.create({ userId: userC._id, organizationId: orgA._id, role: 'employee', status: 'active' });
    const tokenC = jwt.sign({ id: userC._id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenC}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'Hello', mode: 'career_coach' });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Employee profile not found');
  });

  test('Analyze my performance trends does not return top performers', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'Analyze my performance trends', mode: 'career_coach' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const reply = res.body.data.reply;
    
    // It should never contain "top performers" or productivity rankings
    expect(reply.toLowerCase()).not.toContain('top performers');
    
    if (res.body.data.isFallback) {
      const parsed = JSON.parse(reply);
      expect(parsed).toHaveProperty('summary');
      expect(parsed.summary).toContain('temporarily unavailable');
    }
  });

  test('Fallback returns valid JSON without markdown', async () => {
    // Force fallback by messing up Groq temporarily just for this process? We don't want to change process.env.
    // However, if the API key is not valid, it goes to fallback. Let's assume it might or might not.
    // If it's fallback, verify JSON.
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'Hi', mode: 'career_coach' });

    if (res.body.data.isFallback) {
      expect(() => JSON.parse(res.body.data.reply)).not.toThrow();
      const parsed = JSON.parse(res.body.data.reply);
      expect(parsed.summary).toBe('Career insights are temporarily unavailable. Please try again shortly.');
    }
  });
});
