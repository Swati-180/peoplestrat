import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

export const calculateDeterministicFlightRisk = (employee, perfRecords, wellbeingCheckins) => {
  let totalWeight = 0;
  let weightedScoreSum = 0;
  const missingInputs = [];
  const partialMissing = [];

  // 1. Fatigue (25%)
  if (typeof employee.fatigueScore === 'number') {
    totalWeight += 0.25;
    weightedScoreSum += employee.fatigueScore * 0.25;
  } else {
    missingInputs.push('Employee.fatigueScore');
  }

  // 2. Utilization (20%)
  if (typeof employee.utilization === 'number') {
    totalWeight += 0.20;
    let utilScore = 20;
    const u = employee.utilization;
    if (u <= 40) {
      utilScore = 100 - (2 * u);
    } else if (u > 40 && u < 85) {
      utilScore = 20;
    } else if (u >= 85) {
      utilScore = 20 + (((u - 85) / 15) * 80);
    }
    weightedScoreSum += utilScore * 0.20;
  } else {
    missingInputs.push('Employee.utilization');
  }

  // 3. Overtime Intensity (20%)
  // Filter records within last 30 calendar days with valid overtime
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const validOvertimeRecords = perfRecords.filter(r => 
    new Date(r.record_date) >= thirtyDaysAgo && 
    typeof r.overtime_hours === 'number'
  );

  if (validOvertimeRecords.length > 0) {
    totalWeight += 0.20;
    const sumOvertime = validOvertimeRecords.reduce((sum, r) => sum + r.overtime_hours, 0);
    const avgOvertime = sumOvertime / validOvertimeRecords.length;
    let otScore = (avgOvertime / 3) * 100;
    if (otScore > 100) otScore = 100;
    weightedScoreSum += otScore * 0.20;
  } else {
    missingInputs.push('PerformanceRecord.overtime_hours');
  }

  // 4. Wellbeing / Sentiment (20%)
  // Latest checkin within 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const recentCheckins = wellbeingCheckins.filter(c => new Date(c.date) >= ninetyDaysAgo)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  
  const latestCheckin = recentCheckins.length > 0 ? recentCheckins[0] : null;

  if (latestCheckin) {
    totalWeight += 0.20;
    let wbComponents = 0;
    let wbScoreSum = 0;

    if (typeof latestCheckin.engagementScore === 'number') {
      wbComponents++;
      wbScoreSum += (100 - latestCheckin.engagementScore);
    } else {
      partialMissing.push('WellbeingCheckin.engagementScore');
    }

    if (typeof latestCheckin.moodScore === 'number') {
      wbComponents++;
      wbScoreSum += ((5 - latestCheckin.moodScore) / 4) * 100;
    } else {
      partialMissing.push('WellbeingCheckin.moodScore');
    }

    if (typeof latestCheckin.stressLevel === 'number') {
      wbComponents++;
      wbScoreSum += ((latestCheckin.stressLevel - 1) / 4) * 100;
    } else {
      partialMissing.push('WellbeingCheckin.stressLevel');
    }

    if (wbComponents > 0) {
      const avgWbScore = wbScoreSum / wbComponents;
      weightedScoreSum += avgWbScore * 0.20;
    } else {
      // If we have a checkin object but none of the fields exist, we drop this component
      totalWeight -= 0.20;
      missingInputs.push('WellbeingCheckin (all fields)');
    }
  } else {
    missingInputs.push('WellbeingCheckin');
  }

  // 5. Performance Mobility (15%)
  if (employee.performance && ['High', 'Average', 'Low'].includes(employee.performance)) {
    totalWeight += 0.15;
    let perfScore = 20; // Average
    if (employee.performance === 'Low') perfScore = 80;
    if (employee.performance === 'High') perfScore = 60;
    weightedScoreSum += perfScore * 0.15;
  } else {
    missingInputs.push('Employee.performance');
  }

  // Calculate final score
  if (totalWeight < 0.45) {
    return {
      success: false,
      error: 'Insufficient data to calculate Flight Risk.',
      meta: {
        dataCompleteness: Math.round(totalWeight * 100) + '%',
        missingInputs: [...missingInputs, ...partialMissing],
        assessmentStatus: 'Insufficient Data'
      }
    };
  }

  let finalScore = Math.round(weightedScoreSum / totalWeight);
  if (finalScore < 0) finalScore = 0;
  if (finalScore > 100) finalScore = 100;

  let riskLevel = 'Low';
  if (finalScore >= 40 && finalScore <= 69) riskLevel = 'Medium';
  if (finalScore >= 70) riskLevel = 'High';

  return {
    success: true,
    score: finalScore,
    riskLevel,
    meta: {
      dataCompleteness: Math.round(totalWeight * 100) + '%',
      missingInputs: [...missingInputs, ...partialMissing],
      assessmentStatus: 'Valid'
    }
  };
};

export const generateLLMInsights = async (employee, score, riskLevel, perfRecords) => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return { success: false, error: 'Groq API Key missing.' };
    }
    const groq = new Groq({ apiKey });

    // Payload for prompt
    const avgOT = perfRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0) / (perfRecords.length || 1);

    const prompt = `You are the OptiNXt HR AI.
An employee named ${employee.name} (Role: ${employee.position}, Perf: ${employee.performance}) has a deterministically calculated Flight Risk Score of ${score}/100 (${riskLevel} Risk).
Their current stats:
- Fatigue Score: ${employee.fatigueScore}/100
- Utilization: ${employee.utilization}%
- Avg Overtime (recent): ${avgOT.toFixed(1)} hrs/day

Generate:
1. Two very short bullet points explaining the top flight risk factors based on the data.
2. Two concrete action items (object format: action, priority (High/Medium/Low), timeline) to mitigate this risk.

Return ONLY valid JSON matching this schema exactly:
{
  "flightRiskFactors": ["factor 1", "factor 2"],
  "actionItems": [
    { "action": "Take action X", "priority": "High", "timeline": "1 week" }
  ]
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
      factors: result.flightRiskFactors || [],
      actionItems: result.actionItems || []
    };
  } catch (error) {
    console.error('Groq LLM Error:', error);
    return { success: false, error: error.message };
  }
};
