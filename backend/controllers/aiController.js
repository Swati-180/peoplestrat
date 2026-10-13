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
      const cleanMessage = (message || '').trim();

      // Retrieve authorized employees belonging to the active organization
      const orgEmployees = await Employee.find({ organizationId: req.organizationId })
        .select('name position band process_area sub_process department productivity utilization fitmentScore fatigueScore skills');

      // Attempt to resolve mentioned employee within active organization
      let mentionedEmployee = null;
      if (cleanMessage) {
        // 1. Direct case-insensitive full name match
        mentionedEmployee = orgEmployees.find(e =>
          e.name && cleanMessage.toLowerCase().includes(e.name.toLowerCase())
        );

        // 2. Token-based match for first or last name
        if (!mentionedEmployee) {
          const stopWords = new Set([
            'tell', 'about', 'what', 'who', 'show', 'info', 'give', 'team', 'find', 'does',
            'have', 'with', 'from', 'user', 'role', 'more', 'details', 'know', 'how', 'good',
            'high', 'risk', 'burnout', 'reskill', 'perform', 'top', 'person', 'people', 'are'
          ]);
          const tokens = cleanMessage.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length >= 3 && !stopWords.has(w));

          if (tokens.length > 0) {
            for (const emp of orgEmployees) {
              const nameTokens = emp.name.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
              const matches = nameTokens.filter(t => tokens.includes(t));
              if (matches.length > 0 && matches.length === nameTokens.length) {
                mentionedEmployee = emp;
                break;
              }
            }
            if (!mentionedEmployee) {
              for (const emp of orgEmployees) {
                const nameTokens = emp.name.toLowerCase().split(/\s+/).filter(w => w.length >= 4);
                if (nameTokens.some(t => tokens.includes(t))) {
                  mentionedEmployee = emp;
                  break;
                }
              }
            }
          }
        }
      }

      // Detect if user specifically queried about a person who does not exist
      const individualQueryMatch = cleanMessage.match(/(?:tell\s+me\s+about|who\s+is|what\s+about|info\s+(?:on|for)|details\s+(?:on|for)|how\s+is|search\s+for|show\s+me)\s+([A-Za-z\s]+?)(?:\?|\.|$)/i);
      const queriedTargetName = individualQueryMatch ? individualQueryMatch[1].trim() : null;
      const isSpecificQueryForNonexistent = !mentionedEmployee && queriedTargetName && queriedTargetName.length > 2 && !['burnout', 'reskilling', 'top performers', 'the team', 'fatigue', 'high risk'].includes(queriedTargetName.toLowerCase());

      const generalAnalyses = await AnalysisResult.find({ organizationId: req.organizationId })
        .sort({ analysis_date: -1 })
        .limit(100)
        .populate('employee_id', 'name band process_area position skills');

      let mentionedAnalysis = null;
      if (mentionedEmployee) {
        mentionedAnalysis = await AnalysisResult.findOne({
          employee_id: mentionedEmployee._id,
          organizationId: req.organizationId
        }).sort({ analysis_date: -1 });

        if (!mentionedAnalysis) {
          mentionedAnalysis = await AnalysisResult.findOne({
            employee_id: mentionedEmployee._id
          }).sort({ analysis_date: -1 });
        }
      }

      const effectiveFitment = (mentionedAnalysis && mentionedAnalysis.fitment_score) || mentionedEmployee?.fitmentScore || 0;
      const effectiveProductivity = (mentionedAnalysis && mentionedAnalysis.productivity_score) || mentionedEmployee?.productivity || 0;
      const effectiveFatigue = (mentionedAnalysis && mentionedAnalysis.fatigue_score) || mentionedEmployee?.fatigueScore || 0;
      const effectiveUtilization = (mentionedAnalysis && mentionedAnalysis.utilization_score) || mentionedEmployee?.utilization || 0;
      const effectiveRecommendation = (mentionedAnalysis && mentionedAnalysis.recommendation) || (effectiveFitment >= 80 ? 'Optimal match for current role' : 'Core contributor');

      let dataContext = "WORKFORCE DATA SNAPSHOT (Real-time):\n";
      orgEmployees.slice(0, 50).forEach((emp, i) => {
        const match = generalAnalyses.find(a => a.employee_id?._id?.toString() === emp._id.toString());
        const fit = (match && match.fitment_score) || emp.fitmentScore || 0;
        const prod = (match && match.productivity_score) || emp.productivity || 0;
        const fat = (match && match.fatigue_score) || emp.fatigueScore || 0;
        const recType = (match && match.recommendation_type) || (fit >= 80 ? 'optimal' : 'stable');
        dataContext += `${i + 1}. ${emp.name}: Role=${emp.position || 'N/A'}, Fitment=${fit}%, Productivity=${prod}%, Fatigue=${fat}%, Status=${recType}\n`;
      });

      if (mentionedEmployee) {
        dataContext += `\nCRITICAL FOCUS: DATA FOR ${mentionedEmployee.name.toUpperCase()}:\n`;
        dataContext += `- Name: ${mentionedEmployee.name}\n`;
        dataContext += `- Role: ${mentionedEmployee.position || 'N/A'}, Band: ${mentionedEmployee.band || 'N/A'}, Process: ${mentionedEmployee.process_area || 'N/A'}\n`;
        dataContext += `- Department: ${mentionedEmployee.department || 'N/A'}\n`;
        dataContext += `- Skills: ${(mentionedEmployee.skills || []).join(', ') || 'N/A'}\n`;
        dataContext += `- Precise Scores: Fitment: ${effectiveFitment}/100, Performance: ${effectiveProductivity}%, Fatigue: ${effectiveFatigue}%, Utilization: ${effectiveUtilization}%\n`;
        dataContext += `- System Recommendation: ${effectiveRecommendation}\n`;
        if (mentionedAnalysis && mentionedAnalysis.details) {
          dataContext += `- Skill Breakdown: ${JSON.stringify(mentionedAnalysis.details)}\n`;
        }
      } else if (isSpecificQueryForNonexistent) {
        dataContext += `\nNOTICE: The user inquired about "${queriedTargetName}", but no employee with that name exists in this organization's authorized workforce records.\n`;
      }

      const systemPrompt = `You are the PeopleStrat Workforce Analyst. 
Use the PROVIDED DATA below to answer questions about burnout, reskilling, underutilization, and individual performance.
DO NOT use general knowledge. ONLY use the names and scores from the DATA CONTEXT.

ANSWER FORMAT:
- Be specific. Mention names and exact percentages.
- For individual analysis of an employee present in the data, provide a detailed Fitment & Risk assessment with structured metrics and recommendations.
- If the user asks about an individual who does NOT exist in the provided DATA CONTEXT, clearly and politely inform them that no employee with that name exists in their organization's authorized workforce records, and explain that you can only provide insights for authorized employees in their organization.
- For "Who is..." or "Who should..." questions, list the top relevant employees from the data.

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

      // Deterministic fallback for Workforce Analyst
      let fallbackReply = `[Fallback Response]\n\n`;
      const lowerMessage = message.toLowerCase();

      if (mentionedEmployee) {
        fallbackReply += `Data found for **${mentionedEmployee.name}**:\n`;
        fallbackReply += `- **Role:** ${mentionedEmployee.position || 'N/A'} (Band: ${mentionedEmployee.band || 'N/A'})\n`;
        fallbackReply += `- **Department:** ${mentionedEmployee.department || 'N/A'}\n`;
        fallbackReply += `- **Fitment Score:** ${effectiveFitment}%\n`;
        fallbackReply += `- **Productivity:** ${effectiveProductivity}%\n`;
        fallbackReply += `- **Fatigue / Burnout Risk:** ${effectiveFatigue}%\n`;
        fallbackReply += `- **Utilization:** ${effectiveUtilization}%\n`;
        fallbackReply += `- **Recommendation:** ${effectiveRecommendation}\n`;
      } else if (isSpecificQueryForNonexistent) {
        fallbackReply += `No employee matching "${queriedTargetName}" was found in your organization's authorized workforce records.\n\nPlease verify the spelling or confirm that the employee is registered under your active organization.`;
      } else if (lowerMessage.includes('burnout') || lowerMessage.includes('fatigue') || lowerMessage.includes('risk')) {
        const highRisk = orgEmployees
          .map(e => ({ name: e.name, role: e.position, fatigue: e.fatigueScore || 0 }))
          .filter(e => e.fatigue >= 70)
          .slice(0, 5);
        fallbackReply += `Here are the top employees currently at risk of burnout (Fatigue >= 70%):\n\n`;
        if (highRisk.length === 0) fallbackReply += `No high-risk employees found in the current dataset.\n`;
        highRisk.forEach(e => {
          fallbackReply += `- **${e.name}** (${e.role || 'N/A'}): Fatigue Score: ${e.fatigue}%\n`;
        });
      } else if (lowerMessage.includes('reskill') || lowerMessage.includes('fit') || lowerMessage.includes('train')) {
        const lowFit = orgEmployees
          .map(e => ({ name: e.name, role: e.position, fitment: e.fitmentScore || 0 }))
          .filter(e => e.fitment < 70)
          .slice(0, 5);
        fallbackReply += `Here are employees who might benefit from reskilling or training (Fitment < 70%):\n\n`;
        if (lowFit.length === 0) fallbackReply += `No employees urgently needing reskilling found in the current dataset.\n`;
        lowFit.forEach(e => {
          fallbackReply += `- **${e.name}** (${e.role || 'N/A'}): Fitment Score: ${e.fitment}%\n`;
        });
      } else if (lowerMessage.includes('top') || lowerMessage.includes('perform')) {
        const topPerformers = orgEmployees
          .map(e => ({ name: e.name, role: e.position, productivity: e.productivity || 0 }))
          .filter(e => e.productivity >= 85)
          .slice(0, 5);
        fallbackReply += `Here are our top performers based on recent analysis (Productivity >= 85%):\n\n`;
        if (topPerformers.length === 0) fallbackReply += `No top performers found matching the criteria.\n`;
        topPerformers.forEach(e => {
          fallbackReply += `- **${e.name}** (${e.role || 'N/A'}): Productivity: ${e.productivity}%\n`;
        });
      } else {
        fallbackReply += `I couldn't identify a specific request. Here is a general workforce summary:\n\n`;
        fallbackReply += `Total records analyzed: ${orgEmployees.length}\n`;
        const avgFit = orgEmployees.length ? (orgEmployees.reduce((acc, curr) => acc + (curr.fitmentScore || 0), 0) / orgEmployees.length).toFixed(1) : 0;
        const avgProd = orgEmployees.length ? (orgEmployees.reduce((acc, curr) => acc + (curr.productivity || 0), 0) / orgEmployees.length).toFixed(1) : 0;
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

