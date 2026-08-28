import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Deterministic engine for Leadership Pipeline
 */
export const calculatePipelineScore = (employee, analysisResult, leadership360Results) => {
  let totalWeight = 0;
  let weightedScoreSum = 0;
  
  const missingData = [];

  // 1. Talent Matrix Score (40% Weight)
  if (analysisResult && typeof analysisResult.matrix_x === 'number' && typeof analysisResult.matrix_y === 'number') {
    totalWeight += 0.40;
    const mx = analysisResult.matrix_x;
    const my = analysisResult.matrix_y;
    const talentScore = (((mx - 1) / 5) * 50) + (((my - 1) / 5) * 50);
    weightedScoreSum += talentScore * 0.40;
  } else {
    missingData.push('Talent Matrix (AnalysisResult)');
  }

  // 2. Leadership360 Score (40% Weight)
  if (Array.isArray(leadership360Results) && leadership360Results.length > 0) {
    totalWeight += 0.40;
    const sumPercentages = leadership360Results.reduce((acc, r) => acc + (typeof r.percentage === 'number' ? r.percentage : 0), 0);
    const avg360 = sumPercentages / leadership360Results.length;
    weightedScoreSum += avg360 * 0.40;
  } else {
    missingData.push('Leadership360 Assessment Results');
  }

  // 3. Soft Skills Baseline (20% Weight)
  const comm = typeof employee.communication === 'number' ? employee.communication : 0;
  const prob = typeof employee.problemSolving === 'number' ? employee.problemSolving : 0;
  const team = typeof employee.teamwork === 'number' ? employee.teamwork : 0;
  const adap = typeof employee.adaptability === 'number' ? employee.adaptability : 0;
  const crea = typeof employee.creativity === 'number' ? employee.creativity : 0;

  if (comm === 0 && prob === 0 && team === 0 && adap === 0 && crea === 0) {
    missingData.push('Soft Skills (All Zero)');
  } else {
    totalWeight += 0.20;
    const avgSoftSkills = (comm + prob + team + adap + crea) / 5;
    weightedScoreSum += avgSoftSkills * 0.20;
  }

  // Normalize final score
  if (totalWeight === 0) {
    return {
      success: false,
      error: 'Insufficient data to calculate leadership pipeline readiness.',
      readinessScore: 0,
      predictedStage: null,
      missingData
    };
  }

  let finalScore = Math.round(weightedScoreSum / totalWeight);
  if (finalScore < 0) finalScore = 0;
  if (finalScore > 100) finalScore = 100;

  let stage = 'Individual Contributor';
  if (finalScore >= 80) stage = 'Executive Track';
  else if (finalScore >= 60) stage = 'Ready for Management';
  else if (finalScore >= 40) stage = 'Emerging Leader';
  // < 40 stays 'Individual Contributor' (heuristic for insufficient pipeline score)

  return {
    success: true,
    readinessScore: finalScore,
    predictedStage: stage,
    missingData
  };
};

export const generatePipelineLLMInsights = async (employee, score, stage, missingData) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Groq API Key missing.', rationale: null };
    }
    const groq = new Groq({ apiKey });

    const prompt = `You are the PeopleStrat HR AI mapping an employee in the Leadership Pipeline.
Candidate: ${employee.name} (Current: ${employee.position})
Determined Stage: ${stage} (Pipeline Score: ${score}/100)
Missing Data Components: ${missingData.length > 0 ? missingData.join(', ') : 'None'}
Candidate Soft Skills: Comm=${employee.communication || 0}, ProbSolving=${employee.problemSolving || 0}, Teamwork=${employee.teamwork || 0}, Adaptability=${employee.adaptability || 0}, Creativity=${employee.creativity || 0}

Provide a 2-3 sentence qualitative "Leadership Profile" summarizing the candidate's strongest traits and areas for development based strictly on these metrics. Do NOT change the pipeline stage or score. Explicitly note that <40 is a product heuristic indicating insufficient readiness, not a permanent career limit.

Return ONLY valid JSON matching this schema exactly:
{
  "rationale": "String explaining the profile and gaps"
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
