import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '..', 'mayamayaConsole.peopleData_QG (1).json');
const data = JSON.parse(readFileSync(filePath, 'utf8'));

console.log('Total records:', data.length);
console.log('With soft skills:', data.filter(d => d.softskillScoresFull && d.softskillScoresFull.length > 0).length);
console.log('With career profile:', data.filter(d => d.careerProfile).length);
console.log('With aptitude scores:', data.filter(d => d.aptitudeScores).length);
console.log('With sprints >0:', data.filter(d => d.completedSprintCount > 0).length);
console.log('With leadership score:', data.filter(d => d.leadershipScore != null).length);

// Domains
const domains = {};
data.forEach(d => { const p = d.userId.split('@'); domains[p[1] || 'unknown'] = (domains[p[1] || 'unknown'] || 0) + 1; });
console.log('\nEmail domains:');
Object.entries(domains).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// Career roles
const roles = {};
data.filter(d => d.careerProfile).forEach(d => {
  (d.careerProfile.roles || []).forEach(r => { roles[r] = (roles[r] || 0) + 1; });
});
console.log('\nCareer roles (top 25):');
Object.entries(roles).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// Industries
const industries = {};
data.filter(d => d.careerProfile).forEach(d => {
  (d.careerProfile.industries || []).forEach(i => { industries[i] = (industries[i] || 0) + 1; });
});
console.log('\nIndustries:');
Object.entries(industries).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// Soft skill categories
const cats = {};
data.filter(d => d.softskillScoresFull).forEach(d => {
  d.softskillScoresFull.forEach(c => { cats[c.categoryName] = (cats[c.categoryName] || 0) + 1; });
});
console.log('\nSoft skill categories:');
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// Sample a record with full data
const fullRecord = data.find(d => d.softskillScoresFull && d.careerProfile && d.aptitudeScores);
if (fullRecord) {
  console.log('\n=== SAMPLE FULL RECORD ===');
  console.log('userId:', fullRecord.userId);
  console.log('sprints:', fullRecord.completedSprintCount);
  console.log('leadershipScore:', fullRecord.leadershipScore);
  console.log('aptitude:', JSON.stringify(fullRecord.aptitudeScores));
  console.log('career roles:', fullRecord.careerProfile.roles);
  console.log('career industries:', fullRecord.careerProfile.industries);
  console.log('career skills count:', fullRecord.careerProfile.skills?.length);
  console.log('softskill categories:', fullRecord.softskillScoresFull.map(c => c.categoryName + ' (' + c.categoryMean + ')'));
}
