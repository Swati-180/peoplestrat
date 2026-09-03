import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../models/User.js';
import Invitation from '../models/Invitation.js';
import bcrypt from 'bcryptjs';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Invitation.deleteMany({});
});

describe('RBAC & Invitations', () => {
  it('should allow admin to invite manager and employee', async () => {
    // 1. Create admin
    const passwordHash = await bcrypt.hash('password123', 10);
    const admin = await User.create({
      name: 'Admin',
      username: 'admin',
      email: 'admin@test.com',
      password: passwordHash,
      role: 'admin'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin', password: 'password123' });
    
    const adminToken = loginRes.body.token;

    // 2. Admin invites employee
    const inviteEmpRes = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'newemp@test.com', role: 'employee' });
    
    expect(inviteEmpRes.status).toBe(201);

    // 3. Admin invites manager
    const inviteMgrRes = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'newmgr@test.com', role: 'manager' });
    
    expect(inviteMgrRes.status).toBe(201);
  });

  it('should allow manager to invite employee, but not manager', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const manager = await User.create({
      name: 'Manager',
      username: 'manager',
      email: 'manager@test.com',
      password: passwordHash,
      role: 'manager'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'manager', password: 'password123' });
    
    const managerToken = loginRes.body.token;

    // Manager invites employee
    const inviteEmpRes = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ email: 'emp2@test.com', role: 'employee' });
    
    expect(inviteEmpRes.status).toBe(201);

    // Manager invites manager (should fail)
    const inviteMgrRes = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ email: 'mgr2@test.com', role: 'manager' });
    
    expect(inviteMgrRes.status).toBe(403);
  });

  it('should not allow employee to invite anyone', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const employee = await User.create({
      name: 'Emp',
      username: 'emp',
      email: 'emp@test.com',
      password: passwordHash,
      role: 'employee'
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'emp', password: 'password123' });
    
    const empToken = loginRes.body.token;

    const inviteRes = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${empToken}`)
      .send({ email: 'emp3@test.com', role: 'employee' });
    
    expect(inviteRes.status).toBe(403);
  });

  it('should register successfully with a valid token and mark it accepted', async () => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const admin = await User.create({
      name: 'Admin',
      username: 'admin',
      email: 'admin@test.com',
      password: passwordHash,
      role: 'admin'
    });
    
    // We mock the invite link generation
    const inviteRes = await request(app)
      .post('/api/auth/invite')
      .set('Authorization', `Bearer ${(await request(app).post('/api/auth/login').send({identifier:'admin', password:'password123'})).body.token}`)
      .send({ email: 'invitee@test.com', role: 'employee' });
      
    expect(inviteRes.status).toBe(201);

    // Get the invitation from DB
    const invitation = await Invitation.findOne({ email: 'invitee@test.com' });
    // Since we don't have the raw token, we have to fake one in the test or modify the code to return it in test mode
    // I will fake the token creation manually to test registration
    const crypto = await import('crypto');
    
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    
    const customInvite = await Invitation.create({
      email: 'custom@test.com',
      role: 'employee',
      tokenHash,
      invitedBy: admin._id,
      expiresAt: new Date(Date.now() + 100000)
    });

    const linkToken = `${customInvite._id}.${rawToken}`;

    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Custom User',
        username: 'customuser',
        password: 'password123',
        inviteToken: linkToken
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user.email).toBe('custom@test.com');
    
    const checkInvite = await Invitation.findById(customInvite._id);
    expect(checkInvite.status).toBe('accepted');

    // Register again with same token should fail
    const regRes2 = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Custom User 2',
        username: 'customuser2',
        password: 'password123',
        inviteToken: linkToken
      });

    expect(regRes2.status).toBe(400);
    expect(regRes2.body.message).toContain('already accepted');
  });
});
