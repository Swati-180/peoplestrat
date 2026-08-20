import mongoose from 'mongoose';

async function run() {
  try {
    let res = await fetch('http://127.0.0.1:5001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'manager@peoplestat.com', password: 'pass1234' })
    });
    
    let loginData = await res.json();
    if (!loginData.token) {
       console.log('Trying second email...');
       res = await fetch('http://127.0.0.1:5001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier: 'manager@example.com', password: 'pass1234' })
       });
       loginData = await res.json();
    }
    
    const token = loginData.token;
    console.log('Got token:', token.substring(0, 15) + '...');

    await mongoose.connect('mongodb://127.0.0.1:54483/');
    const empId = '6a8560be542e0013a1e84d97';
    await mongoose.connection.db.collection('employees').updateOne(
      { _id: new mongoose.Types.ObjectId(empId) },
      { $unset: { fatigueScore: "", utilization: "" } }
    );
    console.log('Got Employee ID:', empId);

    console.log('\n--- Testing POST /predict-flight-risk ---');
    const predictRes = await fetch(`http://127.0.0.1:5001/api/analysis/predict-flight-risk/${empId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Status:', predictRes.status);
    console.log('Data:', JSON.stringify(await predictRes.json(), null, 2));

    console.log('\n--- Testing GET /flight-risk ---');
    const getRes = await fetch(`http://127.0.0.1:5001/api/analysis/flight-risk/${empId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Status:', getRes.status);
    console.log('Data:', JSON.stringify(await getRes.json(), null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
