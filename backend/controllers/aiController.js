import Employee from '../models/Employee.js';
import AnalysisResult from '../models/AnalysisResult.js';
import BehavioralResult from '../models/BehavioralResult.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import Groq from 'groq-sdk';
export const runFitment = async (req, res) => {
  try {
    const employee = await Employee.findOne({ _id: req.params.employeeId, organizationId: req.organizationId });
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    // Get the latest analysis result for this employee
    const analysis = await AnalysisResult.findOne({ employee_id: employee._id, organizationId: req.organizationId }).sort({ analysis_date: -1 });

    if (!analysis) {
      return res.status(404).json({ success: false, error: 'No analysis found. Run workforce analysis first.' });
    }

    res.json({
      success: true,
      data: {
        employee: employee.name,
        analysis: {
          fitmentScore: analysis.fitment_score,
          productivity: analysis.productivity_score,
          utilization: analysis.utilization_score,
          fatigue: analysis.fatigue_score,
          recommendation: analysis.recommendation,
          recommendationType: analysis.recommendation_type,
          details: analysis.details,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const chatAssistant = async (req, res) => {
  console.log('--- chatAssistant triggered ---');
  try {
    const { message, mode } = req.body;
    const isCareerCoach = mode === 'career_coach';

    const apiKey = process.env.GROQ_API_KEY;
    const isApiKeyValid = apiKey && apiKey !== 'gsk_placeholder' && apiKey.trim() !== '';
    
    console.log(`AI Assistant Triggered (${mode || 'workforce'}). API Key Valid: ${isApiKeyValid}`);

    if (isCareerCoach) {
      // PHASE 2: REAL DATA CONTRACT (Logged-in employee isolation)
      const employee = await Employee.findOne({ email: req.user.email, organizationId: req.organizationId });
      
      if (!employee) {
        return res.status(403).json({ success: false, error: 'Employee profile not found in this organization.' });
      }

      // Fetch specific employee data only
      const [analysis, behavior, performance] = await Promise.all([
        AnalysisResult.findOne({ employee_id: employee._id, organizationId: req.organizationId }).sort({ analysis_date: -1 }),
        BehavioralResult.findOne({ employee_id: employee._id, organizationId: req.organizationId }).sort({ completedAt: -1 }),
        PerformanceRecord.find({ employeeId: employee._id, organizationId: req.organizationId }).sort({ date: -1 }).limit(3)
      ]);

      let dataContext = `EMPLOYEE PROFILE (CRITICAL CONTEXT):\n`;
      dataContext += `- Name: ${employee.name}\n`;
      dataContext += `- Role: ${employee.position || 'N/A'}\n`;
      dataContext += `- Department: ${employee.department || 'N/A'}\n`;
      dataContext += `- Skills: ${(employee.skills || []).join(', ') || 'N/A'}\n`;

      if (analysis) {
        dataContext += `- Fitment Score: ${analysis.fitment_score}%\n`;
        dataContext += `- Fatigue Score: ${analysis.fatigue_score}%\n`;
        dataContext += `- Productivity Score: ${analysis.productivity_score}%\n`;
      } else {
        dataContext += `- Fitment Score: unavailable\n`;
      }

      if (behavior) {
        dataContext += `- Behavioral Traits: ${(behavior.traits || []).join(', ')}\n`;
        dataContext += `- Behavioral Match Score: ${behavior.matchScore || 'N/A'}%\n`;
      }

      if (performance && performance.length > 0) {
        dataContext += `- Recent Performance Trends: ${performance.map(p => `${p.rating} (${p.date.toISOString().split('T')[0]})`).join(', ')}\n`;
      } else {
        dataContext += `- Recent Performance Trends: unavailable\n`;
      }

      const systemPrompt = `You are the PeopleStrat AI Career Coach.
You are directly advising the employee described below based ONLY on their real data.
Do NOT invent scores, achievements, skills, certifications, or performance.
Do NOT expose data of other employees.

RESPOND EXACTLY WITH A VALID JSON OBJECT matching this format (no markdown formatting outside of JSON):
{
  "summary": "A friendly natural-language introduction and summary of their career growth trajectory.",
  "fitmentScore": ${analysis && analysis.fitment_score ? analysis.fitment_score : 'null'},
  "fitmentLabel": "A short label describing the fitment (e.g. 'Strong Match', 'Needs Improvement'). Make it appropriate for the fitmentScore if present.",
  "focusAreas": [
    {
      "title": "Area to focus on",
      "description": "Why and how to improve",
      "potential": null
    }
  ],
  "recommendedSkills": ["Skill 1", "Skill 2"],
  "careerActions": ["Action 1", "Action 2"]
}

If fitmentScore is unavailable, output null for fitmentScore and "Unavailable" for fitmentLabel.
DO NOT fabricate a fitmentScore if it's null.
DO NOT fabricate "potential" percentage in focusAreas, use null.
If data for performance trends is requested but unavailable, state that it's unavailable in the summary.

EMPLOYEE DATA CONTEXT:
${dataContext}`;

      if (isApiKeyValid) {
        try {
          const groq = new Groq({ apiKey });
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            model: 'openai/gpt-oss-120b',
            temperature: 0.2,
            max_tokens: 2048,
            response_format: { type: "json_object" }
          });

          return res.json({ success: true, data: { reply: chatCompletion.choices[0].message.content, isFallback: false } });
        } catch (apiError) {
          console.error('Groq API Error Detail (Career Coach):', apiError.message || apiError);
        }
      }

      // Clean fallback for Career Coach (Structured JSON)
      const fallbackReply = {
        summary: "Career insights are temporarily unavailable. Please try again shortly.",
        fitmentScore: analysis ? analysis.fitment_score : null,
        fitmentLabel: analysis ? (analysis.fitment_score >= 80 ? "High Match" : "Average Match") : "Unavailable",
        focusAreas: [],
        recommendedSkills: [],
        careerActions: []
      };

      return res.json({ success: true, data: { reply: JSON.stringify(fallbackReply), isFallback: true } });

    } else {
      // Default Workforce mode
      const words = message.replace(/[?!.]/g, '').split(' ').filter(w => w.length > 2);
      const nameRegex = words.length > 0 ? new RegExp(words.join('|'), 'i') : null;

      const [mentionedEmployee, generalAnalyses] = await Promise.all([
        nameRegex ? Employee.findOne({ name: { $regex: nameRegex }, organizationId: req.organizationId }) : null,
        AnalysisResult.find({ organizationId: req.organizationId }).sort({ analysis_date: -1 }).limit(100).populate('employee_id', 'name band process_area position skills')
      ]);

      let mentionedAnalysis = null;
      if (mentionedEmployee) {
        mentionedAnalysis = await AnalysisResult.findOne({ employee_id: mentionedEmployee._id, organizationId: req.organizationId }).sort({ analysis_date: -1 });
      }

      let dataContext = "WORKFORCE DATA SNAPSHOT (Real-time):\n";
      generalAnalyses.forEach((a, i) => {
        dataContext += `${i + 1}. ${a.employee_id?.name || 'Unknown'}: Role=${a.employee_id?.position || 'N/A'}, Fitment=${a.fitment_score}%, Productivity=${a.productivity_score}%, Fatigue=${a.fatigue_score}%, Status=${a.recommendation_type}\n`;
      });

      if (mentionedEmployee && mentionedAnalysis) {
        dataContext += `\nCRITICAL FOCUS: DATA FOR ${mentionedEmployee.name.toUpperCase()}:\n`;
        dataContext += `- Role: ${mentionedEmployee.position}, Band: ${mentionedEmployee.band}, Process: ${mentionedEmployee.process_area}\n`;
        dataContext += `- Precise Scores: Fitment: ${mentionedAnalysis.fitment_score}/100, Performance: ${mentionedAnalysis.productivity_score}%, Fatigue: ${mentionedAnalysis.fatigue_score}%\n`;
        dataContext += `- System Recommendation: ${mentionedAnalysis.recommendation}\n`;
        dataContext += `- Skill Breakdown: ${JSON.stringify(mentionedAnalysis.details)}\n`;
      }

      const systemPrompt = `You are the PeopleStrat Workforce Analyst. 
Use the PROVIDED DATA below to answer questions about burnout, reskilling, underutilization, and individual performance.
DO NOT use general knowledge. ONLY use the names and scores from the DATA CONTEXT.

ANSWER FORMAT:
- Be specific. Mention names and exact percentages.
- For individual analysis (like Sarah Johnson), provide a detailed Fitment & Risk assessment.
- For "Who is..." questions, list the top 5 relevant employees from the data.

DATA CONTEXT:
${dataContext}`;

      if (isApiKeyValid) {
        try {
          const groq = new Groq({ apiKey });
          const chatCompletion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: message },
            ],
            model: 'openai/gpt-oss-20b',
            temperature: 0.2,
            max_tokens: 1024
          });
          return res.json({ success: true, data: { reply: chatCompletion.choices[0].message.content, isFallback: false } });
        } catch (apiError) {
          console.error('Groq API Error Detail (Workforce):', apiError.message || apiError);
        }
      }

      // Legacy fallback for Workforce Analyst
      let fallbackReply = `[Fallback Response]\n\n`;
      const lowerMessage = message.toLowerCase();

      if (mentionedEmployee && mentionedAnalysis) {
        fallbackReply += `Data found for ${mentionedEmployee.name}:\n`;
        fallbackReply += `- Role: ${mentionedEmployee.position}\n`;
        fallbackReply += `- Fitment Score: ${mentionedAnalysis.fitment_score}%\n`;
        fallbackReply += `- Productivity: ${mentionedAnalysis.productivity_score}%\n`;
        fallbackReply += `- Fatigue/Burnout Risk: ${mentionedAnalysis.fatigue_score}%\n`;
      } else if (lowerMessage.includes('burnout') || lowerMessage.includes('fatigue') || lowerMessage.includes('risk')) {
        const highRisk = generalAnalyses.filter(a => a.fatigue_score >= 70).slice(0, 5);
        fallbackReply += `Here are the top employees currently at risk of burnout (Fatigue >= 70%):\n\n`;
        if (highRisk.length === 0) fallbackReply += `No high-risk employees found in the current dataset.\n`;
        highRisk.forEach(a => {
           fallbackReply += `- ${a.employee_id?.name || 'Unknown'} (${a.employee_id?.position || 'N/A'}): Fatigue Score: ${a.fatigue_score}%\n`;
        });
      } else if (lowerMessage.includes('reskill') || lowerMessage.includes('fit') || lowerMessage.includes('train')) {
        const lowFit = generalAnalyses.filter(a => a.fitment_score < 70).slice(0, 5);
        fallbackReply += `Here are employees who might benefit from reskilling or training (Fitment < 70%):\n\n`;
        if (lowFit.length === 0) fallbackReply += `No employees urgently needing reskilling found in the current dataset.\n`;
        lowFit.forEach(a => {
           fallbackReply += `- ${a.employee_id?.name || 'Unknown'} (${a.employee_id?.position || 'N/A'}): Fitment Score: ${a.fitment_score}%\n`;
        });
      } else if (lowerMessage.includes('top') || lowerMessage.includes('perform')) {
        const topPerformers = generalAnalyses.filter(a => a.productivity_score >= 85).slice(0, 5);
        fallbackReply += `Here are our top performers based on recent analysis (Productivity >= 85%):\n\n`;
        if (topPerformers.length === 0) fallbackReply += `No top performers found matching the criteria.\n`;
        topPerformers.forEach(a => {
           fallbackReply += `- ${a.employee_id?.name || 'Unknown'} (${a.employee_id?.position || 'N/A'}): Productivity: ${a.productivity_score}%\n`;
        });
      } else {
        fallbackReply += `I couldn't identify a specific request. Here is a general workforce summary:\n\n`;
        fallbackReply += `Total records analyzed: ${generalAnalyses.length}\n`;
        const avgFit = generalAnalyses.length ? (generalAnalyses.reduce((acc, curr) => acc + curr.fitment_score, 0) / generalAnalyses.length).toFixed(1) : 0;
        const avgProd = generalAnalyses.length ? (generalAnalyses.reduce((acc, curr) => acc + curr.productivity_score, 0) / generalAnalyses.length).toFixed(1) : 0;
        fallbackReply += `- Average Workforce Fitment: ${avgFit}%\n`;
        fallbackReply += `- Average Workforce Productivity: ${avgProd}%\n`;
      }

      return res.json({
        success: true,
        data: { reply: fallbackReply, isFallback: true }
      });
    }

  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ success: false, error: 'Internal processing error while handling your request.' });
  }
};

