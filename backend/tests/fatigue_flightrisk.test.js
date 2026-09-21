import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { jest } from '@jest/globals';
import Organization from '../models/Organization.js';
import Employee from '../models/Employee.js';
import PulseCheck from '../models/PulseCheck.js';
import { calculateDeterministicFlightRisk } from '../services/flightRiskEngine.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  await mongoose.connect(mongoUri);
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
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

describe('Fatigue & Flight Risk Integration', () => {
  let orgA, orgB, empA, empB;

  beforeEach(async () => {
    orgA = await Organization.create({ name: 'Org A', domain: 'orga.com', status: 'active' });
    orgB = await Organization.create({ name: 'Org B', domain: 'orgb.com', status: 'active' });

    empA = await Employee.create({
      organizationId: orgA._id,
      name: 'Employee A',
      email: 'a@orga.com',
      position: 'Role A',
      fatigueScore: 50,
      utilization: 50,
      performance: 'Average'
    });

    empB = await Employee.create({
      organizationId: orgB._id,
      name: 'Employee B',
      email: 'b@orgb.com',
      position: 'Role B',
      fatigueScore: 50,
      utilization: 50,
      performance: 'Average'
    });
  });

  test('Flight risk uses the employee\'s valid PulseCheck', async () => {
    const pc = await PulseCheck.create({
      organizationId: orgA._id,
      employeeId: empA._id,
      stressLevel: 5, // high stress (bad)
      workloadManageability: 1, // low manageability (bad)
      sleepQuality: 1, // low sleep quality (bad)
      fatigueScore: 90
    });

    const perfRecords = []; // using empty for this test
    const pulseChecks = [pc];

    const result = calculateDeterministicFlightRisk(empA, perfRecords, pulseChecks);
    
    expect(result.success).toBe(true);
    expect(result.meta.missingInputs).not.toContain('PulseCheck');
    expect(result.meta.missingInputs).not.toContain('PulseCheck.stressLevel');
    expect(result.meta.missingInputs).toContain('PerformanceRecord.overtime_hours'); // Since we didn't provide any

    // The score should be fairly high because the pulse check values are worst-case and fatigueScore is 50.
    // The wellbeing component adds (0 + 0 + (4/4)*100)/3 = 33.33 * 0.20 weight to the final sum, etc.
    // We mainly care that it didn't drop the 20% weight and read the fields.
    expect(result.score).toBeGreaterThan(0);
  });

  test('No PulseCheck produces safe/no-data behavior (weight dropped)', async () => {
    const result = calculateDeterministicFlightRisk(empA, [], []);
    
    expect(result.success).toBe(true);
    expect(result.meta.missingInputs).toContain('PulseCheck');
    // Result succeeds because fatigue, utilization, performance still give 25+20+15 = 60% > 45% threshold
  });

  test('Another organization\'s PulseCheck does not affect the employee', async () => {
    // Controller logic passes strictly scoped PulseChecks, simulating that scoping here:
    // If we only query orgA pulse checks, empB's pulse checks shouldn't be included.
    const pc = await PulseCheck.create({
      organizationId: orgB._id,
      employeeId: empA._id, // Data leak scenario: EmpA somehow has a PulseCheck under OrgB
      stressLevel: 5,
      workloadManageability: 1,
      sleepQuality: 1,
      fatigueScore: 90
    });

    // Simulated query in controller: PulseCheck.find({ employeeId: empA._id, organizationId: orgA._id })
    const queriedPulseChecks = await PulseCheck.find({ employeeId: empA._id, organizationId: orgA._id });
    expect(queriedPulseChecks.length).toBe(0);

    const result = calculateDeterministicFlightRisk(empA, [], queriedPulseChecks);
    expect(result.meta.missingInputs).toContain('PulseCheck');
  });

  test('Employee A\'s PulseCheck cannot affect Employee B', async () => {
    await PulseCheck.create({
      organizationId: orgA._id,
      employeeId: empA._id,
      stressLevel: 5,
      workloadManageability: 1,
      sleepQuality: 1,
      fatigueScore: 90
    });

    // Simulated query for empB
    const queriedPulseChecks = await PulseCheck.find({ employeeId: empB._id, organizationId: orgA._id });
    expect(queriedPulseChecks.length).toBe(0);

    const result = calculateDeterministicFlightRisk(empB, [], queriedPulseChecks);
    expect(result.meta.missingInputs).toContain('PulseCheck');
  });
});
