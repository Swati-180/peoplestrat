const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Assessment = require('../models/Assessment');

let token;
let employeeId;
let assessmentId;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ai-workforce-test');
  }
  await User.deleteMany({});
  await Employee.deleteMany({});
  await Assessment.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('AI Workforce API Endpoints', () => {

  it('1. POST /api/auth/register - Should register a new user and employee profile', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        department: 'Engineering'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('test@example.com');
  });

  it('2. POST /api/auth/login - Should login and return JWT', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        usernameOrEmail: 'testuser',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    
    token = res.body.data.token;
  });

  it('3. GET /api/employees - Should fetch all employees', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    employeeId = res.body.data[0]._id;
  });

  it('4. POST /api/employees/upload-resume - Should handle file upload errors without a file', async () => {
    const res = await request(app)
      .post('/api/employees/upload-resume')
      .set('Authorization', `Bearer ${token}`);
    
    // We didn't attach a real PDF, so we expect the explicit 400 rejection from the controller
    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('No resume file uploaded');
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

  it('6. POST /api/assessments/:id/submit - Should score a WDT submission', async () => {
    const res = await request(app)
      .post(`/api/assessments/${assessmentId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ answers: [] });
    
    // Mocking an empty submission array for the sake of checking score generation boundary
    expect(res.statusCode).toBe(400); // Because no questions exist in the test assessment yet
    expect(res.body.success).toBe(false);
  });

  it('7. GET /api/analytics/workforce-summary - Should fetch workforce dashboard analytics', async () => {
    const res = await request(app)
      .get('/api/analytics/workforce-summary')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalEmployees).toBeGreaterThan(0);
  });

  it('8. POST /api/ai/chat - Should execute the conversational LLM proxy', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({
        message: 'Show me skill gaps'
      });
    
    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    // Even in demo mode fallback without a key, it should respond structure-wise natively
    expect(res.body.data.reply).toBeDefined();
  });
});
