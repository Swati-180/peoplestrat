import request from 'supertest';
import app from '../server.js';
import Employee from '../models/Employee.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(uri);
  process.env.JWT_SECRET = 'testsecret';
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Organization Data Isolation Phase 3B', () => {
  let orgA, orgB;
  let userA, userB;
  let tokenA, tokenB;

  beforeEach(async () => {
    await Employee.deleteMany({});
    await Organization.deleteMany({});
    await OrganizationMembership.deleteMany({});
    await User.deleteMany({});

    // Setup Orgs
    orgA = await Organization.create({ name: 'Org A' });
    orgB = await Organization.create({ name: 'Org B' });

    // Setup Users
    const password = await bcrypt.hash('password123', 10);
    userA = await User.create({ name: 'User A', username: 'usera', email: 'a@a.com', password, role: 'admin' });
    userB = await User.create({ name: 'User B', username: 'userb', email: 'b@b.com', password, role: 'admin' });

    // Setup Memberships
    await OrganizationMembership.create({ organizationId: orgA._id, userId: userA._id, role: 'admin' });
    await OrganizationMembership.create({ organizationId: orgB._id, userId: userB._id, role: 'admin' });

    // Create Employees
    await Employee.create({ organizationId: orgA._id, name: 'Emp A1', email: 'e1@a.com', position: 'Dev' });
    await Employee.create({ organizationId: orgB._id, name: 'Emp B1', email: 'e1@b.com', position: 'Dev' });

    // Generate tokens
    tokenA = jwt.sign({ id: userA._id, email: userA.email }, process.env.JWT_SECRET);
    tokenB = jwt.sign({ id: userB._id, email: userB.email }, process.env.JWT_SECRET);
  });

  it('User in Org A should only see employees in Org A', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString());
      
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Emp A1');
  });

  it('User in Org B should only see employees in Org B', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('x-organization-id', orgB._id.toString());
      
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Emp B1');
  });
});
