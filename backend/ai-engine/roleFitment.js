// AI Engine for calculating Role Fitment Scores and Recommendations

/**
 * Calculates a Role Fit Score using the weighted formula:
 * RoleFitScore = 0.4 × Skill Match + 0.3 × WDT Score + 0.2 × Experience + 0.1 × Performance
 */
function calculateFitmentScore(employee, targetRoleSkills, wdtScore, experienceScore) {
  // 1. Skill Match Score (Cosine similarity mock / overlap percentage)
  let matchingSkills = 0;
  const employeeSkills = employee.skills || [];
  employeeSkills.forEach(skill => {
    if (targetRoleSkills.includes(skill.toLowerCase())) {
        matchingSkills++;
    }
  });
  const skillMatchScore = targetRoleSkills.length > 0 ? (matchingSkills / targetRoleSkills.length) * 100 : 0;

  // 2. WDT Score
  const normalizedWdtScore = wdtScore || 0; // percentage out of 100

  // 3. Experience Score (normalize 0-10 years to 0-100)
  const normalizedExpScore = Math.min((experienceScore / 10) * 100, 100);

  // 4. Performance Score (assumed out of 100)
  const normalizedPerfScore = employee.performanceScore || 0;

  // Weighted Formula
  const roleFitScore = (0.4 * skillMatchScore) + (0.3 * normalizedWdtScore) + (0.2 * normalizedExpScore) + (0.1 * normalizedPerfScore);

  return roleFitScore;
}

/**
 * Analyzes an employee against standard company roles and returns the best fit.
 */
function recommendRole(employee, latestResult) {
  // Mock Role Dictionary (In a production system, this would query a Roles collection in DB)
  const ROLES = {
    'Frontend Developer': { skills: ['react', 'javascript', 'css', 'html', 'tailwind'], expRequired: 2 },
    'Backend Engineer': { skills: ['node.js', 'express', 'mongodb', 'python', 'sql'], expRequired: 3 },
    'Data Scientist': { skills: ['python', 'machine learning', 'sql', 'statistics', 'aws'], expRequired: 3 },
    'Product Manager': { skills: ['leadership', 'communication', 'agile', 'scrum'], expRequired: 5 },
    'DevOps Engineer': { skills: ['aws', 'docker', 'ci/cd', 'linux', 'bash'], expRequired: 3 }
  };

  const wdtScore = latestResult ? latestResult.percentage : 0;
  
  // Sum up total years of experience across all jobs listed
  const totalExp = employee.experience ? employee.experience.reduce((acc, job) => acc + (job.years || 0), 0) : 0;

  let bestRole = 'Pending Analysis';
  let highestScore = 0;
  let gapAnalysis = [];

  for (const [roleName, roleParams] of Object.entries(ROLES)) {
    const score = calculateFitmentScore(employee, roleParams.skills, wdtScore, totalExp);
    
    if (score > highestScore) {
      highestScore = score;
      bestRole = roleName;
      
      // Calculate missing skills for gap analysis
      const missingSkills = roleParams.skills.filter(s => !employee.skills.map(es => es.toLowerCase()).includes(s));
      gapAnalysis = missingSkills;
    }
  }

  return {
    recommendedRole: bestRole,
    fitmentScore: Math.round(highestScore),
    gapAnalysis: gapAnalysis
  };
}

module.exports = { calculateFitmentScore, recommendRole };
