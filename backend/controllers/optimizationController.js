/**
 * Optimization Controller — Workforce optimization recommendations
 * Now powered by real analysis data and FTE workload analytics
 */
import Employee from '../models/Employee.js';
import AnalysisResult from '../models/AnalysisResult.js';
import FTEWorkload from '../models/FTEWorkload.js';
import { generateAutomationRecommendation } from '../services/recommendationEngine.js';

/**
 * GET /api/optimization/recommendations
 * Generate workforce optimization recommendations from real analytics
 */
export const getRecommendations = async (req, res) => {
  try {
    const employees = await Employee.find({});
    const analyses = await AnalysisResult.find({}).populate('employee_id', 'name band process_area sub_process');
    const fteWorkloads = await FTEWorkload.find({});

    if (!employees || employees.length === 0) {
      return res.status(200).json({ recommendations: [], totalEmployeesAnalysis: 0 });
    }

    // Build recommendations from real analysis data
    const fatigueRiskEmps = analyses.filter(a => a.fatigue_score > 70);
    const skillGapEmps = analyses.filter(a => a.fitment_score < 50);
    const overfitEmps = analyses.filter(a => a.fitment_score > 85 && a.utilization_score < 75);
    const overloadedEmps = analyses.filter(a => a.utilization_score > 95);
    const underutilizedEmps = analyses.filter(a => a.utilization_score < 50);

    // Build automation opportunities
    const automationOpportunities = [];
    let totalAutomationSavings = 0;
    for (const fw of fteWorkloads) {
      const autoRec = generateAutomationRecommendation(fw);
      if (autoRec.isCandidate) {
        automationOpportunities.push({
          process: fw.process_name,
          subProcess: fw.sub_process,
          band: fw.band,
          savings: autoRec.estimatedSavings,
          fteReduction: autoRec.fteReduction,
          recommendation: autoRec.recommendation,
        });
        totalAutomationSavings += autoRec.estimatedSavings;
      }
    }

    const recommendations = [];

    // 1. Fatigue Risk Mitigation
    if (fatigueRiskEmps.length > 0) {
      recommendations.push({
        title: 'Fatigue Risk Mitigation',
        description: `Critical burnout risk detected for ${fatigueRiskEmps.length} employee(s) based on overtime patterns and workload intensity analysis.`,
        impact: {
          employees: fatigueRiskEmps.length,
          savings: `$${(fatigueRiskEmps.length * 95000 / 100000).toFixed(1)}L`,
          riskReduction: '45%',
        },
        basis: 'Fatigue & Stress Exposure Analysis',
        affectedEmployees: fatigueRiskEmps.slice(0, 5).map(a => ({
          name: a.employee_id?.name,
          band: a.employee_id?.band,
          process: a.employee_id?.process_area,
          fatigueScore: a.fatigue_score,
        })),
        actions: [
          'Mandatory recovery cycle assignment',
          'Redistribute high-complexity tasks',
          'Conduct 1:1 wellbeing pulse checks',
        ],
      });
    }

    // 2. Reallocate High-Fitment Talent
    if (overfitEmps.length > 0) {
      recommendations.push({
        title: 'Reallocate High-Fitment Talent',
        description: `${overfitEmps.length} employee(s) show high fitment but underutilization, indicating potential for higher-responsibility roles.`,
        impact: {
          employees: overfitEmps.length,
          savings: `$${(overfitEmps.length * 45000 / 100000).toFixed(1)}L`,
          riskReduction: '15%',
        },
        basis: 'Fitment vs Utilization Matrix',
        affectedEmployees: overfitEmps.slice(0, 5).map(a => ({
          name: a.employee_id?.name,
          band: a.employee_id?.band,
          fitment: a.fitment_score,
          utilization: a.utilization_score,
        })),
        actions: [
          'Evaluate for project leadership roles',
          'Open internal mobility tracks',
          'Review workload distribution',
        ],
      });
    }

    // 3. Targeted Reskilling
    if (skillGapEmps.length > 0) {
      recommendations.push({
        title: 'Targeted Reskilling Program',
        description: `Skill gaps detected for ${skillGapEmps.length} employee(s) based on fitment analysis against role requirements.`,
        impact: {
          employees: skillGapEmps.length,
          savings: `$${(skillGapEmps.length * 80000 / 100000).toFixed(1)}L`,
          riskReduction: '32%',
        },
        basis: 'Gap Analysis Intelligence',
        affectedEmployees: skillGapEmps.slice(0, 5).map(a => ({
          name: a.employee_id?.name,
          band: a.employee_id?.band,
          fitment: a.fitment_score,
        })),
        actions: [
          'Deploy automated learning paths',
          'Allocate skill development credits',
          'Schedule mentorship workshops',
        ],
      });
    }

    // 4. Overload Mitigation
    if (overloadedEmps.length > 0) {
      recommendations.push({
        title: 'Workload Rebalancing',
        description: `${overloadedEmps.length} employee(s) have utilization over 95%, creating quality and retention risk.`,
        impact: {
          employees: overloadedEmps.length,
          savings: `$${(overloadedEmps.length * 60000 / 100000).toFixed(1)}L`,
          riskReduction: '25%',
        },
        basis: 'Utilization Threshold Analysis',
        actions: [
          'Redistribute tasks to underutilized team members',
          'Assess process automation opportunities',
          'Hire for critical capacity gaps',
        ],
      });
    }

    // 5. Automation Opportunities
    if (automationOpportunities.length > 0) {
      recommendations.push({
        title: 'Process Automation Opportunities',
        description: `${automationOpportunities.length} process area(s) identified with automation potential. Total estimated savings: $${(totalAutomationSavings / 100000).toFixed(1)}L annually.`,
        impact: {
          processes: automationOpportunities.length,
          savings: `$${(totalAutomationSavings / 100000).toFixed(1)}L`,
          riskReduction: '20%',
        },
        basis: 'FTE Workload & Automation Analysis',
        automationDetails: automationOpportunities.slice(0, 5),
        actions: [
          'Prioritize RPA implementation for high-volume processes',
          'Conduct automation feasibility studies',
          'Build business case for technology investment',
        ],
      });
    }

    res.status(200).json({
      recommendations,
      totalEmployeesAnalysis: employees.length,
      summary: {
        burnoutRisk: fatigueRiskEmps.length,
        overloaded: overloadedEmps.length,
        underutilized: underutilizedEmps.length,
        skillGaps: skillGapEmps.length,
        promotionReady: overfitEmps.length,
        automationCandidates: automationOpportunities.length,
        totalAutomationSavings,
      },
    });
  } catch (error) {
    console.error('Optimization Generation Error:', error);
    res.status(500).json({ message: 'Error generating recommendations' });
  }
};
