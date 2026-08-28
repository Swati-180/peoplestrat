import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Assessment from '../models/Assessment.js';

let token;
let employeeId;
let assessmentId;
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  await User.deleteMany({});
  await Employee.deleteMany({});
  await Assessment.deleteMany({});
}, 10000); // 10s timeout for downloading binary if needed

afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('AI Workforce API Endpoints', () => {

  it('1. POST /api/auth/register - Should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'manager'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
  });

  it('2. POST /api/auth/login - Should login and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        identifier: 'testuser',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.token).toBeDefined();
    
    token = res.body.token;
  });

  it('3. GET /api/employees - Should fetch all employees', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // No employees created yet, so it should be empty array
    expect(res.body.data.length).toBe(0);
  });

  it('4. POST /api/uploads/cv - Should handle file upload errors without a file', async () => {
    const res = await request(app)
      .post('/api/uploads/cv')
      .set('Authorization', `Bearer ${token}`);
    
    // We didn't attach a real file, so we expect the explicit 400 rejection from the controller
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('No file uploaded');
  });

  it('5. POST /api/assessments - Should create an assessment (Requires Auth)', async () => {
    const res = await request(app)
      .post('/api/assessments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Software Engineering WDT',
        description: 'Testing core logic',
        timeLimitMinutes: 30
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Software Engineering WDT');
    assessmentId = res.body.data._id;
  });

  it('6. POST /api/assessments/:id/submit - Should reject empty submission', async () => {
    const res = await request(app)
      .post(`/api/assessments/${assessmentId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: [] });
    
    // Mocking an empty submission array for the sake of checking score generation boundary
    expect(res.statusCode).toBe(400); // Because no questions exist in the test assessment yet
    expect(res.body.success).toBe(false);
  });

  it('8. GET /api/analytics/workforce-summary - Should fetch workforce dashboard analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/workforce-summary')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalEmployees).toBeDefined();
  });

  it('9a. POST /api/analysis/predict-flight-risk/:id - Should reject malformed ID with 400', async () => {
    const res = await request(app)
      .post(`/api/analysis/predict-flight-risk/undefined`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Invalid Employee ID format');
  });

  it('9b. POST /api/analysis/predict-flight-risk/:id - Should return 200 with valid deterministic scores when Groq falls back', async () => {
    const employee = await Employee.create({
      name: 'Test Risk',
      email: 'risk@example.com',
      department: 'Testing',
      band: 'M1',
      process_area: 'PSS',
      fitmentScore: 60,
      fatigueScore: 80,
      productivity: 50
    });

    const res = await request(app)
      .post(`/api/analysis/predict-flight-risk/${employee._id}`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.flightRiskScore).toBeDefined();
    expect(typeof res.body.data.flightRiskScore).toBe('number');
    expect(res.body.meta.aiInsightsAvailable).toBe(false);
  });

  it('10. GET /api/succession/roles - Should require Manager role for Succession Planning', async () => {
    const res = await request(app)
      .get('/api/succession/roles')
      .set('Authorization', `Bearer ${token}`);
    
    // Since we registered with role 'manager', it should succeed.
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });

  it('11. GET /api/pipeline/leaders - Should fetch Leadership Pipeline', async () => {
    const res = await request(app)
      .get('/api/pipeline/leaders')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
  });
});
