import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import EmployeeResume from '../models/employeeResume.js';
import jwt from 'jsonwebtoken';

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;
let orgA, orgB, userA, userB, userDual, tokenA_OrgA, tokenB_OrgA, tokenDual_OrgA, tokenDual_OrgB, tokenNoOrg;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Create Organizations
  orgA = await Organization.create({ name: 'Org A' });
  orgB = await Organization.create({ name: 'Org B' });

  // Create Users
  userA = await User.create({ name: 'User A', username: 'usera', email: 'a@example.com', password: 'password', role: 'employee' });
  userB = await User.create({ name: 'User B', username: 'userb', email: 'b@example.com', password: 'password', role: 'employee' });
  userDual = await User.create({ name: 'User Dual', username: 'userdual', email: 'dual@example.com', password: 'password', role: 'employee' });

  // Create Memberships
  await OrganizationMembership.create({ userId: userA._id, organizationId: orgA._id, role: 'employee' });
  await OrganizationMembership.create({ userId: userB._id, organizationId: orgA._id, role: 'employee' });
  await OrganizationMembership.create({ userId: userDual._id, organizationId: orgA._id, role: 'employee' });
  await OrganizationMembership.create({ userId: userDual._id, organizationId: orgB._id, role: 'employee' });

  // Create Employees (Employee Portal uses Employee records to verify)
  await Employee.create({ userid: userA._id, email: userA.email, name: userA.name, organizationId: orgA._id });
  await Employee.create({ userid: userB._id, email: userB.email, name: userB.name, organizationId: orgA._id });
  await Employee.create({ userid: userDual._id, email: userDual.email, name: userDual.name, organizationId: orgA._id });
  await Employee.create({ userid: userDual._id, email: userDual.email, name: userDual.name, organizationId: orgB._id });

  // Generate Tokens
  const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'your-secret-key');
  tokenA_OrgA = generateToken(userA._id);
  tokenB_OrgA = generateToken(userB._id);
  tokenDual_OrgA = generateToken(userDual._id);
  tokenDual_OrgB = generateToken(userDual._id);
  tokenNoOrg = generateToken(userA._id);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Phase 5A Resume Organization Isolation Tests', () => {

  beforeEach(async () => {
    await EmployeeResume.deleteMany({});
  });

  test('Employee gets only their own resume (creates new if empty)', async () => {
    const res = await request(app)
      .get('/api/employee/me/resume')
      .set('Authorization', `Bearer ${tokenA_OrgA}`)
      .set('x-organization-id', orgA._id.toString());
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.summary).toBe('');
    
    // Check it didn't create a document yet on GET
    const count = await EmployeeResume.countDocuments();
    expect(count).toBe(0);
  });

  test('Updating Org A resume sets organizationId and does not affect Org B resume', async () => {
    // Dual user updates in Org A
    const putA = await request(app)
      .put('/api/employee/me/resume')
      .set('Authorization', `Bearer ${tokenDual_OrgA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ summary: 'Org A Summary' });
    
    expect(putA.status).toBe(200);
    expect(putA.body.data.summary).toBe('Org A Summary');

    // Dual user checks in Org B (should be empty/new)
    const getB = await request(app)
      .get('/api/employee/me/resume')
      .set('Authorization', `Bearer ${tokenDual_OrgB}`)
      .set('x-organization-id', orgB._id.toString());
    
    expect(getB.status).toBe(200);
    expect(getB.body.data.summary).toBe('');

    // Check DB
    const resumes = await EmployeeResume.find({ userId: userDual._id });
    expect(resumes.length).toBe(1);
    expect(resumes[0].organizationId.toString()).toBe(orgA._id.toString());
  });

  test('Employee A cannot access Employee B resume', async () => {
    // A creates resume
    await EmployeeResume.create({ userId: userA._id, organizationId: orgA._id, summary: 'User A Summary' });

    // B tries to get (they will just get their own empty structure)
    const getB = await request(app)
      .get('/api/employee/me/resume')
      .set('Authorization', `Bearer ${tokenB_OrgA}`)
      .set('x-organization-id', orgA._id.toString());
    
    expect(getB.body.data.summary).toBe('');
  });

  test('Missing organization context is rejected', async () => {
    const res = await request(app)
      .get('/api/employee/me/resume')
      .set('Authorization', `Bearer ${tokenNoOrg}`); // Missing x-organization-id

    expect(res.status).toBe(401);
  });

});
