import mongoose from 'mongoose';
import { calculatePipelineScore } from './services/pipelineEngine.js';
import Employee from './models/Employee.js';

async function run() {
  try {
    console.log('--- 1. Unit Testing Engine ---');
    // 1A. All Data available
    const empBase = { name: 'Alice', communication: 80, problemSolving: 90, teamwork: 70, adaptability: 80, creativity: 80 };
    const ar1 = { matrix_x: 6, matrix_y: 6 }; // 100 score
    const l360 = [{ percentage: 90 }, { percentage: 70 }]; // Avg 80
    // Matrix: 100 * 0.40 = 40
    // L360: 80 * 0.40 = 32
    // SoftSkills: 80 * 0.20 = 16
    // Total: 88 -> Executive Track
    const res1 = calculatePipelineScore(empBase, ar1, l360);
    console.log('Test 1A (All): Score', res1.readinessScore, 'Expected: 88, Stage:', res1.predictedStage);

    // 1B. Missing 360 Data
    // Weight = 0.40 + 0.20 = 0.60
    // Sum = 40 + 16 = 56
    // Final = 56 / 0.60 = 93.33 => 93
    const res2 = calculatePipelineScore(empBase, ar1, []);
    console.log('Test 1B (No 360): Score', res2.readinessScore, 'Expected: 93, Stage:', res2.predictedStage);
    
    // 1C. Missing Talent Matrix
    // Weight = 0.40 + 0.20 = 0.60
    // Sum = 32 + 16 = 48
    // Final = 48 / 0.60 = 80
    const res3 = calculatePipelineScore(empBase, null, l360);
    console.log('Test 1C (No Matrix): Score', res3.readinessScore, 'Expected: 80, Stage:', res3.predictedStage);

    // 1D. All Zero Soft Skills (dropped)
    const empZero = { communication: 0, problemSolving: 0, teamwork: 0, adaptability: 0, creativity: 0 };
    // Weight = 0.40 + 0.40 = 0.80
    // Sum = 40 + 32 = 72
    // Final = 72 / 0.80 = 90
    const res4 = calculatePipelineScore(empZero, ar1, l360);
    console.log('Test 1D (Zero Soft Skills): Score', res4.readinessScore, 'Expected: 90, Stage:', res4.predictedStage);

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

    await mongoose.connect('mongodb://127.0.0.1:54477/');
    
    const firstEmp = await Employee.findOne({});
    console.log('Testing on Employee ID:', firstEmp._id.toString());

    // Hit POST /predict
    console.log('\nPOST /api/pipeline/:id/predict');
    const predictReq = await fetch(`http://127.0.0.1:5001/api/pipeline/${firstEmp._id}/predict`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    });
    const predictData = await predictReq.json();
    console.log('Predict status:', predictReq.status);
    console.log('Predict Result:', { score: predictData.readinessScore, stage: predictData.predictedStage });

    // Hit PUT /stage (AI Recommended)
    console.log('\nPUT /api/pipeline/:id/stage (matching AI)');
    const putReq1 = await fetch(`http://127.0.0.1:5001/api/pipeline/${firstEmp._id}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stage: predictData.predictedStage }) // same stage
    });
    const putData1 = await putReq1.json();
    console.log('PUT 1 Source:', putData1.pipelineEntry.source);

    // Hit PUT /stage (Manual Override)
    console.log('\nPUT /api/pipeline/:id/stage (override)');
    const putReq2 = await fetch(`http://127.0.0.1:5001/api/pipeline/${firstEmp._id}/stage`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ stage: 'Executive Track' }) // likely different
    });
    const putData2 = await putReq2.json();
    console.log('PUT 2 Source:', putData2.pipelineEntry.source);
    
    // Hit GET /leaders
    console.log('\nGET /api/pipeline/leaders');
    const getReq = await fetch(`http://127.0.0.1:5001/api/pipeline/leaders`, { headers: { Authorization: `Bearer ${token}` }});
    const getData = await getReq.json();
    console.log('Pipeline Count:', getData.pipeline?.length);

    process.exit(0);
  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  }
}

run();
