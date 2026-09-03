/**
 * Analysis Controller — Triggers and retrieves workforce analytics
 */
import mongoose from 'mongoose';
import Employee from '../models/Employee.js';
import PerformanceRecord from '../models/PerformanceRecord.js';
import FTEWorkload from '../models/FTEWorkload.js';
import AnalysisResult from '../models/AnalysisResult.js';
import { calculateProductivity, calculateUtilization } from '../services/metricsEngine.js';
import { calculateFitmentScore } from '../services/fitmentEngine.js';
import { calculateFatigueScore } from '../services/fatigueEngine.js';
import {
  generateRecommendation,
  generateAutomationRecommendation,
  categorizeTalent,
  calculateMatrixCoordinates
} from '../services/recommendationEngine.js';

/**
 * POST /api/analysis/run
 * Trigger workforce analysis for all employees (or specific employee by query param)
 */
export const runAnalysis = async (req, res) => {
  try {
    const { employeeId } = req.query;

    // Get employees to analyze
    const query = employeeId ? { _id: employeeId } : {};
    const employees = await Employee.find(query);

    if (employees.length === 0) {
      return res.status(404).json({ success: false, error: 'No employees found to analyze' });
    }

    const results = [];
    let errors = [];

    for (const employee of employees) {
      try {
        // Get performance records for this employee
        const perfRecords = await PerformanceRecord.find({ employee_id: employee._id })
          .sort({ record_date: -1 })
          .limit(30); // Last 30 records

        // Calculate scores
        const productivity = calculateProductivity(perfRecords);
        const utilization = calculateUtilization(perfRecords);
        const fitmentResult = calculateFitmentScore(employee, perfRecords);
        const fatigueResult = calculateFatigueScore(perfRecords);

        // Generate recommendation
        const recommendation = generateRecommendation({
          productivity,
          utilization,
          fitmentScore: fitmentResult.fitmentScore,
          fatigueScore: fatigueResult.fatigueScore,
        });

        // Categorize in 6x6 talent matrix
        const matrixResult = calculateMatrixCoordinates({
          productivity,
          quality_score: fitmentResult.qualityScore,
          fitmentScore: fitmentResult.fitmentScore,
          experience_score: fitmentResult.experienceScore,
        });

        // Save analysis result  
        const analysisResult = await AnalysisResult.findOneAndUpdate(
          { employee_id: employee._id },
          {
            employee_id: employee._id,
            productivity_score: productivity,
            utilization_score: utilization,
            fitment_score: fitmentResult.fitmentScore,
            fatigue_score: fatigueResult.fatigueScore,
            recommendation: recommendation.recommendation,
            recommendation_type: recommendation.type,
            matrix_x: matrixResult.x,
            matrix_y: matrixResult.y,
            talent_category: matrixResult.category,
            analysis_date: new Date(),
            details: {
              overtime_index: fatigueResult.overtimeIndex,
              workload_intensity: fatigueResult.workloadIntensity,
              performance_decline: fatigueResult.performanceDecline,
              skill_match_score: fitmentResult.skillMatchScore,
              experience_score: fitmentResult.experienceScore,
              quality_score: fitmentResult.qualityScore,
            },
          },
          { upsert: true, new: true }
        );

        // Update employee record with latest scores
        await Employee.findByIdAndUpdate(employee._id, {
          productivity,
          utilization,
          fitmentScore: fitmentResult.fitmentScore,
          fatigueScore: fatigueResult.fatigueScore,
          updatedAt: new Date(),
        });

        results.push({
          employee: { id: employee._id, name: employee.name, band: employee.band, process_area: employee.process_area },
          scores: {
            productivity,
            utilization,
            fitment: fitmentResult.fitmentScore,
            fatigue: fatigueResult.fatigueScore,
          },
          recommendation: recommendation.type,
          talentCategory: matrixResult.category,
          matrix: { x: matrixResult.x, y: matrixResult.y }
        });
      } catch (empErr) {
        errors.push({ employeeId: employee._id, error: empErr.message });
      }
    }

    res.json({
      success: true,
      analyzedCount: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Analysis run error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/analysis/results
 * Get all analysis results with optional filters
 */
export const getAnalysisResults = async (req, res) => {
  try {
    const { process_area, band, recommendation_type, page = 1, limit = 50 } = req.query;

    // Build filter from employee attributes
    const employeeFilter = {};
    if (process_area) employeeFilter.process_area = process_area;
    if (band) employeeFilter.band = band;

    let employeeIds = null;
    if (Object.keys(employeeFilter).length > 0) {
      const filteredEmployees = await Employee.find(employeeFilter).select('_id');
      employeeIds = filteredEmployees.map(e => e._id);
    }

    const analysisFilter = {};
    if (employeeIds) analysisFilter.employee_id = { $in: employeeIds };
    if (recommendation_type) analysisFilter.recommendation_type = recommendation_type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await AnalysisResult.countDocuments(analysisFilter);

    const results = await AnalysisResult.find(analysisFilter)
      .populate('employee_id', 'name email band process_area sub_process department position currentRole experience_years skills')
      .sort({ analysis_date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: results,
    });
  } catch (error) {
    console.error('Analysis results error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/analysis/employee/:id
 * Get analysis for a specific employee
 */
export const getEmployeeAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const analysis = await AnalysisResult.findOne({ employee_id: id }).sort({ analysis_date: -1 });
    const recentPerformance = await PerformanceRecord.find({ employee_id: id })
      .sort({ record_date: -1 })
      .limit(10);

    // Get talent category
    const talentCategory = analysis ? categorizeTalent({
      productivity: analysis.productivity_score,
      fitmentScore: analysis.fitment_score,
    }) : null;

    res.json({
      success: true,
      employee,
      analysis,
      talentCategory,
      recentPerformance,
    });
  } catch (error) {
    console.error('Employee analysis error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/analysis/summary
 * Workforce summary KPIs
 */
export const getAnalysisSummary = async (req, res) => {
  try {
    const employees = await Employee.find();
    const analysisResults = await AnalysisResult.find();
    const fteWorkloads = await FTEWorkload.find();

    const totalEmployees = employees.length;

    if (totalEmployees === 0) {
      return res.json({
        success: true,
        summary: {
          totalEmployees: 0,
          avgFitment: 0,
          avgProductivity: 0,
          avgUtilization: 0,
          burnoutRiskPercent: 0,
          automationSavings: 0,
          highPerformers: 0,
          underutilized: 0,
          promotionCandidates: 0,
          roleMisalignment: 0,
        },
      });
    }

    // Calculate averages from analysis results
    const avgFitment = analysisResults.length > 0
      ? Math.round(analysisResults.reduce((s, r) => s + r.fitment_score, 0) / analysisResults.length)
      : 0;
    const avgProductivity = analysisResults.length > 0
      ? Math.round(analysisResults.reduce((s, r) => s + r.productivity_score, 0) / analysisResults.length)
      : 0;
    const avgUtilization = analysisResults.length > 0
      ? Math.round(analysisResults.reduce((s, r) => s + r.utilization_score, 0) / analysisResults.length)
      : 0;
    const avgFatigue = analysisResults.length > 0
      ? Math.round(analysisResults.reduce((s, r) => s + r.fatigue_score, 0) / analysisResults.length)
      : 0;

    // Count by recommendation type
    const burnoutCount = analysisResults.filter(r => r.recommendation_type === 'burnout_risk').length;
    const highPerformers = analysisResults.filter(r => r.recommendation_type === 'high_performer').length;
    const underutilized = analysisResults.filter(r => r.recommendation_type === 'underutilized').length;
    const promotionCandidates = analysisResults.filter(r => r.recommendation_type === 'promotion_candidate').length;
    const roleMisalignment = analysisResults.filter(r => r.recommendation_type === 'role_misalignment').length;
    const overloaded = analysisResults.filter(r => r.recommendation_type === 'overloaded').length;

    // Automation savings from FTE workloads
    let totalAutomationSavings = 0;
    const automationOpportunities = [];
    for (const fw of fteWorkloads) {
      const autoRec = generateAutomationRecommendation(fw);
      if (autoRec.isCandidate) {
        totalAutomationSavings += autoRec.estimatedSavings;
        automationOpportunities.push({
          process: fw.process_name,
          subProcess: fw.sub_process,
          savings: autoRec.estimatedSavings,
          fteReduction: autoRec.fteReduction,
        });
      }
    }

    // Distribution by process area
    const processDistribution = {};
    employees.forEach(e => {
      const area = e.process_area || 'Unassigned';
      processDistribution[area] = (processDistribution[area] || 0) + 1;
    });

    // Distribution by band
    const bandDistribution = {};
    employees.forEach(e => {
      const band = e.band || 'Unknown';
      bandDistribution[band] = (bandDistribution[band] || 0) + 1;
    });

    // Distribution for 6x6 Matrix
    const matrixDistribution = [];
    for (let x = 1; x <= 6; x++) {
      for (let y = 1; y <= 6; y++) {
        const count = analysisResults.filter(r => r.matrix_x === x && r.matrix_y === y).length;
        if (count > 0) matrixDistribution.push({ x, y, count });
      }
    }

    res.json({
      success: true,
      summary: {
        totalEmployees,
        avgFitment: avgFitment || 0,
        avgProductivity: avgProductivity || 0,
        avgUtilization: avgUtilization || 0,
        avgFatigue: avgFatigue || 0,
        burnoutRiskPercent: totalEmployees > 0 ? Math.round((burnoutCount / totalEmployees) * 100) : 0,
        automationSavings: totalAutomationSavings || 0,
        automationSavingsFormatted: totalAutomationSavings >= 100000
          ? `$${(totalAutomationSavings / 100000).toFixed(1)}L`
          : `$${(totalAutomationSavings || 0).toLocaleString()}`,
        highPerformers: highPerformers || 0,
        underutilized: underutilized || 0,
        overloaded: overloaded || 0,
        promotionCandidates: promotionCandidates || 0,
        roleMisalignment: roleMisalignment || 0,
        processDistribution: processDistribution || {},
        bandDistribution: bandDistribution || {},
        matrixDistribution: matrixDistribution || [],
        automationOpportunities: automationOpportunities || [],
        lastUpdated: new Date()
      },
    });
  } catch (error) {
    console.error('Analysis summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

import WellbeingCheckin from '../models/WellbeingCheckin.js';
import { calculateDeterministicFlightRisk, generateLLMInsights } from '../services/flightRiskEngine.js';

/**
 * POST /api/analysis/predict-flight-risk/:employeeId
 * Calculates flight risk and generates AI insights
 */
export const predictFlightRisk = async (req, res) => {
  try {
    const { employeeId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ success: false, error: 'Invalid Employee ID format' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });

    const perfRecords = await PerformanceRecord.find({ employee_id: employee._id }).sort({ record_date: -1 }).limit(30);
    const wellbeingCheckins = await WellbeingCheckin.find({ employeeId: employee._id }).sort({ date: -1 }).limit(10);

    const riskResult = calculateDeterministicFlightRisk(employee, perfRecords, wellbeingCheckins);

    if (!riskResult.success) {
      return res.status(400).json({
        success: false,
        employeeId,
        error: riskResult.error,
        meta: riskResult.meta
      });
    }

    const aiInsights = await generateLLMInsights(employee, riskResult.score, riskResult.riskLevel, perfRecords);
    
    // Format action items
    let newActionItems = [];
    if (aiInsights.success && aiInsights.actionItems) {
      newActionItems = aiInsights.actionItems.map(item => ({
        action: `[Flight Risk] ${item.action}`,
        priority: item.priority || 'Medium',
        timeline: item.timeline || 'TBD',
        status: 'Suggested'
      }));
    }

    // Upsert AnalysisResult
    const analysis = await AnalysisResult.findOne({ employee_id: employee._id });
    
    let existingActions = analysis ? analysis.actionItems : [];
    // Deduplicate: remove existing [Flight Risk] items
    existingActions = existingActions.filter(item => !(item.action && item.action.startsWith('[Flight Risk]')));
    const finalActionItems = [...existingActions, ...newActionItems];

    const updatedAnalysis = await AnalysisResult.findOneAndUpdate(
      { employee_id: employee._id },
      {
        flightRiskScore: riskResult.score,
        flightRiskFactors: aiInsights.success ? aiInsights.factors : [],
        actionItems: finalActionItems
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      employeeId,
      data: {
        flightRiskScore: riskResult.score,
        riskLevel: riskResult.riskLevel,
        flightRiskFactors: updatedAnalysis.flightRiskFactors,
        actionItems: newActionItems
      },
      meta: {
        ...riskResult.meta,
        aiInsightsAvailable: aiInsights.success
      }
    });
  } catch (error) {
    console.error('Flight risk prediction error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/analysis/predict-flight-risk-batch
 * Calculates flight risk for all employees deterministically
 */
export const predictFlightRiskBatch = async (req, res) => {
  try {
    const employees = await Employee.find();
    let processed = 0;
    
    for (const employee of employees) {
      const perfRecords = await PerformanceRecord.find({ employee_id: employee._id }).sort({ record_date: -1 }).limit(30);
      const wellbeingCheckins = await WellbeingCheckin.find({ employeeId: employee._id }).sort({ date: -1 }).limit(10);
      
      const riskResult = calculateDeterministicFlightRisk(employee, perfRecords, wellbeingCheckins);
      if (riskResult.success) {
        await AnalysisResult.findOneAndUpdate(
          { employee_id: employee._id },
          { flightRiskScore: riskResult.score },
          { upsert: true, new: true }
        );
        processed++;
      }
    }
    
    res.json({ success: true, processed });
  } catch (error) {
    console.error('Batch flight risk error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/analysis/flight-risk/:employeeId
 * Retrieve stored flight risk for UI
 */
export const getFlightRisk = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const analysis = await AnalysisResult.findOne({ employee_id: employeeId });

    if (!analysis || analysis.flightRiskScore === undefined) {
      return res.status(404).json({ success: false, error: 'Flight risk not calculated yet.' });
    }

    let riskLevel = 'Low';
    if (analysis.flightRiskScore >= 40 && analysis.flightRiskScore <= 69) riskLevel = 'Medium';
    if (analysis.flightRiskScore >= 70) riskLevel = 'High';

    res.json({
      success: true,
      employeeId,
      flightRiskScore: analysis.flightRiskScore,
      riskLevel,
      flightRiskFactors: analysis.flightRiskFactors,
      actionItems: analysis.actionItems.filter(item => item.action && item.action.startsWith('[Flight Risk]')),
      lastCalculated: analysis.updatedAt
    });
  } catch (error) {
    console.error('Get flight risk error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/analysis/gaps
 * Deterministic Gap Analysis Summary
 */
export const getGapAnalysis = async (req, res) => {
  try {
    const employees = await Employee.find().select('_id name position department fitmentScore productivity fatigueScore skills');
    
    const employeesWithGaps = [];
    const severityDistribution = { High: 0, Medium: 0, Low: 0 };
    
    employees.forEach(e => {
      const fitment = e.fitmentScore || 0;
      if (fitment < 85) {
        let severity = "Low";
        let gapCount = 1;
        
        if (fitment < 50) {
          severity = "High";
          gapCount = 4;
        } else if (fitment < 75) {
          severity = "Medium";
          gapCount = 2;
        }
        
        severityDistribution[severity]++;
        
        employeesWithGaps.push({
          _id: e._id,
          name: e.name,
          position: e.position,
          department: e.department,
          fitmentScore: fitment,
          gapCount,
          severity,
          productivity: e.productivity || 0,
          fatigueScore: e.fatigueScore || 0,
          skills: e.skills || []
        });
      }
    });

    // Top gaps (highest gapCount, then lowest fitment)
    const topGaps = [...employeesWithGaps]
      .sort((a, b) => b.gapCount - a.gapCount || a.fitmentScore - b.fitmentScore)
      .slice(0, 10)
      .map(e => ({ name: (e.name || 'Unknown').split(' ')[0], gaps: e.gapCount }));

    const formattedDistribution = [
      { name: "High", value: severityDistribution["High"] },
      { name: "Medium", value: severityDistribution["Medium"] },
      { name: "Low", value: severityDistribution["Low"] }
    ];

    res.json({
      success: true,
      summary: {
        severityDistribution: formattedDistribution,
        topGaps
      },
      employeesWithGaps
    });
  } catch (error) {
    console.error('Gap analysis summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy' });

/**
 * POST /api/analysis/gaps/:employeeId/interventions
 * On-demand AI recommendations
 */
export const getGapInterventions = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const fallbackInterventions = [
      {
        title: "Focused Upskilling",
        description: `Complete advanced ${employee.position || 'role'} certification.`
      },
      {
        title: "Peer Mentorship",
        description: `Pair with a High-Fitment ${employee.position || 'peer'}.`
      }
    ];

    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'mock_key' || process.env.GROQ_API_KEY === 'your_groq_api_key') {
      return res.json({
        success: true,
        interventions: fallbackInterventions,
        source: "fallback"
      });
    }

    const prompt = `You are an expert HR analyst. The following employee has a skill/fitment gap.
Name: ${employee.name}
Role: ${employee.position}
Department: ${employee.department}
Current Fitment Score: ${employee.fitmentScore || 0}/100
Current Skills: ${(employee.skills || []).join(', ')}

Provide exactly 2 targeted, actionable interventions to improve their fitment. 
Respond ONLY with a valid JSON object in this exact format:
{
  "interventions": [
    {
      "title": "Short title",
      "description": "Actionable description"
    }
  ]
}`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
    
    if (aiResponse && Array.isArray(aiResponse.interventions) && aiResponse.interventions.length > 0) {
      return res.json({
        success: true,
        interventions: aiResponse.interventions,
        source: "ai"
      });
    } else {
      throw new Error("Invalid AI response structure");
    }
  } catch (error) {
    console.error('Gap interventions AI error, falling back:', error.message);
    const fallbackInterventions = [
      {
        title: "Focused Upskilling",
        description: "Complete advanced role-specific certification."
      },
      {
        title: "Peer Mentorship",
        description: "Pair with a High-Fitment peer in the same department."
      }
    ];
    res.json({
      success: true,
      interventions: fallbackInterventions,
      source: "fallback"
    });
  }
};
