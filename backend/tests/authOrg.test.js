import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { protect, managerOnly, adminOnly, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';

// Setup Mock Express App
const app = express();
app.use(express.json());

// Mock routes
app.get('/api/protected', protect, (req, res) => res.json({ success: true, orgId: req.organizationId }));
app.get('/api/manager', protect, managerOnly, (req, res) => res.json({ success: true }));
app.get('/api/admin', protect, adminOnly, (req, res) => res.json({ success: true }));

let mongoServer;
let userA;
let userB;
let orgA;
let orgB;
let tokenA;
let tokenB;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Setup Users
  userA = await User.create({ name: 'User A', username: 'usera', email: 'a@test.com', password: 'pwd', role: 'employee' });
  userB = await User.create({ name: 'User B', username: 'userb', email: 'b@test.com', password: 'pwd', role: 'manager' });
  
  tokenA = jwt.sign({ id: userA._id, role: userA.role }, process.env.JWT_SECRET);
  tokenB = jwt.sign({ id: userB._id, role: userB.role }, process.env.JWT_SECRET);

  // Setup Organizations
  orgA = await Organization.create({ name: 'Org A' });
  orgB = await Organization.create({ name: 'Org B' });

  // Setup Memberships
  await OrganizationMembership.create({ userId: userA._id, organizationId: orgA._id, role: 'manager', status: 'active' });
  await OrganizationMembership.create({ userId: userA._id, organizationId: orgB._id, role: 'employee', status: 'active' });
  await OrganizationMembership.create({ userId: userB._id, organizationId: orgB._id, role: 'admin', status: 'inactive' }); // Inactive

});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Multi-Organization Authentication & RBAC', () => {

  it('1. Valid JWT + valid membership -> allowed', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString());
    
    expect(res.statusCode).toBe(200);
    expect(res.body.orgId).toBe(orgA._id.toString());
  });

  it('2. Valid JWT + no membership -> 403', async () => {
    // user B is not a member of Org A
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-organization-id', orgA._id.toString());
    
    expect(res.statusCode).toBe(403);
    expect(res.body.error).toContain('not a member');
  });

  it('3. Valid JWT + another user\'s organization -> 403', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${tokenB}`) // User B
      .set('x-organization-id', orgA._id.toString()); // User A's Org
    
    expect(res.statusCode).toBe(403);
  });

  it('4. Invalid organizationId -> 403 (handled as no membership)', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', fakeId.toString());
    
    expect(res.statusCode).toBe(403);
  });

  it('5. Invalid JWT -> 401', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer badtoken`)
      .set('x-organization-id', orgA._id.toString());
    
    expect(res.statusCode).toBe(401);
  });

  it('6. Expired JWT -> 401', async () => {
    const expiredToken = jwt.sign({ id: userA._id, role: userA.role }, process.env.JWT_SECRET, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${expiredToken}`)
      .set('x-organization-id', orgA._id.toString());
    
    expect(res.statusCode).toBe(401);
  });

  it('7. Membership inactive -> 403', async () => {
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-organization-id', orgB._id.toString());
    
    expect(res.statusCode).toBe(403); // Status is 'inactive' in DB
  });

  it('8. Membership role employee -> cannot access manager-only organization context', async () => {
    // User A in Org B is 'employee'
    const res = await request(app)
      .get('/api/manager')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgB._id.toString());
    
    expect(res.statusCode).toBe(403);
  });

  it('9. Membership role manager -> cannot access admin-only organization context', async () => {
    // User A in Org A is 'manager'
    const res = await request(app)
      .get('/api/admin')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString());
    
    expect(res.statusCode).toBe(403);
  });

  it('10. User with multiple organizations gets the correct role per organization', async () => {
    // User A in Org A is 'manager' -> allowed in /api/manager
    const res1 = await request(app)
      .get('/api/manager')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString());
    
    expect(res1.statusCode).toBe(200);

    // User A in Org B is 'employee' -> denied in /api/manager
    const res2 = await request(app)
      .get('/api/manager')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgB._id.toString());
    
    expect(res2.statusCode).toBe(403);
  });

  it('11. Backward compatibility: Global role works if no org header is passed', async () => {
    // User B has global role 'manager'
    const res = await request(app)
      .get('/api/manager')
      .set('Authorization', `Bearer ${tokenB}`);
    
    expect(res.statusCode).toBe(200);
  });

});
