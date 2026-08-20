import LeadershipPipeline from '../models/LeadershipPipeline.js';
import Employee from '../models/Employee.js';
import AnalysisResult from '../models/AnalysisResult.js';
import Result from '../models/Result.js';
import { calculatePipelineScore, generatePipelineLLMInsights } from '../services/pipelineEngine.js';

/**
 * GET /api/pipeline/leaders
 * Retrieve all active employees currently residing in a pipeline stage
 */
export const getPipelineLeaders = async (req, res) => {
  try {
    const pipeline = await LeadershipPipeline.find({}).populate('employeeId', 'name position department');
    res.json({ success: true, pipeline });
  } catch (error) {
    console.error('getPipelineLeaders error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/pipeline/:employeeId/predict
 * Calculate deterministic score on-demand & generate AI qualitative rationale.
 */
export const predictPipelineStage = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    const analysisResult = await AnalysisResult.findOne({ employee_id: employeeId });
    
    // Find all Leadership360 results for this employee
    const leadership360Results = await Result.find({ employeeId }).populate({
      path: 'assessmentId',
      match: { type: 'Leadership360' }
    });
    
    // Filter out results where the populated assessment didn't match (meaning it was null)
    const valid360Results = leadership360Results.filter(r => r.assessmentId !== null);

    const scoreData = calculatePipelineScore(employee, analysisResult, valid360Results);

    if (!scoreData.success) {
      return res.status(400).json({ success: false, error: scoreData.error });
    }

    // Ephemeral AI Rationale
    const llmResult = await generatePipelineLLMInsights(employee, scoreData.readinessScore, scoreData.predictedStage, scoreData.missingData);

    res.json({
      success: true,
      employeeId,
      readinessScore: scoreData.readinessScore,
      predictedStage: scoreData.predictedStage,
      missingData: scoreData.missingData,
      rationale: llmResult.rationale
    });
  } catch (error) {
    console.error('predictPipelineStage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/pipeline/:employeeId/stage
 * Persist or override the pipeline stage.
 */
export const updatePipelineStage = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { stage } = req.body;

    if (!stage) {
      return res.status(400).json({ success: false, error: 'Pipeline stage is required.' });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    // Re-run the predict logic to determine if this is AI Recommended or Manual Override
    const analysisResult = await AnalysisResult.findOne({ employee_id: employeeId });
    const leadership360Results = await Result.find({ employeeId }).populate({
      path: 'assessmentId',
      match: { type: 'Leadership360' }
    });
    const valid360Results = leadership360Results.filter(r => r.assessmentId !== null);

    const scoreData = calculatePipelineScore(employee, analysisResult, valid360Results);
    
    let source = 'Manual Override';
    if (scoreData.success && scoreData.predictedStage === stage) {
      source = 'AI Recommended';
    }

    // Persist to LeadershipPipeline schema
    let pipelineEntry = await LeadershipPipeline.findOne({ employeeId });
    if (!pipelineEntry) {
      pipelineEntry = new LeadershipPipeline({
        employeeId,
        stage,
        source
      });
    } else {
      pipelineEntry.stage = stage;
      pipelineEntry.source = source;
      pipelineEntry.lastUpdated = Date.now();
    }

    await pipelineEntry.save();

    res.json({ success: true, pipelineEntry });
  } catch (error) {
    console.error('updatePipelineStage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
