/**
 * Domain Seed Script — AI Workforce Optimization Platform
 * Seeds employees from the real-world JSON dataset (Quintes Global)
 * Maps real talent profiles, soft skills, and career data into 147+ employees
 */
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

import User from './models/User.js';
import Employee from './models/Employee.js';
import PerformanceRecord from './models/PerformanceRecord.js';
import FTEWorkload from './models/FTEWorkload.js';
import AnalysisResult from './models/AnalysisResult.js';
// Removed runAnalysis import to avoid potential circular/import issues during seed
import { ROLE_SKILL_MAP, BAND_EXPERIENCE } from './services/fitmentEngine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_FILE_PATH = join(__dirname, '..', 'mayamayaConsole.peopleData_QG (1).json');

// ─── DOMAIN CONFIGURATION ─────────────────────────────────────
const BANDS = ['OR', 'D3', 'D2', 'D1', 'M4', 'M3', 'M2', 'M1', 'L3', 'L2', 'L1'];
const PROCESS_AREAS = ['F&A', 'PSS', 'SAP'];

const ROLE_PROCESS_MAP = {
  // F&A Mapping
  'Accounts Payable': 'F&A',
  'Payment': 'F&A',
  'Invoice': 'F&A',
  'General Ledger': 'F&A',
  'Taxation': 'F&A',
  'Finance': 'F&A',
  'Audit': 'F&A',
  // PSS Mapping
  'Billdesk': 'PSS',
  'DMS': 'PSS',
  'Helpdesk': 'PSS',
  'Data Management': 'PSS',
  'Support': 'PSS',
  // SAP Mapping
  'SAP': 'SAP',
  'ABAP': 'SAP',
  'Basis': 'SAP',
  'Infrastructure': 'SAP',
  'Developer': 'SAP',
};

// FTE workload data (from PPT domain context)
const FTE_DATA = [
  { process: 'F&A', sub: 'Invoice Posting', fte: 10.5, volume: 2500, repetitive: true, ruleBased: true, automationPot: 75 },
  { process: 'F&A', sub: 'Payment Processing', fte: 8.0, volume: 1800, repetitive: true, ruleBased: true, automationPot: 70 },
  { process: 'F&A', sub: 'Customer Invoicing', fte: 8.5, volume: 1500, repetitive: true, ruleBased: false, automationPot: 45 },
  { process: 'F&A', sub: 'Record to Report', fte: 7.0, volume: 800, repetitive: false, ruleBased: true, automationPot: 40 },
  { process: 'F&A', sub: 'Taxation', fte: 5.5, volume: 600, repetitive: false, ruleBased: true, automationPot: 35 },
  { process: 'F&A', sub: 'Treasury', fte: 4.5, volume: 400, repetitive: false, ruleBased: false, automationPot: 20 },
  { process: 'PSS', sub: 'DMS/Billdesk', fte: 10.0, volume: 3000, repetitive: true, ruleBased: true, automationPot: 80 },
  { process: 'PSS', sub: 'Helpdesk', fte: 8.0, volume: 2000, repetitive: true, ruleBased: false, automationPot: 50 },
  { process: 'PSS', sub: 'Master Data Management', fte: 6.0, volume: 1200, repetitive: true, ruleBased: true, automationPot: 65 },
  { process: 'SAP', sub: 'Change Requests', fte: 9.0, volume: 500, repetitive: false, ruleBased: false, automationPot: 20 },
  { process: 'SAP', sub: 'SAP Support', fte: 9.5, volume: 1500, repetitive: true, ruleBased: false, automationPot: 40 },
  { process: 'SAP', sub: 'Vendor Management', fte: 7.5, volume: 800, repetitive: true, ruleBased: true, automationPot: 55 },
  { process: 'SAP', sub: 'Infrastructure', fte: 9.0, volume: 700, repetitive: false, ruleBased: false, automationPot: 25 },
  { process: 'SAP', sub: 'New Requirements', fte: 7.0, volume: 300, repetitive: false, ruleBased: false, automationPot: 15 },
];

function determineProcess(roleName) {
  if (!roleName) return faker.helpers.arrayElement(PROCESS_AREAS);
  for (const [key, area] of Object.entries(ROLE_PROCESS_MAP)) {
    if (roleName.toLowerCase().includes(key.toLowerCase())) return area;
  }
  return faker.helpers.arrayElement(PROCESS_AREAS);
}

function determineBand(roleName) {
  if (!roleName) return 'OR';
  const rn = roleName.toLowerCase();
  if (rn.includes('vp') || rn.includes('senior vp')) return 'L1';
  if (rn.includes('avp') || rn.includes('director')) return 'M1';
  if (rn.includes('senior manager')) return 'M3';
  if (rn.includes('manager')) return 'M4';
  if (rn.includes('assistant manager')) return 'D1';
  if (rn.includes('senior executive')) return 'D2';
  if (rn.includes('executive')) return 'D3';
  if (rn.includes('team leader')) return 'D1';
  return 'OR';
}

