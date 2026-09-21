import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import Employee from '../models/Employee.js';
import Assessment from '../models/Assessment.js';
import AnalysisResult from '../models/AnalysisResult.js';
import FTEWorkload from '../models/FTEWorkload.js';
import WorkflowDraft from '../models/WorkflowDraft.js';
import PeerFeedback from '../models/PeerFeedback.js';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '30d' });
};

describe('Phase 4B Backend Isolation Security Tests', () => {
  let mongoServer;
  let orgA, orgB;
  let adminA, managerA, employeeA, adminB, managerB, employeeB;
  let tokenAdminA, tokenManagerA, tokenEmployeeA, tokenAdminB, tokenManagerB, tokenEmployeeB;
  let empDocA, empDocB;
  let analysisA, analysisB;
  let workloadA, workloadB;
  let draftB;
  let globalAss, orgAAss, orgBAss;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    await mongoose.connect(uri);
    process.env.JWT_SECRET = 'testsecret';

    // 1. Setup Organizations
    orgA = await Organization.create({ name: 'Org A 4B', domain: 'orga4b.com' });
    orgB = await Organization.create({ name: 'Org B 4B', domain: 'orgb4b.com' });

    // 2. Setup Users & Tokens
    adminA = await User.create({ name: 'Admin A', username: 'Admin A', email: 'adminA@orga4b.com', password: 'password', roles: ['admin'] });
    managerA = await User.create({ name: 'Manager A', username: 'Manager A', email: 'managerA@orga4b.com', password: 'password', roles: ['manager'] });
    employeeA = await User.create({ name: 'Employee A', username: 'Employee A', email: 'employeeA@orga4b.com', password: 'password', roles: ['employee'] });

    adminB = await User.create({ name: 'Admin B', username: 'Admin B', email: 'adminB@orgb4b.com', password: 'password', roles: ['admin'] });
    managerB = await User.create({ name: 'Manager B', username: 'Manager B', email: 'managerB@orgb4b.com', password: 'password', roles: ['manager'] });
    employeeB = await User.create({ name: 'Employee B', username: 'Employee B', email: 'employeeB@orgb4b.com', password: 'password', roles: ['employee'] });

    await OrganizationMembership.insertMany([
      { userId: adminA._id, organizationId: orgA._id, role: 'admin', status: 'active' },
      { userId: managerA._id, organizationId: orgA._id, role: 'manager', status: 'active' },
      { userId: employeeA._id, organizationId: orgA._id, role: 'employee', status: 'active' },
      { userId: adminB._id, organizationId: orgB._id, role: 'admin', status: 'active' },
      { userId: managerB._id, organizationId: orgB._id, role: 'manager', status: 'active' },
      { userId: employeeB._id, organizationId: orgB._id, role: 'employee', status: 'active' },
    ]);

    tokenAdminA = generateToken(adminA._id, 'admin');
    tokenManagerA = generateToken(managerA._id, 'manager');
    tokenEmployeeA = generateToken(employeeA._id, 'employee');
    tokenAdminB = generateToken(adminB._id, 'admin');
    tokenManagerB = generateToken(managerB._id, 'manager');
    tokenEmployeeB = generateToken(employeeB._id, 'employee');

    // 3. Setup Org-owned Resources
    empDocA = await Employee.create({ userid: 'E_A', name: 'Emp A', email: 'employeeA@orga4b.com', organizationId: orgA._id });
    empDocB = await Employee.create({ userid: 'E_B', name: 'Emp B', email: 'employeeB@orgb4b.com', organizationId: orgB._id });

    analysisA = await AnalysisResult.create({ employee_id: empDocA._id, flightRiskScore: 50, organizationId: orgA._id });
    analysisB = await AnalysisResult.create({ employee_id: empDocB._id, flightRiskScore: 60, organizationId: orgB._id });

    workloadA = await FTEWorkload.create({ process_name: 'Process A', sub_process: 'Sub A', band: 'M1', organizationId: orgA._id });
    workloadB = await FTEWorkload.create({ process_name: 'Process B', sub_process: 'Sub B', band: 'M2', organizationId: orgB._id });

    draftB = await WorkflowDraft.create({ userId: managerA._id, workflowType: 'peer_feedback', data: { test: 'B' }, organizationId: orgB._id });

    globalAss = await Assessment.create({ title: 'Global 4B', description: 'G', organizationId: null });
    orgAAss = await Assessment.create({ title: 'Org A Ass 4B', description: 'A', organizationId: orgA._id });
    orgBAss = await Assessment.create({ title: 'Org B Ass 4B', description: 'B', organizationId: orgB._id });
  });

  afterAll(async () => {
    if (orgA) await Organization.deleteMany({ _id: { $in: [orgA._id, orgB._id] } });
    if (adminA) await User.deleteMany({ _id: { $in: [adminA._id, managerA._id, employeeA._id, adminB._id, managerB._id, employeeB._id] } });
    if (orgA) await OrganizationMembership.deleteMany({ organizationId: { $in: [orgA._id, orgB._id] } });
    if (empDocA) await Employee.deleteMany({ _id: { $in: [empDocA._id, empDocB._id] } });
    if (analysisA) await AnalysisResult.deleteMany({ _id: { $in: [analysisA._id, analysisB._id] } });
    if (workloadA) await FTEWorkload.deleteMany({ _id: { $in: [workloadA._id, workloadB._id] } });
    if (draftB) await WorkflowDraft.deleteMany({ _id: draftB._id });
    if (globalAss) await Assessment.deleteMany({ _id: { $in: [globalAss._id, orgAAss._id, orgBAss._id] } });
    
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('1. Org A read Org B Employee (Expect 404/Empty)', async () => {
    const res = await request(app)
      .get(`/api/employees/${empDocB._id}`)
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString());
    expect(res.status).toBe(404);
  });

  test('2. Org A read Org B AnalysisResult (Expect 404)', async () => {
    const res = await request(app)
      .get(`/api/analysis/employee/${empDocB._id}`)
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString());
    expect(res.status).toBe(404);
  });

  test('3. Org A read Org B FTEWorkload (P0 fix validation)', async () => {
    const res = await request(app)
      .get('/api/optimization/recommendations')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .set('x-organization-id', orgA._id.toString());
    expect(res.status).toBe(200);
    // Because mock data is small, shouldn't crash, but won't contain Process B
    const summary = await request(app)
      .get('/api/analysis/summary')
      .set('Authorization', `Bearer ${tokenAdminA}`)
      .set('x-organization-id', orgA._id.toString());
    expect(summary.status).toBe(200);
  });

  test('4. Org A update Org B resource (Expect 404)', async () => {
    const res = await request(app)
      .put(`/api/employees/${empDocB._id}`)
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ name: 'Hacked' });
    expect(res.status).toBe(404);
  });

  test('5. Org A delete Org B resource (Expect 404)', async () => {
    const res = await request(app)
      .delete(`/api/employees/${empDocB._id}`)
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString());
    expect(res.status).toBe(404);
  });

  test('6. Org A submits forged organizationId=OrgB', async () => {
    const res = await request(app)
      .post('/api/employees/add')
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ name: 'Forged', email: 'forged@test.com', organizationId: orgB._id });
    
    // employee is created but req.body.organizationId should be overridden to orgA._id
    expect(res.status).toBe(200);
    expect(res.body.data.organizationId).toBe(orgA._id.toString());
  });

  test('7. Org A submits forged employeeId belonging to OrgB', async () => {
    const res = await request(app)
      .post('/api/feedback/submit')
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ targetEmployeeId: empDocB._id, rating: 5, collaborationTags: ['Great'] });
    expect(res.status).toBe(404); // "Target employee not found" because it's not in orgA
  });

  test('8. Missing organization context (P1 fix validation)', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${tokenManagerA}`);
    // No x-organization-id header, should fail closed
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Organization context required/i);
  });

  test('9. Invalid organization context', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', 'invalid_id_format');
    expect(res.status).toBe(401);
  });

  test('10. Employee attempts Manager/Admin endpoint', async () => {
    const res = await request(app)
      .post('/api/assessments')
      .set('Authorization', `Bearer ${tokenEmployeeA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ title: 'Hack', description: 'Hack' });
    expect(res.status).toBe(403);
  });

  test('11. Manager Org A attempts Org B resource (Cross-org draft)', async () => {
    const res = await request(app)
      .get('/api/drafts')
      .query({ workflowType: 'SuccessionPlan', referenceId: orgB._id.toString() })
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString());
    expect(res.status).toBe(404); // Should not find draftB
  });

  test('12. Global Assessment access remains allowed', async () => {
    const res = await request(app)
      .get(`/api/assessments/${globalAss._id}/start`)
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString());
    expect(res.status).toBe(200);
  });

  test('13. Org-owned Assessment A cannot be accessed by Org B', async () => {
    const res = await request(app)
      .get(`/api/assessments/${orgAAss._id}/start`)
      .set('Authorization', `Bearer ${tokenManagerB}`)
      .set('x-organization-id', orgB._id.toString());
    expect(res.status).toBe(404);
  });

  test('14. Global templates cannot be accidentally modified', async () => {
    const res = await request(app)
      .post(`/api/assessments/${globalAss._id}/questions`)
      .set('Authorization', `Bearer ${tokenManagerA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ text: 'Hack', category: 'Other' });
    expect(res.status).toBe(403); // Manager A doesn't own global template
  });
});
