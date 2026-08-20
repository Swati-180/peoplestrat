import mongoose from 'mongoose';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:54483/');
  
  // 1. Validate the formula on the existing employee
  const e = await mongoose.connection.db.collection('employees').findOne({_id: new mongoose.Types.ObjectId('6a8557136e6942519994b8ee')});
  console.log('--- Existing Employee Data ---');
  console.log('Fatigue:', e.fatigueScore, 'Util:', e.utilization);
  
  // Formula calculation check:
  // Fatigue: 0, Util: 0 => UtilScore = 100 - 0 = 100
  // Weighted: (0 * 0.25) + (100 * 0.20) = 20
  // Total weight: 0.45
  // Score = 20 / 0.45 = 44.4 => rounded to 44. Wait, the API returned 9. Let's see why!
  // Wait, if utilization is 78%, utilScore = 20. 20 * 0.20 = 4. 4 / 0.45 = 8.8 -> 9!
  // Ah, so utilization is probably 78 or something, producing score 9.

  // 2. Insert mock employee with < 45% completeness
  const insufficientEmpId = new mongoose.Types.ObjectId();
  await mongoose.connection.db.collection('employees').insertOne({
    _id: insufficientEmpId,
    name: 'Insufficient Data Employee',
    email: 'insufficient@example.com',
    // Missing fatigue, utilization, performance
  });
  console.log('Created insufficient employee:', insufficientEmpId);
  
  process.exit(0);
}
run();
