import { calculateDeterministicFlightRisk } from './services/flightRiskEngine.js';

console.log('--- 1 & 2. Verify Schema Defaults & Insufficient Data ---');
// Because Employee schema has `fatigueScore: { default: 0 }` and `utilization: { default: 0 }`,
// Mongoose guarantees they are never truly missing in the JS object fetched from DB,
// UNLESS a user deliberately disables Mongoose validation/defaults or does a projection
// excluding them. Therefore, an out-of-the-box findById() will always yield at least 45% completeness.
console.log('Is <45% possible with normal Mongoose defaults? No, unless projected out.');

// To test insufficient data genuinely, we pass an employee object without those fields:
const insufficientEmp = { performance: 'Low' }; // only 15% available weight
const insuffResult = calculateDeterministicFlightRisk(insufficientEmp, [], []);
console.log('Insufficient Data Result:', insuffResult);


console.log('\n--- 3. Verify Utilization Formula Boundaries ---');
const testUtils = [0, 40, 50, 85, 90, 100];
testUtils.forEach(u => {
  const e = { utilization: u, fatigueScore: 0 }; // Just enough to pass 45% (util 20% + fatigue 25%)
  const res = calculateDeterministicFlightRisk(e, [], []);
  // We can calculate what utilization score was internally by reversing the final score.
  // Weight = 0.45. Fatigue = 0 => 0. Final score = (UtilScore * 0.20) / 0.45
  // UtilScore = Final * 0.45 / 0.20 = Final * 2.25
  console.log(`Utilization ${u}% => Final Flight Risk Score: ${res.score} (Implies Util Score: ~${Math.round(res.score * 2.25)})`);
});


console.log('\n--- 4. Verify Overtime Averaging ---');
// 3 valid records, 1 missing/invalid, and 1 outside the 30-day window
const today = new Date();
const fortyDaysAgo = new Date();
fortyDaysAgo.setDate(today.getDate() - 40);

const perfRecords = [
  { record_date: today, overtime_hours: 4 }, // Valid
  { record_date: today, overtime_hours: 2 }, // Valid
  { record_date: today, overtime_hours: 3 }, // Valid
  { record_date: today, overtime_hours: null }, // Invalid
  { record_date: today }, // Missing
  { record_date: fortyDaysAgo, overtime_hours: 10 }, // Out of window
];
const e2 = { fatigueScore: 0, utilization: 50 }; // Base to pass 45% threshold
const otResult = calculateDeterministicFlightRisk(e2, perfRecords, []);
// Overtime sum = 4+2+3 = 9. Valid count = 3. Avg = 3.
// OT Score = (3/3)*100 = 100.
// Total weight = 25% (Fatigue 0) + 20% (Util 20) + 20% (OT 100). Sum weights = 65%.
// Final score = (0*0.25 + 20*0.20 + 100*0.20) / 0.65 = (4 + 20) / 0.65 = 24 / 0.65 = 36.92 => 37
console.log('Overtime Result Score:', otResult.score, otResult.meta);


console.log('\n--- 5. Verify Partial Wellbeing Data ---');
const wbRecords = [
  { date: today, stressLevel: 5 } // Only stress available
];
const wbResult = calculateDeterministicFlightRisk(e2, [], wbRecords);
// Fatigue: 0, Util: 20, WB: (Stress 5 -> 100%).
// Total weight: 65%. Score = (4 + 100*0.20)/0.65 = 24/0.65 => 37
console.log('Partial Wellbeing Result Score:', wbResult.score, wbResult.meta);


console.log('\n--- 6. Verify ActionItems Deduplication Logic ---');
let existingActions = [
  { action: 'Discuss career goals', priority: 'Low' },
  { action: '[Flight Risk] Reassign urgent tasks', priority: 'High' }
];
let newActionItems = [
  { action: '[Flight Risk] Recommend vacation', priority: 'High', timeline: 'Immediate', status: 'Suggested' }
];

existingActions = existingActions.filter(item => !(item.action && item.action.startsWith('[Flight Risk]')));
const finalActionItems = [...existingActions, ...newActionItems];
console.log('Deduplicated Action Items:', finalActionItems);
