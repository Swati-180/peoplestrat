import request from 'supertest';
import app from '../server.js';
import Employee from '../models/Employee.js';
import BehavioralResult from '../models/BehavioralResult.js';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import OrganizationMembership from '../models/OrganizationMembership.js';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import nock from 'nock';

import { MongoMemoryServer } from 'mongodb-memory-server';

import bcrypt from 'bcryptjs';

describe('MayaMaya Assessment & Downstream Consumers', () => {
  let orgA, orgB;
  let userA, userB;
  let empA, empB;
  let tokenA, tokenB;
  let mongoServer;
  const mockMayamaya = nock('https://developers-api-01.mayamaya.ai');

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    // Basic setup for Organizations, Users, Employees
    orgA = await Organization.create({ name: 'Org A' });
    orgB = await Organization.create({ name: 'Org B' });

    const passwordHash = await bcrypt.hash('password123', 10);
    userA = await User.create({ name: 'User A', username: 'usera', email: 'usera@orga.com', password: passwordHash, role: 'employee' });
    userB = await User.create({ name: 'User B', username: 'userb', email: 'userb@orgb.com', password: passwordHash, role: 'employee' });

    await OrganizationMembership.create([
      { userId: userA._id, organizationId: orgA._id, role: 'employee', status: 'active' },
      { userId: userB._id, organizationId: orgB._id, role: 'employee', status: 'active' }
    ]);

    empA = await Employee.create({
      userid: userA._id.toString(), organizationId: orgA._id, name: 'User A', email: 'usera@orga.com', status: 'Active'
    });
    empB = await Employee.create({
      userid: userB._id.toString(), organizationId: orgB._id, name: 'User B', email: 'userb@orgb.com', status: 'Active'
    });

    // Mock Login to get tokens (assuming standard JWT setup in PeopleStrat)
    const loginA = await request(app).post('/api/auth/login').send({ identifier: 'usera@orga.com', password: 'password123' });
    tokenA = loginA.body.token;

    const loginB = await request(app).post('/api/auth/login').send({ identifier: 'userb@orgb.com', password: 'password123' });
    tokenB = loginB.body.token;
  }, 15000);

  afterAll(async () => {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  describe('Downstream Consumers (Employee Portal)', () => {
    it('should not fabricate data and should return assessmentCompleted: false when no BehavioralResult exists', async () => {
      const res = await request(app)
        .get('/api/employee/me/career')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-organization-id', orgA._id.toString());
      
      expect(res.status).toBe(200);
      expect(res.body.data.assessmentCompleted).toBe(false);
      expect(res.body.data.fitmentScore).toBeNull();
      expect(res.body.data.radarData).toBeNull();
    });

    it('should return real data when BehavioralResult exists', async () => {
      await BehavioralResult.create({
        employeeId: empA._id,
        organizationId: orgA._id,
        scores: { communication: 75, leadership: 80, teamwork: 90, adaptability: 85, resilience: 95 }
      });

      // We need to update employee fitmentScore and behavioral fields to simulate the Quiz webhook effect.
      // The controller relies on BehavioralResult for radar data presence, but reads the actual scores 
      // from the employee document.
      empA.fitmentScore = 88;
      empA.communication = 75;
      empA.teamwork = 90;
      await empA.save();

      const res = await request(app)
        .get('/api/employee/me/career')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-organization-id', orgA._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.assessmentCompleted).toBe(true);
      expect(res.body.data.fitmentScore).toBe(88);
      // Because employeePortalController uses employee's fields:
      expect(res.body.data.radarData[0].A).toBe(75); // Communication
      expect(res.body.data.radarData[2].A).toBe(90); // Teamwork
    });

    it('should prevent Org A from consuming Org B\'s result', async () => {
      const res = await request(app)
        .get('/api/employee/me/career')
        .set('Authorization', `Bearer ${tokenB}`)
        .set('x-organization-id', orgB._id.toString());

      expect(res.status).toBe(200);
      expect(res.body.data.assessmentCompleted).toBe(false);
      expect(res.body.data.fitmentScore).toBeNull();
    });
  });

  describe('/start-quiz with Corrected Configuration', () => {
    it('handles MayaMaya SDK call successfully', async () => {
      mockMayamaya.post('/api/v1/embed/mmQuizzes/initiate')
        .reply(200, {
           data: {
             success: true,
             quizLink: 'https://mayamaya.ai/quiz/1234',
             expiresInSeconds: 3600
           }
        });

      const res = await request(app)
        .post('/api/quiz/start-quiz')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-organization-id', orgA._id.toString())
        .send({ embedOrigin: 'http://localhost:5173' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.quizLink).toBe('https://mayamaya.ai/quiz/1234');
    });

    it('handles MayaMaya failure cleanly', async () => {
      mockMayamaya.post('/api/v1/embed/mmQuizzes/initiate')
        .reply(502, { success: false, error: 'MayaMaya is down' });

      const res = await request(app)
        .post('/api/quiz/start-quiz')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-organization-id', orgA._id.toString())
        .send({ embedOrigin: 'http://localhost:5173' });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('MayaMaya');
    });
  });
});