function generatePerformanceRecord(employeeId, processName, aptitudeScores) {
  // Use aptitude scores as weight for performance
  let performanceBias = 0.8; // default
  if (aptitudeScores) {
    const scores = Object.values(aptitudeScores).map(v => parseFloat(v));
    const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 5;
    performanceBias = Math.min((avg / 10) + 0.3, 1.2); // Map 0-10 score to 0.3-1.3 multiplier
  }

  const expectedTasks = faker.number.int({ min: 15, max: 30 });
  const tasksCompleted = Math.round(expectedTasks * faker.number.float({ min: 0.7 * performanceBias, max: 1.1 * performanceBias }));
  
  const workingHours = faker.number.float({ min: 7.5, max: 11, fractionDigits: 1 });
  const overtimeHours = workingHours > 8 ? parseFloat((workingHours - 8).toFixed(1)) : 0;
  const errorRate = faker.number.float({ min: 0.005, max: 0.1, fractionDigits: 3 });

  return {
    employee_id: employeeId,
    tasks_completed: tasksCompleted,
    expected_tasks: expectedTasks,
    working_hours: workingHours,
    overtime_hours: overtimeHours,
    error_rate: errorRate,
    department_process: processName,
    record_date: faker.date.recent({ days: 60 }),
  };
}

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ai-workforce';
      await mongoose.connect(uri);
      console.log('MongoDB Connected for Real Data Seeding...');
    }

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      PerformanceRecord.deleteMany({}),
      FTEWorkload.deleteMany({}),
      AnalysisResult.deleteMany({}),
    ]);
    console.log('✓ Cleared existing data.');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('pass1234', salt);

    // 1. Create Manager Account
    await User.create({
      name: 'Workforce Manager',
      username: 'manager_demo',
      email: 'manager@peoplestat.com',
      password: hashedPassword,
      role: 'manager',
    });
    console.log('✓ Manager account created: manager@peoplestat.com / pass1234');

    // 1.1 Create Demo Employee Account
    const demoEmpUser = await User.create({
      name: 'Demo Employee',
      username: 'employee_demo',
      email: 'employee@peoplestat.com',
      password: hashedPassword,
      role: 'employee',
    });

    const demoEmployee = await Employee.create({
      userid: 'EMP-DEMO-001',
      name: 'Demo Employee',
      email: 'employee@peoplestat.com',
      department: 'Strategy & Operations',
      position: 'Senior Analyst',
      band: 'M4',
      process_area: 'F&A',
      sub_process: 'Invoice Posting',
      salary: 850000,
      experience_years: 5,
      location: 'Bangalore, India',
      productivity: 88,
      utilization: 75,
      fitmentScore: 92,
      creativity: 75,
      communication: 85,
      problemSolving: 90,
      teamwork: 88,
      adaptability: 82,
      skills: ['Excel', 'SAP', 'Financial Analysis', 'Process Optimization'],
      joiningDate: new Date(2021, 0, 15),
    });
    console.log('✓ Demo employee account created: employee@peoplestat.com / pass1234');

    // 2. Load JSON Data
    const rawData = JSON.parse(readFileSync(JSON_FILE_PATH, 'utf8'));
    console.log(`✓ Loaded ${rawData.length} records from JSON.`);

    // 3. Seed FTE Workload Data (Static Domain Context)
    for (const fte of FTE_DATA) {
      await FTEWorkload.create({
        process_name: fte.process,
        sub_process: fte.sub,
        band: 'D2', // Default band for workload metric
        required_fte: fte.fte,
        actual_fte: Math.round(fte.fte * 1.1),
        workload_volume: fte.volume,
        is_repetitive: fte.repetitive,
        is_rule_based: fte.ruleBased,
        automation_potential: fte.automationPot,
        estimated_cost_per_fte: 500000,
      });
    }

    // 4. Seed Employees from JSON
    console.log('Mapping JSON records to Employees...');
    for (const record of rawData) {
      const fullName = faker.person.fullName();
      const email = `${fullName.replace(/\s+/g, '').toLowerCase()}@employee.com`;
      const username = email.split('@')[0];
      
      // Create User
      const user = await User.create({
        name: fullName,
        username,
        email,
        password: hashedPassword,
        role: 'employee',
      });

      // Map career profile
      const roleName = record.careerProfile?.roles?.[0] || 'Executive';
      const processArea = determineProcess(roleName);
      const band = determineBand(roleName);
      
      // Map sub-process (pick one from FTE data that matches processArea)
      const possibleSubs = FTE_DATA.filter(f => f.process === processArea).map(f => f.sub);
      const subProcess = faker.helpers.arrayElement(possibleSubs) || (processArea === 'F&A' ? 'Invoice Posting' : 'Helpdesk');

      // Map skills from softskill categories
      const skills = [];
      if (record.softskillScoresFull) {
        record.softskillScoresFull.forEach(cat => {
          skills.push(cat.categoryName);
          cat.subcategories?.slice(0, 2).forEach(sub => skills.push(sub.subCategoryName));
        });
      }
      if (record.careerProfile?.skills) {
        skills.push(...record.careerProfile.skills.slice(0, 5));
      }

      const allSkills = [...new Set(skills)]; // Consolidate skills

      const employee = await Employee.create({
        userid: record.userId,
        name: fullName,
        email: email,
        department: record.careerProfile?.industries?.[0] || processArea,
        position: record.careerProfile?.roles?.[0] || (band.includes('M') ? 'Manager' : band.includes('L') ? 'Director' : 'Specialist'),
        band: band,
        process_area: processArea,
        sub_process: subProcess,
        salary: Math.round((400000 + Math.random() * 1200000) / 1000) * 1000, 
        experience_years: BAND_EXPERIENCE[band] + Math.floor(Math.random() * 3),
        location: 'Bangalore, India',
        // Set initial scores based on aptitude but with random variance to ensure non-zero dashboard
        productivity: Math.round(70 + Math.random() * 25),
        utilization: Math.round(65 + Math.random() * 30),
        fitmentScore: Math.round(60 + Math.random() * 35),
        fatigueScore: Math.round(15 + Math.random() * 60),
        communication: Math.round(50 + Math.random() * 45),
        problemSolving: Math.round(50 + Math.random() * 45),
        teamwork: Math.round(50 + Math.random() * 45),
        adaptability: Math.round(50 + Math.random() * 45),
        creativity: Math.round(50 + Math.random() * 45),
        skills: allSkills.slice(0, 8),
        currentRole: subProcess,
        performance: Math.random() > 0.8 ? 'High' : Math.random() > 0.4 ? 'Average' : 'Low',
        joiningDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
      });

      // Generate Performance Records
      const recordsToGen = faker.number.int({ min: 15, max: 25 });
      const perfRecords = [];
      for (let i = 0; i < recordsToGen; i++) {
        perfRecords.push(generatePerformanceRecord(employee._id, subProcess, record.aptitudeScores));
      }
      await PerformanceRecord.insertMany(perfRecords);

      // Create Initial Analysis Result for 6x6
      const prod = employee.productivity;
      const fit = employee.fitmentScore;
      const x = Math.min(6, Math.max(1, Math.ceil(fit / 16.6)));
      const y = Math.min(6, Math.max(1, Math.ceil(prod / 16.6)));
      
      await AnalysisResult.create({
        employee_id: employee._id,
        productivity_score: prod,
        utilization_score: employee.utilization,
        fitment_score: fit,
        fatigue_score: employee.fatigueScore,
        matrix_x: x,
        matrix_y: y,
        talent_category: (y >= 5 && x >= 5) ? 'Elite Asset' : (y <= 2 && x <= 2) ? 'Performance Risk' : 'Core Contributor',
        recommendation_type: (y >= 5 && x >= 5) ? 'high_performer' : (employee.fatigueScore > 75) ? 'burnout_risk' : 'stable',
        analysis_date: new Date()
      });
    }

    // 5. Finalize
    const employeesCount = await Employee.countDocuments();
    const recordsCount = await PerformanceRecord.countDocuments();
    const fteCount = await FTEWorkload.countDocuments();

    console.log('\n=========================================');
    console.log('SEEDING COMPLETE');
    console.log(`- Created ${employeesCount} employees with initial scores`);
    console.log(`- Created ${recordsCount} performance records`);
    console.log(`- Created ${fteCount} process workloads`);
    console.log('=========================================\n');
    console.log('Initial analysis complete. Scores have been pre-populated.');
    console.log('Use "Run Intelligence Analysis" in the UI for re-calculation.');
    console.log('=========================================\n');
    console.log('Demo Credentials:');
    console.log('Manager: manager@example.com / pass1234');
    console.log('Employee Password: pass1234 (all accounts)');
    console.log('Example Employee: ' + (await User.findOne({ role: 'employee' })).email);
    console.log('=========================================\n');

    return;

  } catch (err) {
    console.error('Seeding Error:', err);
    throw err;
  }
};

if (import.meta.url.startsWith('file:') && (process.argv[1]?.endsWith('seed.js') || process.argv[1]?.endsWith('seed'))) {
  seedDatabase().then(() => {
    process.exit(0);
  }).catch(() => {
    process.exit(1);
  });
}

export default seedDatabase;
