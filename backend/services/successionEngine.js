import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Deterministic engine for Succession Planning
 */
export const calculateReadinessScore = (employee, jobDescription, analysisResult) => {
  let totalWeight = 0;
  let weightedScoreSum = 0;
  
  const empSkills = Array.isArray(employee.skills) 
    ? employee.skills.map(s => s.toLowerCase().trim()) 
    : [];
  
  const reqSkills = Array.isArray(jobDescription.requiredSkills) 
    ? jobDescription.requiredSkills.map(s => s.toLowerCase().trim()) 
    : [];
    
  let matchingSkills = [];
  let missingSkills = [];

  // 1. Skill Match Score (45% Weight)
  if (reqSkills.length > 0) {
    totalWeight += 0.45;
    matchingSkills = reqSkills.filter(s => empSkills.includes(s));
    missingSkills = reqSkills.filter(s => !empSkills.includes(s));
    
    const skillScore = (matchingSkills.length / reqSkills.length) * 100;
    weightedScoreSum += skillScore * 0.45;
  }

  // 2. Talent Matrix Score (40% Weight)
  let hasMatrix = false;
  let talentScore = 0;
  
  if (analysisResult && typeof analysisResult.matrix_x === 'number' && typeof analysisResult.matrix_y === 'number') {
    hasMatrix = true;
    const mx = analysisResult.matrix_x;
    const my = analysisResult.matrix_y;
    talentScore = (((mx - 1) / 5) * 50) + (((my - 1) / 5) * 50);
  } else if (employee.performance) {
    hasMatrix = true;
    if (employee.performance === 'High') talentScore = 100;
    else if (employee.performance === 'Average') talentScore = 60;
    else if (employee.performance === 'Low') talentScore = 20;
    else hasMatrix = false; // Unrecognized
  }

  if (hasMatrix) {
    totalWeight += 0.40;
    weightedScoreSum += talentScore * 0.40;
  }

  // 3. Experience Readiness (15% Weight)
  if (typeof jobDescription.experienceRequired === 'number' && jobDescription.experienceRequired >= 0) {
    totalWeight += 0.15;
    let expScore = 100; // Default if 0
    if (jobDescription.experienceRequired > 0) {
      if (typeof employee.experience_years === 'number') {
        expScore = (employee.experience_years / jobDescription.experienceRequired) * 100;
        if (expScore > 100) expScore = 100;
      } else {
        expScore = 0; // Missing employee experience
      }
    }
    weightedScoreSum += expScore * 0.15;
  }

  // Normalize final score
  if (totalWeight === 0) {
    return {
      success: false,
      error: 'Insufficient data to calculate readiness.',
      readinessScore: 0,
      timeframe: null,
      matchingSkills,
      missingSkills
    };
  }

  let finalScore = Math.round(weightedScoreSum / totalWeight);
  if (finalScore < 0) finalScore = 0;
  if (finalScore > 100) finalScore = 100;

  let timeframe = null;
  if (finalScore >= 80) timeframe = 'Ready Now';
  else if (finalScore >= 60) timeframe = 'Ready in 1 Year';
  else if (finalScore >= 40) timeframe = 'Ready in 3 Years';
  // < 40 remains null

  return {
    success: true,
    readinessScore: finalScore,
    timeframe,
    matchingSkills: Array.isArray(jobDescription.requiredSkills) ? jobDescription.requiredSkills.filter(s => empSkills.includes(s.toLowerCase().trim())) : [],
    missingSkills: Array.isArray(jobDescription.requiredSkills) ? jobDescription.requiredSkills.filter(s => !empSkills.includes(s.toLowerCase().trim())) : [],
  };
};

export const generateSuccessionLLMInsights = async (employee, jobDescription, score, timeframe, missingSkills) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Groq API Key missing.', rationale: null };
    }
    const groq = new Groq({ apiKey });

    const prompt = `You are the OptiNXt HR AI mapping a candidate for a critical role.
Role: ${jobDescription.title}
Candidate: ${employee.name} (Current: ${employee.position})
Determined Readiness: ${timeframe} (Score: ${score}/100)
Missing Required Skills: ${missingSkills.length > 0 ? missingSkills.join(', ') : 'None'}

Provide a 2-3 sentence qualitative rationale for why this candidate was mapped to this readiness timeframe and explicitly mention their development gaps. Do NOT change the readiness timeframe or score.

Return ONLY valid JSON matching this schema exactly:
{
  "rationale": "String explaining the readiness and gaps"
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(chatCompletion.choices[0].message.content);
    return {
      success: true,
      rationale: result.rationale || null
    };
  } catch (error) {
    console.error('Groq LLM Error:', error);
    return { success: false, error: error.message, rationale: null };
  }
};
