import request from 'supertest';
import app from '../server.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import AnalysisResult from '../models/AnalysisResult.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('AI Workforce Assistant API (chatAssistant)', () => {
  let orgA, orgB;
  let managerA, managerB;
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

    orgA = await Organization.create({ name: 'Acme Corp' });
    orgB = await Organization.create({ name: 'Beta Ltd' });

    managerA = await User.create({
      name: 'Manager Alice',
      username: 'manager_alice',
      email: 'manager.alice@acme.com',
      password: 'password',
      role: 'manager'
    });

    managerB = await User.create({
      name: 'Manager Bob',
      username: 'manager_bob',
      email: 'manager.bob@beta.com',
      password: 'password',
      role: 'manager'
    });

    await OrganizationMembership.create([
      { userId: managerA._id, organizationId: orgA._id, role: 'manager', status: 'active' },
      { userId: managerB._id, organizationId: orgB._id, role: 'manager', status: 'active' }
    ]);

    empA = await Employee.create({
      name: 'Alice Cooper',
      email: 'alice.cooper@acme.com',
      organizationId: orgA._id,
      position: 'Senior Financial Analyst',
      band: 'M4',
      department: 'Finance',
      process_area: 'F&A',
      productivity: 88,
      utilization: 75,
      fitmentScore: 92,
      fatigueScore: 25,
      skills: ['Excel', 'SAP', 'Audit']
    });

    empB = await Employee.create({
      name: 'Bob Marley',
      email: 'bob.marley@beta.com',
      organizationId: orgB._id,
      position: 'Operations Manager',
      band: 'M2',
      department: 'Operations',
      process_area: 'PSS',
      productivity: 85,
      utilization: 80,
      fitmentScore: 89,
      fatigueScore: 40,
      skills: ['Operations', 'Strategy']
    });

    await AnalysisResult.create([
      {
        employee_id: empA._id,
        organizationId: orgA._id,
        fitment_score: 92,
        fatigue_score: 25,
        productivity_score: 88,
        utilization_score: 75,
        recommendation: 'Top performer in F&A',
        recommendation_type: 'promotion_candidate'
      },
      {
        employee_id: empB._id,
        organizationId: orgB._id,
        fitment_score: 89,
        fatigue_score: 40,
        productivity_score: 85,
        utilization_score: 80,
        recommendation: 'Solid operational contributor',
        recommendation_type: 'stable'
      }
    ]);

    tokenA = jwt.sign({ id: managerA._id }, process.env.JWT_SECRET || 'supersecretjwtkey123', { expiresIn: '1h' });
    tokenB = jwt.sign({ id: managerB._id }, process.env.JWT_SECRET || 'supersecretjwtkey123', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Employee.deleteMany({});
    await OrganizationMembership.deleteMany({});
    await AnalysisResult.deleteMany({});
    if (mongoServer) {
      await mongoServer.stop();
    }
    await mongoose.disconnect();
  });

  test('1. Rejects request without organization context', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ message: 'Tell me about Alice Cooper' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Organization context required');
  });

  test('2. Successfully retrieves authorized employee details (Alice Cooper in Org A)', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'Tell me about Alice Cooper' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.reply).toBeDefined();

    const reply = res.body.data.reply;
    expect(reply.toLowerCase()).toContain('alice cooper');
  });

  test('3. Returns clear not-found explanation for nonexistent employee (Sarah Johnson)', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'Tell me about Sarah Johnson' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const reply = res.body.data.reply;
    // Must clearly state she is not found / not in authorized records
    expect(reply.toLowerCase()).toMatch(/sarah johnson/i);
    expect(reply.toLowerCase()).toMatch(/(?:no employee|not (?:listed|found|in|exist))/i);
  });

  test('4. Cross-tenant isolation: Manager in Org A cannot access employee in Org B', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'Tell me about Bob Marley' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const reply = res.body.data.reply;

    // Bob Marley belongs to Org B, not Org A; should not leak Org B data
    expect(reply.toLowerCase()).toMatch(/(?:no employee|not (?:listed|found|in|exist))/i);
  });

  test('5. Aggregate workforce questions return recommendations', async () => {
    const res = await request(app)
      .post('/api/analysis/chat')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ message: 'Who should be reskilled?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toBeDefined();
  });
});
