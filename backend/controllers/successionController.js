import JobDescription from '../models/jobDescriptions.js';
import SuccessionPlan from '../models/SuccessionPlan.js';
import Employee from '../models/Employee.js';
import AnalysisResult from '../models/AnalysisResult.js';
import { calculateReadinessScore, generateSuccessionLLMInsights } from '../services/successionEngine.js';

/**
 * GET /api/succession/roles
 * Retrieve critical roles for succession planning
 */
export const getCriticalRoles = async (req, res) => {
  try {
    const roles = await JobDescription.find({ roleCriticality: 'High' });
    res.json({ success: true, roles });
  } catch (error) {
    console.error('getCriticalRoles error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/succession/plan/:targetRoleId
 * Retrieve the active succession plan for a specific role
 */
export const getSuccessionPlan = async (req, res) => {
  try {
    const { targetRoleId } = req.params;
    const plan = await SuccessionPlan.findOne({ targetRoleId }).populate('candidates.employeeId', 'name position band department');
    
    if (!plan) {
      return res.status(404).json({ success: false, error: 'Succession plan not found for this role.' });
    }
    
    res.json({ success: true, plan });
  } catch (error) {
    console.error('getSuccessionPlan error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/succession/plan/:targetRoleId/predict
 * Run the deterministic scoring formula on all employees
 */
export const predictSuccessors = async (req, res) => {
  try {
    const { targetRoleId } = req.params;
    const jobDescription = await JobDescription.findById(targetRoleId);
    if (!jobDescription) {
      return res.status(404).json({ success: false, error: 'Job description not found.' });
    }

    // Get all active employees
    const employees = await Employee.find({});
    const analysisResults = await AnalysisResult.find({});
    
    // Create a map of employeeId -> analysisResult
    const analysisMap = {};
    analysisResults.forEach(ar => {
      analysisMap[ar.employee_id.toString()] = ar;
    });

    const recommendations = [];

    for (const emp of employees) {
      const ar = analysisMap[emp._id.toString()];
      const result = calculateReadinessScore(emp, jobDescription, ar);
      
      if (result.success && result.timeframe) {
        recommendations.push({
          employeeId: emp._id,
          name: emp.name,
          position: emp.position,
          readinessScore: result.readinessScore,
          timeframe: result.timeframe,
          matchingSkills: result.matchingSkills,
          missingSkills: result.missingSkills,
          // We will fetch LLM rationale later only for the top ones to save time, or do it concurrently
        });
      }
    }

    // Sort descending by score
    recommendations.sort((a, b) => b.readinessScore - a.readinessScore);
    
    // Top 5 recommendations get LLM insights
    const topCandidates = recommendations.slice(0, 5);
    
    await Promise.all(topCandidates.map(async (cand) => {
      // Find the employee object
      const emp = employees.find(e => e._id.equals(cand.employeeId));
      const llmResult = await generateSuccessionLLMInsights(emp, jobDescription, cand.readinessScore, cand.timeframe, cand.missingSkills);
      cand.rationale = llmResult.rationale;
    }));

    res.json({ success: true, targetRoleId, candidates: topCandidates });
  } catch (error) {
    console.error('predictSuccessors error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/succession/plan/:targetRoleId/candidate
 * Add a manual candidate or update readiness
 */
export const updateCandidate = async (req, res) => {
  try {
    const { targetRoleId } = req.params;
    const { employeeId, readinessTimeframe, source } = req.body;

    if (!employeeId || !readinessTimeframe || !source) {
      return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const jobDescription = await JobDescription.findById(targetRoleId);
    if (!jobDescription) {
      return res.status(404).json({ success: false, error: 'Job description not found.' });
    }

    let plan = await SuccessionPlan.findOne({ targetRoleId });
    if (!plan) {
      plan = new SuccessionPlan({
        targetRoleId,
        department: jobDescription.department || 'General',
        status: 'Active',
        candidates: []
      });
    }

    // Check if candidate exists in plan
    const existingIndex = plan.candidates.findIndex(c => c.employeeId.toString() === employeeId.toString());
    
    if (existingIndex >= 0) {
      // Update existing
      plan.candidates[existingIndex].readinessTimeframe = readinessTimeframe;
      plan.candidates[existingIndex].source = source;
    } else {
      // Add new
      plan.candidates.push({
        employeeId,
        readinessTimeframe,
        source
      });
    }

    await plan.save();
    
    res.json({ success: true, plan });
  } catch (error) {
    console.error('updateCandidate error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
