import mongoose from 'mongoose';
import { calculateReadinessScore } from './services/successionEngine.js';
import JobDescription from './models/jobDescriptions.js';
import Employee from './models/Employee.js';

async function run() {
  try {
    console.log('--- 1. Unit Testing Engine ---');
    // Test missing components
    const empBase = { skills: ['java', 'python'], experience_years: 5, performance: 'High' };
    
    // 1A. All Data available
    const jd1 = { requiredSkills: ['java', 'c++'], experienceRequired: 10 };
    // Score: Skills = 1/2 = 50%. Matrix = 100%. Exp = 5/10 = 50%.
    // Weight = 0.45 + 0.40 + 0.15 = 1.0
    // Weighted Sum = (50*0.45) + (100*0.40) + (50*0.15) = 22.5 + 40 + 7.5 = 70.
    const res1 = calculateReadinessScore(empBase, jd1, null);
    console.log('Test 1A (All): Score', res1.readinessScore, 'Expected: 70');

    // 1B. Missing Skills (no skills on JD)
    const jd2 = { experienceRequired: 10 };
    // Weight = 0.40 + 0.15 = 0.55
    // Weighted Sum = (100*0.40) + (50*0.15) = 40 + 7.5 = 47.5
    // Final = 47.5 / 0.55 = 86.36 => 86
    const res2 = calculateReadinessScore(empBase, jd2, null);
    console.log('Test 1B (No JD Skills): Score', res2.readinessScore, 'Expected: 86');
    
    // 1C. Zero Experience required
    const jd3 = { requiredSkills: ['java', 'c++'], experienceRequired: 0 };
    // Exp score = 100
    // Weight = 1.0
    // Sum = (50*0.45) + (100*0.40) + (100*0.15) = 22.5 + 40 + 15 = 77.5 => 78
    const res3 = calculateReadinessScore(empBase, jd3, null);
    console.log('Test 1C (Zero Exp Required): Score', res3.readinessScore, 'Expected: 78');

    // 1D. Missing Performance/AnalysisResult
    const empNoPerf = { skills: ['java', 'python'], experience_years: 5 };
    // Weight = 0.45 + 0.15 = 0.60
    // Sum = (50*0.45) + (50*0.15) = 22.5 + 7.5 = 30
    // Final = 30 / 0.60 = 50
    const res4 = calculateReadinessScore(empNoPerf, jd1, null);
    console.log('Test 1D (No Performance): Score', res4.readinessScore, 'Expected: 50');

    console.log('\n--- 2. Connecting to DB & API Testing ---');
    let res = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'manager@peoplestat.com', password: 'pass1234' })
    });
    
    let loginData = await res.json();
    if (!loginData.token) {
       res = await fetch('http://127.0.0.1:5001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'manager@example.com', password: 'pass1234' })
       });
       loginData = await res.json();
    }
    const token = loginData.token;
    console.log('Got Auth Token.');

    await mongoose.connect('mongodb://127.0.0.1:51515/');
    
    // Create a JobDescription
    const jd = new JobDescription({
      title: 'VP of Engineering',
      department: 'Engineering',
      requiredSkills: ['Leadership', 'System Design'],
      experienceRequired: 10,
      roleCriticality: 'High'
    });
    await jd.save();
    console.log('Created JobDescription ID:', jd._id.toString());

    // Hit GET /roles
    console.log('\nGET /api/succession/roles');
    const rolesReq = await fetch('http://127.0.0.1:5001/api/succession/roles', { headers: { Authorization: `Bearer ${token}` }});
    console.log('Roles status:', rolesReq.status);

    // Hit POST /predict
    console.log('\nPOST /api/succession/plan/:id/predict');
    const predictReq = await fetch(`http://127.0.0.1:5001/api/succession/plan/${jd._id}/predict`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    const predictData = await predictReq.json();
    console.log('Predict status:', predictReq.status);
    console.log(`Found ${predictData.candidates?.length} candidates >= 40 score.`);
    if (predictData.candidates?.length > 0) {
      console.log('Top Candidate:', predictData.candidates[0].name, '- Score:', predictData.candidates[0].readinessScore);
    }

    // Hit PUT /candidate (to manual nominate)
    console.log('\nPUT /api/succession/plan/:id/candidate');
    const firstEmp = await Employee.findOne({});
    const putReq = await fetch(`http://127.0.0.1:5001/api/succession/plan/${jd._id}/candidate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        employeeId: firstEmp._id.toString(),
        readinessTimeframe: 'Ready in 1 Year',
        source: 'Manager Nominated'
      })
    });
    console.log('PUT status:', putReq.status);
    
    // Hit GET /plan
    console.log('\nGET /api/succession/plan/:id');
    const planReq = await fetch(`http://127.0.0.1:5001/api/succession/plan/${jd._id}`, { headers: { Authorization: `Bearer ${token}` }});
    const planData = await planReq.json();
    console.log('Plan Candidates Count:', planData.plan?.candidates?.length);

    process.exit(0);
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
}

run();
