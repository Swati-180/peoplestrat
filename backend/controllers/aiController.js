import Employee from '../models/Employee.js';
import AnalysisResult from '../models/AnalysisResult.js';
import Groq from 'groq-sdk';

export const runFitment = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    // Get the latest analysis result for this employee
    const analysis = await AnalysisResult.findOne({ employee_id: employee._id }).sort({ analysis_date: -1 });

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
  try {
    const { message, mode } = req.body;
    const isCareerCoach = mode === 'career_coach';

    // Using Groq API Key
    const apiKey = process.env.GROQ_API_KEY;
    console.log(`AI Assistant Triggered (${mode || 'workforce'}).`);

    if (apiKey) {
      const groq = new Groq({ apiKey });

      // POWERFUL CONTEXT FETCHING (Top 100 analysis results to answer general questions)
      const words = message.replace(/[?!.]/g, '').split(' ').filter(w => w.length > 2);
      const nameRegex = words.length > 0 ? new RegExp(words.join('|'), 'i') : null;

      const [mentionedEmployee, generalAnalyses] = await Promise.all([
        nameRegex ? Employee.findOne({ name: { $regex: nameRegex } }) : null,
        AnalysisResult.find().sort({ analysis_date: -1 }).limit(100).populate('employee_id', 'name band process_area position skills')
      ]);

      console.log(`Context: Found ${generalAnalyses.length} analyses. Specific employee match: ${mentionedEmployee ? 'YES (' + mentionedEmployee.name + ')' : 'NO'}`);

      // Build a rich text context for the AI
      let dataContext = "WORKFORCE DATA SNAPSHOT (Real-time):\n";
      generalAnalyses.forEach((a, i) => {
        dataContext += `${i + 1}. ${a.employee_id?.name || 'Unknown'}: Role=${a.employee_id?.position || 'N/A'}, Fitment=${a.fitment_score}%, Productivity=${a.productivity_score}%, Fatigue=${a.fatigue_score}%, Status=${a.recommendation_type}\n`;
      });

      if (mentionedEmployee) {
        const analysis = await AnalysisResult.findOne({ employee_id: mentionedEmployee._id }).sort({ analysis_date: -1 });
        if (analysis) {
          dataContext += `\nCRITICAL FOCUS: DATA FOR ${mentionedEmployee.name.toUpperCase()}:\n`;
          dataContext += `- Role: ${mentionedEmployee.position}, Band: ${mentionedEmployee.band}, Process: ${mentionedEmployee.process_area}\n`;
          dataContext += `- Precise Scores: Fitment: ${analysis.fitment_score}/100, Performance: ${analysis.productivity_score}%, Fatigue: ${analysis.fatigue_score}%\n`;
          dataContext += `- System Recommendation: ${analysis.recommendation}\n`;
          dataContext += `- Skill Breakdown: ${JSON.stringify(analysis.details)}\n`;
        }
      }

      // Default Workforce prompt
      let systemPrompt = `You are the OptiNXt Workforce Analyst. 
Use the PROVIDED DATA below to answer questions about burnout, reskilling, underutilization, and individual performance.
DO NOT use general knowledge. ONLY use the names and scores from the DATA CONTEXT.

ANSWER FORMAT:
- Be specific. Mention names and exact percentages.
- For individual analysis (like Sarah Johnson), provide a detailed Fitment & Risk assessment.
- For "Who is..." questions, list the top 5 relevant employees from the data.

DATA CONTEXT:
${dataContext}`;

      // Career Coach prompt
      if (isCareerCoach) {
        systemPrompt = `You are the OptiNXt AI Career Coach. 
An employee is talking to you about their career growth, fitment, and performance.
Use the PROVIDED DATA below to give them personalized career advice, upskilling suggestions, and performance improvement tips.

GUIDELINES:
- Be encouraging, professional, and data-driven.
- Refer to their specific scores (Fitment, Productivity, Fatigue).
- If Fitment is low, suggest specific skills to learn based on their role.
- If Fatigue is high, suggest workload management.
- Frame everything around growth and professional development.

DATA CONTEXT:
${dataContext}`;
      }

      try {
        const chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            { role: 'user', content: message },
          ],
          model: 'llama-3.1-8b-instant',
          temperature: 0.2,
          max_tokens: 1024,
          top_p: 1,
          stream: false,
          stop: null
        });

        console.log('Groq AI successfully generated response.');
        return res.json({ success: true, data: { reply: chatCompletion.choices[0].message.content } });
      } catch (apiError) {
        console.error('Groq API Error Detail:', apiError);
        return res.status(500).json({ success: false, error: "The AI Intelligence engine is momentarily unavailable. Please ensure your Groq API key is valid." });
      }
    }

    // Fallback demo mode if no API key
    return res.json({
      success: true,
      data: { reply: "Groq API Key missing. Please provide GROQ_API_KEY in backend environment to enable live AI analysis." }
    });

  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ success: false, error: 'AI Processing Error.' });
  }
};

