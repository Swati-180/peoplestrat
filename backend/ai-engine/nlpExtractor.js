// Simple NLP mock for Skill Extraction
const KNOWN_SKILLS = ['javascript', 'python', 'react', 'node.js', 'aws', 'docker', 'machine learning', 'sql', 'mongodb', 'express', 'java', 'c++', 'leadership', 'communication', 'agile'];

function extractSkillsFromText(text) {
  const normalizedText = text.toLowerCase();
  const foundSkills = [];
  
  KNOWN_SKILLS.forEach(skill => {
    if (normalizedText.includes(skill)) {
      foundSkills.push(skill);
    }
  });

  return foundSkills;
}

module.exports = { extractSkillsFromText };
