/**
 * Analytics Controller — ESM version
 * Provides workforce summary and skill gap analytics
 */
import Employee from '../models/Employee.js';
import AnalysisResult from '../models/AnalysisResult.js';
import FTEWorkload from '../models/FTEWorkload.js';

export const getWorkforceSummary = async (req, res) => {
  try {
    const employees = await Employee.find();
    const analyses = await AnalysisResult.find();

    const totalEmployees = employees.length;

    // Aggregate from analysis results if available
    const departmentCounts = {};
    const processDistribution = {};
    const bandDistribution = {};
    const roleDistribution = {};

    employees.forEach(emp => {
      departmentCounts[emp.department || 'Unassigned'] = (departmentCounts[emp.department || 'Unassigned'] || 0) + 1;
      processDistribution[emp.process_area || 'Unassigned'] = (processDistribution[emp.process_area || 'Unassigned'] || 0) + 1;
      bandDistribution[emp.band || 'Unknown'] = (bandDistribution[emp.band || 'Unknown'] || 0) + 1;
      if (emp.currentRole) roleDistribution[emp.currentRole] = (roleDistribution[emp.currentRole] || 0) + 1;
    });

    const avgFitment = analyses.length > 0
      ? Math.round(analyses.reduce((s, a) => s + a.fitment_score, 0) / analyses.length)
      : employees.length > 0
        ? Math.round(employees.reduce((s, e) => s + (e.fitmentScore || 0), 0) / employees.length)
        : 0;

    const avgProductivity = analyses.length > 0
      ? Math.round(analyses.reduce((s, a) => s + a.productivity_score, 0) / analyses.length)
      : employees.length > 0
        ? Math.round(employees.reduce((s, e) => s + (e.productivity || 0), 0) / employees.length)
        : 0;

    res.json({
      success: true,
      data: {
        totalEmployees,
        averageFitment: avgFitment,
        averageProductivity: avgProductivity,
        departmentCounts,
        processDistribution,
        bandDistribution,
        roleDistribution,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getSkillGaps = async (req, res) => {
  try {
    const employees = await Employee.find();
    const analyses = await AnalysisResult.find();

    // Identify skill gaps by analyzing low-fitment employees
    const lowFitment = analyses.filter(a => a.fitment_score < 50);
    const gapsByProcess = {};

    for (const analysis of lowFitment) {
      const employee = employees.find(e => e._id.toString() === analysis.employee_id.toString());
      if (employee) {
        const process = employee.sub_process || employee.process_area || 'Unknown';
        if (!gapsByProcess[process]) {
          gapsByProcess[process] = { count: 0, avgFitment: 0 };
        }
        gapsByProcess[process].count++;
        gapsByProcess[process].avgFitment += analysis.fitment_score;
      }
    }

    // Calculate averages
    Object.keys(gapsByProcess).forEach(key => {
      gapsByProcess[key].avgFitment = Math.round(gapsByProcess[key].avgFitment / gapsByProcess[key].count);
    });

    res.json({
      success: true,
      data: {
        title: 'Workforce Skill Gaps by Process',
        totalLowFitment: lowFitment.length,
        gaps: gapsByProcess,
        recommendation: lowFitment.length > 10
          ? 'Significant skill gaps detected. Prioritize targeted reskilling programs.'
          : 'Skill gaps are within manageable range. Continue regular upskilling.',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
