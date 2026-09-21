import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import QuizResult from '../models/QuizResult.js';
import BehavioralResult from '../models/BehavioralResult.js';
import { quizService } from '../services/quizService.js';
import { webhook } from '../controllers/quizController.js';

let mongoServer;
let orgA, orgB;
let userA, userB;
let empA, empB;
let quizResultA, quizResultB;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  await mongoose.connect(uri);

  orgA = await Organization.create({ name: 'Org A', domain: 'orga.com' });
  orgB = await Organization.create({ name: 'Org B', domain: 'orgb.com' });

  userA = await User.create({ name: 'User A', email: 'usera@orga.com', username: 'usera', password: 'Password123' });
  userB = await User.create({ name: 'User B', email: 'userb@orgb.com', username: 'userb', password: 'Password123' });

  empA = await Employee.create({ userid: 'EMP_A', name: 'User A', email: 'usera@orga.com', organizationId: orgA._id });
  empB = await Employee.create({ userid: 'EMP_B', name: 'User B', email: 'userb@orgb.com', organizationId: orgB._id });
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await QuizResult.deleteMany({});
  await BehavioralResult.deleteMany({});
  
  quizResultA = await QuizResult.create({
    userId: userA._id,
    organizationId: orgA._id,
    status: 'initiated',
    quizLink: 'http://test.com/a',
    expiresAt: new Date(Date.now() + 100000),
    webhookEventId: 'dummy_evt_1'
  });

  quizResultB = await QuizResult.create({
    userId: userB._id,
    organizationId: orgB._id,
    status: 'initiated',
    quizLink: 'http://test.com/b',
    expiresAt: new Date(Date.now() + 100000),
    webhookEventId: 'dummy_evt_2'
  });
});

describe('MayaMaya Webhook Isolation', () => {
  it('creates BehavioralResult with correct organizationId for a valid webhook', async () => {
    // Mock the SDK verify method for this test
    jest.spyOn(quizService, 'handleWebhookEvent').mockReturnValue({
      id: 'evt_1',
      type: 'mmQuizzes.results.completed',
      data: {
        userId: userA._id.toString(),
        completedAt: new Date(),
        results: { spirit: { score: 80 } },
        skills: [{ name: 'Communication', score: 90 }]
      }
    });

    const req = {
      rawBody: Buffer.from('mock'),
      headers: {}
    };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await webhook(req, res);

    expect(res.json).toHaveBeenCalledWith({ received: true });

    const behavior = await BehavioralResult.findOne({ employeeId: empA._id });
    expect(behavior).toBeTruthy();
    expect(behavior.organizationId.toString()).toBe(orgA._id.toString());
  });

  it('rejects update if QuizResult organizationId does not match Employee organizationId', async () => {
    // Corrupt QuizResult to point to org B
    quizResultA.organizationId = orgB._id;
    await quizResultA.save();

    jest.spyOn(quizService, 'handleWebhookEvent').mockReturnValue({
      id: 'evt_2',
      type: 'mmQuizzes.results.completed',
      data: {
        userId: userA._id.toString(),
        completedAt: new Date(),
        results: { spirit: { score: 80 } },
        skills: [{ name: 'Communication', score: 90 }]
      }
    });

    const req = { rawBody: Buffer.from('mock'), headers: {} };
    const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    await webhook(req, res);
    
    // Webhook still returns 200 OK to the sender, but pipeline silently rejects
    expect(res.json).toHaveBeenCalledWith({ received: true });

    const behavior = await BehavioralResult.findOne({ employeeId: empA._id });
    expect(behavior).toBeNull();
  });
});
