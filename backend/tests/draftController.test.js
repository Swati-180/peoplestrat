import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import draftRoutes from '../routes/draftRoutes.js';
import Employee from '../models/Employee.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import User from '../models/User.js';
import WorkflowDraft from '../models/WorkflowDraft.js';

const app = express();
app.use(express.json());
app.use('/api/drafts', draftRoutes);

let mongoServer;
let organizationA;
let organizationB;
let employeeA;
let employeeB;
let token;

const profileDraft = (referenceId) => ({
  workflowType: 'edit_employee_profile',
  referenceId: referenceId.toString(),
  data: { position: 'Senior Developer' }
});

const authenticated = (organizationId) => ({
  Authorization: `Bearer ${token}`,
  'x-organization-id': organizationId.toString()
});

beforeAll(async () => {
  process.env.JWT_SECRET = 'draft-controller-test-secret';
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    WorkflowDraft.deleteMany({}),
    Employee.deleteMany({}),
    OrganizationMembership.deleteMany({}),
    Organization.deleteMany({}),
    User.deleteMany({})
  ]);

  [organizationA, organizationB] = await Organization.create([
    { name: 'Organization A' },
    { name: 'Organization B' }
  ]);

  const user = await User.create({
    name: 'Draft Manager',
    username: 'draft-manager',
    email: 'draft.manager@example.com',
    password: 'not-used-in-this-test',
    role: 'manager'
  });

  await OrganizationMembership.create([
    { userId: user._id, organizationId: organizationA._id, role: 'manager', status: 'active' },
    { userId: user._id, organizationId: organizationB._id, role: 'manager', status: 'active' }
  ]);

  [employeeA, employeeB] = await Employee.create([
    { name: 'Employee A', email: 'employee.a@example.com', organizationId: organizationA._id },
    { name: 'Employee B', email: 'employee.b@example.com', organizationId: organizationB._id }
  ]);

  token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
});

describe('employee profile drafts', () => {
  it('persists, reads, and deletes a draft for an employee in the active organization', async () => {
    const create = await request(app)
      .put('/api/drafts')
      .set(authenticated(organizationA._id))
      .send(profileDraft(employeeA._id));

    expect(create.status).toBe(200);
    expect(create.body.data.workflowType).toBe('edit_employee_profile');
    expect(create.body.data.data.position).toBe('Senior Developer');

    const get = await request(app)
      .get(`/api/drafts?workflowType=edit_employee_profile&referenceId=${employeeA._id}`)
      .set(authenticated(organizationA._id));

    expect(get.status).toBe(200);
    expect(get.body.data.referenceId).toBe(employeeA._id.toString());

    const remove = await request(app)
      .delete(`/api/drafts?workflowType=edit_employee_profile&referenceId=${employeeA._id}`)
      .set(authenticated(organizationA._id));

    expect(remove.status).toBe(200);
    expect(remove.body.deleted).toBe(true);
    expect(await WorkflowDraft.countDocuments()).toBe(0);
  });

  it.each([
    ['GET', (id) => request(app).get(`/api/drafts?workflowType=edit_employee_profile&referenceId=${id}`)],
    ['PUT', (id) => request(app).put('/api/drafts').send(profileDraft(id))],
    ['DELETE', (id) => request(app).delete(`/api/drafts?workflowType=edit_employee_profile&referenceId=${id}`)]
  ])('rejects a cross-organization employee reference on %s', async (_method, send) => {
    const response = await send(employeeB._id).set(authenticated(organizationA._id));

    expect(response.status).toBe(404);
    expect(await WorkflowDraft.countDocuments()).toBe(0);
  });

  it('rejects missing or malformed employee profile references', async () => {
    const missing = await request(app)
      .put('/api/drafts')
      .set(authenticated(organizationA._id))
      .send({ workflowType: 'edit_employee_profile', data: { position: 'Senior Developer' } });

    const malformed = await request(app)
      .put('/api/drafts')
      .set(authenticated(organizationA._id))
      .send({ workflowType: 'edit_employee_profile', referenceId: 'not-an-object-id', data: { position: 'Senior Developer' } });

    expect(missing.status).toBe(400);
    expect(malformed.status).toBe(400);
    expect(await WorkflowDraft.countDocuments()).toBe(0);
  });
});
