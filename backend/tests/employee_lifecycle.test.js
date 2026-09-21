import mongoose from 'mongoose';
import request from 'supertest';
import app from '../server.js';
import Employee from '../models/Employee.js';
import User from '../models/User.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import Organization from '../models/Organization.js';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Employee Lifecycle (Open/Close)', () => {
  let orgA, orgB;
  let adminUserA, adminUserB;
  let adminTokenA, adminTokenB;
  let targetUser, targetEmployeeA, targetEmployeeB;
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoServer.getUri());
    }
  });

  beforeEach(async () => {
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Employee.deleteMany({});
    await OrganizationMembership.deleteMany({});

    // Create Orgs
    orgA = await Organization.create({ name: 'Org A' });
    orgB = await Organization.create({ name: 'Org B' });

    // Create Admins
    adminUserA = await User.create({ username: 'adminA', name: 'Admin A', email: 'adminA@test.com', password: 'password123', role: 'admin' });
    await OrganizationMembership.create({ userId: adminUserA._id, organizationId: orgA._id, role: 'admin', status: 'active' });
    adminTokenA = jwt.sign({ id: adminUserA._id, role: adminUserA.role }, process.env.JWT_SECRET || 'testsecret');

    adminUserB = await User.create({ username: 'adminB', name: 'Admin B', email: 'adminB@test.com', password: 'password123', role: 'admin' });
    await OrganizationMembership.create({ userId: adminUserB._id, organizationId: orgB._id, role: 'admin', status: 'active' });
    adminTokenB = jwt.sign({ id: adminUserB._id, role: adminUserB.role }, process.env.JWT_SECRET || 'testsecret');

    // Create Target User
    targetUser = await User.create({ username: 'targetUser', name: 'Target Employee', email: 'target@test.com', password: 'password123', role: 'employee' });

    // Give target user memberships in both orgs
    await OrganizationMembership.create({ userId: targetUser._id, organizationId: orgA._id, role: 'employee', status: 'active' });
    await OrganizationMembership.create({ userId: targetUser._id, organizationId: orgB._id, role: 'employee', status: 'active' });

    // Create Employee documents
    targetEmployeeA = await Employee.create({
      organizationId: orgA._id,
      name: 'Target Employee',
      email: 'target@test.com',
      status: 'Active'
    });

    targetEmployeeB = await Employee.create({
      organizationId: orgB._id,
      name: 'Target Employee',
      email: 'target@test.com',
      status: 'Active'
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  it('termination updates Employee status and deactivates OrganizationMembership', async () => {
    const res = await request(app)
      .post(`/api/employees/${targetEmployeeA._id}/terminate`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .set('x-organization-id', orgA._id.toString());

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const emp = await Employee.findById(targetEmployeeA._id);
    expect(emp.status).toBe('Terminated');

    const mem = await OrganizationMembership.findOne({ userId: targetUser._id, organizationId: orgA._id });
    expect(mem.status).toBe('inactive');
    expect(mem.deactivatedByTermination).toBe(true);
  });

  it('reactivation restores a membership that this termination operation deactivated', async () => {
    // Terminate first
    await request(app)
      .post(`/api/employees/${targetEmployeeA._id}/terminate`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .set('x-organization-id', orgA._id.toString());

    // Reactivate
    const res = await request(app)
      .post(`/api/employees/${targetEmployeeA._id}/reactivate`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .set('x-organization-id', orgA._id.toString());

    expect(res.statusCode).toBe(200);
    
    const emp = await Employee.findById(targetEmployeeA._id);
    expect(emp.status).toBe('Active');

    const mem = await OrganizationMembership.findOne({ userId: targetUser._id, organizationId: orgA._id });
    expect(mem.status).toBe('active');
    expect(mem.deactivatedByTermination).toBe(false);
  });

  it('reactivation does not activate a membership that was already inactive before termination', async () => {
    // Manually make the membership inactive BEFORE termination
    await OrganizationMembership.findOneAndUpdate(
      { userId: targetUser._id, organizationId: orgA._id },
      { status: 'inactive' }
    );

    // Terminate the employee
    await request(app)
      .post(`/api/employees/${targetEmployeeA._id}/terminate`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .set('x-organization-id', orgA._id.toString());

    // Check membership
    let mem = await OrganizationMembership.findOne({ userId: targetUser._id, organizationId: orgA._id });
    expect(mem.status).toBe('inactive');
    expect(mem.deactivatedByTermination).toBe(false);

    // Reactivate
    await request(app)
      .post(`/api/employees/${targetEmployeeA._id}/reactivate`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .set('x-organization-id', orgA._id.toString());

    const emp = await Employee.findById(targetEmployeeA._id);
    expect(emp.status).toBe('Active');

    mem = await OrganizationMembership.findOne({ userId: targetUser._id, organizationId: orgA._id });
    expect(mem.status).toBe('inactive');
    expect(mem.deactivatedByTermination).toBe(false); 
  });

  it('Org A termination does not affect Org B membership', async () => {
    await request(app)
      .post(`/api/employees/${targetEmployeeA._id}/terminate`)
      .set('Authorization', `Bearer ${adminTokenA}`)
      .set('x-organization-id', orgA._id.toString());

    const memB = await OrganizationMembership.findOne({ userId: targetUser._id, organizationId: orgB._id });
    expect(memB.status).toBe('active');

    const empB = await Employee.findById(targetEmployeeB._id);
    expect(empB.status).toBe('Active');
  });

  it('cross-organization terminate/reactivate attempts are rejected', async () => {
    const res = await request(app)
      .post(`/api/employees/${targetEmployeeA._id}/terminate`)
      .set('Authorization', `Bearer ${adminTokenB}`)
      .set('x-organization-id', orgB._id.toString());

    expect(res.statusCode).toBe(404);
  });
});
