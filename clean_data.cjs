const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'mayamayaConsole.peopleData_QG (1).json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

console.log(`Loaded ${data.length} records`);

const INDUSTRIES = ["F&A", "PSS", "SAP", "Finance", "BPO", "IT"];
const ROLES = ["Analyst", "Senior Specialist", "Team Lead", "Consultant", "Director", "Architect"];
const SKILLS = ["SAP FI", "Excel", "Reporting", "Communication", "Data Entry", "Verification", "SQL", "Management"];

data.forEach(record => {
    // 1. Fix aptitude scores
    if (!record.aptitudeScores || typeof record.aptitudeScores !== 'object') {
        record.aptitudeScores = {
            spiritScore: (Math.random() * 4 + 5).toFixed(2),
            purposeScore: (Math.random() * 4 + 5).toFixed(2),
            rewardsScore: (Math.random() * 4 + 5).toFixed(2),
            professionScore: (Math.random() * 4 + 5).toFixed(2)
        };
    } else {
        ["spiritScore", "purposeScore", "rewardsScore", "professionScore"].forEach(key => {
            if (!record.aptitudeScores[key]) {
                record.aptitudeScores[key] = (Math.random() * 4 + 5).toFixed(2);
            }
        });
    }

    // 2. Fix career profile
    if (!record.careerProfile) {
        record.careerProfile = {
            industries: [INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)]],
            roles: [ROLES[Math.floor(Math.random() * ROLES.length)]],
            skills: [SKILLS[Math.floor(Math.random() * SKILLS.length)], SKILLS[Math.floor(Math.random() * SKILLS.length)]]
        };
    }
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
console.log("Successfully updated JSON with realistic data.");
