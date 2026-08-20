import Employee from '../models/Employee.js';
import AnalysisResult from '../models/AnalysisResult.js';
import PerformanceRecord from '../models/PerformanceRecord.js';

// Helper: find employee by logged-in user's email
const findMyEmployee = async (req) => {
  const email = req.user?.email;
  if (!email) return null;
  return Employee.findOne({ email });
};

// Helper: add scores object for frontend compatibility
const addScores = (emp) => {
  const obj = emp.toObject ? emp.toObject() : { ...emp };
  obj.scores = {
    productivity: obj.productivity || 0,
    utilization: obj.utilization || 0,
    fitment: obj.fitmentScore || 0,
    fatigue: obj.fatigueScore || 0,
    automationPotential: obj.automationPotential || 0,
  };
  return obj;
};

// GET /api/employee/me — own profile
export const getMyProfile = async (req, res) => {
  try {
    const emp = await findMyEmployee(req);
    if (!emp) return res.status(404).json({ success: false, error: 'Employee record not found for your account.' });
    res.json({ success: true, data: addScores(emp) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/employee/me — update own profile
export const updateMyProfile = async (req, res) => {
  try {
    const emp = await findMyEmployee(req);
    if (!emp) return res.status(404).json({ success: false, error: 'Employee record not found.' });

    const allowed = ['location', 'skills', 'position', 'currentRole'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) emp[field] = req.body[field];
    });
    emp.updatedAt = new Date();
    await emp.save();
    res.json({ success: true, data: addScores(emp) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/employee/me/work-metrics
export const getMyWorkMetrics = async (req, res) => {
  try {
    const emp = await findMyEmployee(req);
    if (!emp) return res.status(404).json({ success: false, error: 'Employee record not found.' });

    // Get performance records
    const records = await PerformanceRecord.find({ employee_id: emp._id })
      .sort({ record_date: -1 })
      .limit(30);

    // Get analysis result
    const analysis = await AnalysisResult.findOne({ employee_id: emp._id })
      .sort({ analysis_date: -1 });

    const totalTasks = records.reduce((s, r) => s + (r.tasks_completed || 0), 0);
    const totalHours = records.reduce((s, r) => s + (r.working_hours || 0), 0);
    const totalOvertime = records.reduce((s, r) => s + (r.overtime_hours || 0), 0);

    // Build weekly productivity from productivityHistory or records
    let weeklyProductivity = (emp.productivityHistory || []).slice(-12).map(h => ({
      period: h.month,
      value: h.value || 0,
    }));

    // If no history or all values are zero, provide a realistic fallback for the chart
    if (weeklyProductivity.length === 0 || weeklyProductivity.every(p => p.value === 0)) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const baseProd = emp.productivity || 75;
      weeklyProductivity = months.map(m => ({
        period: m,
        value: Math.round(Math.min(100, Math.max(0, baseProd - 5 + Math.random() * 10)))
      }));
    }

    // Process involvement
    let processInvolvement = (emp.processes || []).map(p => ({
      name: p.name,
      hours: p.hours || 0,
    }));

    if (processInvolvement.length === 0 || processInvolvement.every(p => p.hours === 0)) {
      // Fallback based on department (case-insensitive)
      const dept = (emp.department || '').toUpperCase();
      const deptProcesses = {
        'FINANCE': ['Accounting', 'Taxation', 'Reporting'],
        'IT': ['Development', 'Tickets', 'Maintenance'],
        'HR': ['Recruitment', 'Operations', 'Compliance'],
        'PSS': ['Procurement', 'Support', 'Supply Chain']
      };
      
      const processes = deptProcesses[dept] || ['Operations', 'Meetings', 'Others'];
      processInvolvement = processes.map(p => ({
        name: p,
        hours: Math.floor(15 + Math.random() * 30)
      }));
    }

    res.json({
      success: true,
      data: {
        tasksCompleted: totalTasks,
        workHours: totalHours,
        overtimeHours: totalOvertime,
        productivityScore: emp.productivity || analysis?.productivity_score || 0,
        utilizationPct: emp.utilization || analysis?.utilization_score || 0,
        weeklyProductivity,
        processInvolvement,
        recentRecords: records.slice(0, 10),
        status: emp.utilization > 95 ? 'Overworked' : emp.utilization < 50 ? 'Underutilized' : 'Optimal',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/employee/me/skills
export const getMySkills = async (req, res) => {
  try {
    const emp = await findMyEmployee(req);
    if (!emp) return res.status(404).json({ success: false, error: 'Employee record not found.' });

    const analysis = await AnalysisResult.findOne({ employee_id: emp._id })
      .sort({ analysis_date: -1 });

    // Build skill matrix from employee's skills array
    const currentSkills = (emp.skills || []).map(s => ({
      name: s,
      level: Math.floor(Math.random() * 40) + 60, // simulate proficiency 60-100
    }));

    // Role-required skills (derived from position)
    const roleSkillMap = {
      'Analyst': ['Data Analysis', 'Excel', 'SQL', 'Financial Modeling', 'Reporting'],
      'Senior Analyst': ['Advanced Excel', 'SQL', 'Python', 'Financial Modeling', 'Leadership'],
      'Team Lead': ['Leadership', 'Project Management', 'Strategic Planning', 'Communication', 'Mentoring'],
      'Manager': ['Strategic Planning', 'People Management', 'Budgeting', 'Stakeholder Management', 'Decision Making'],
    };
    const requiredSkills = roleSkillMap[emp.position] || roleSkillMap['Analyst'];

    // Skill gaps
    const ownSkillNames = (emp.skills || []).map(s => s.toLowerCase());
    const gaps = requiredSkills.filter(s => !ownSkillNames.includes(s.toLowerCase()));

    // Learning recommendations
    const recommendations = gaps.map(skill => ({
      skill,
      course: `${skill} Masterclass`,
      provider: ['Coursera', 'Udemy', 'LinkedIn Learning', 'Internal Academy'][Math.floor(Math.random() * 4)],
      duration: `${Math.floor(Math.random() * 20) + 5} hours`,
      priority: Math.random() > 0.5 ? 'High' : 'Medium',
    }));

    res.json({
      success: true,
      data: {
        currentSkills,
        requiredSkills,
        skillGaps: gaps,
        fitmentScore: emp.fitmentScore || analysis?.fitment_score || 0,
        skillMatchPct: requiredSkills.length > 0
          ? Math.round(((requiredSkills.length - gaps.length) / requiredSkills.length) * 100)
          : 0,
        recommendations,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/employee/me/fatigue
export const getMyFatigue = async (req, res) => {
  try {
    const emp = await findMyEmployee(req);
    if (!emp) return res.status(404).json({ success: false, error: 'Employee record not found.' });

    const analysis = await AnalysisResult.findOne({ employee_id: emp._id })
      .sort({ analysis_date: -1 });

    const records = await PerformanceRecord.find({ employee_id: emp._id })
      .sort({ record_date: -1 })
      .limit(30);

    const totalOvertime = records.reduce((s, r) => s + (r.overtime_hours || 0), 0);
    const fatigueScore = emp.fatigueScore || analysis?.fatigue_score || 0;
    const utilizationPct = emp.utilization || analysis?.utilization_score || 0;

    let riskLevel = 'Healthy';
    let riskColor = 'green';
    if (fatigueScore >= 75) { riskLevel = 'Burnout Risk'; riskColor = 'red'; }
    else if (fatigueScore >= 50) { riskLevel = 'Moderate Fatigue'; riskColor = 'yellow'; }

    const alerts = [];
    if (fatigueScore >= 75) alerts.push({ type: 'critical', message: 'High workload detected. Consider taking recovery time.' });
    if (utilizationPct > 95) alerts.push({ type: 'warning', message: 'Utilization is at capacity. Discuss workload with your manager.' });
    if (totalOvertime > 20) alerts.push({ type: 'warning', message: `${totalOvertime} overtime hours logged this period.` });
    if (alerts.length === 0) alerts.push({ type: 'info', message: 'Your workload balance looks healthy. Keep it up!' });

    res.json({
      success: true,
      data: {
        fatigueScore,
        utilizationPct,
        overtimeHours: totalOvertime,
        riskLevel,
        riskColor,
        alerts,
        workloadIntensity: analysis?.details?.workload_intensity || 0,
        performanceDecline: analysis?.details?.performance_decline || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/employee/me/career
export const getMyCareer = async (req, res) => {
  try {
    const emp = await findMyEmployee(req);
    if (!emp) return res.status(404).json({ success: false, error: 'Employee record not found.' });

    const analysis = await AnalysisResult.findOne({ employee_id: emp._id })
      .sort({ analysis_date: -1 });

    const fitment = emp.fitmentScore || analysis?.fitment_score || 0;
    const productivity = emp.productivity || analysis?.productivity_score || 0;

    // Career path
    const careerPath = [
      { title: 'Junior Analyst', level: 1, status: emp.experience_years >= 2 ? 'completed' : 'current' },
      { title: 'Analyst', level: 2, status: emp.experience_years >= 4 ? 'completed' : emp.experience_years >= 2 ? 'current' : 'locked' },
      { title: 'Senior Analyst', level: 3, status: emp.experience_years >= 7 ? 'completed' : emp.experience_years >= 4 ? 'current' : 'locked' },
      { title: 'Team Lead', level: 4, status: emp.experience_years >= 10 ? 'completed' : emp.experience_years >= 7 ? 'current' : 'locked' },
      { title: 'Manager', level: 5, status: emp.experience_years >= 10 ? 'current' : 'locked' },
    ];

    // Next role requirements
    const currentIdx = careerPath.findIndex(c => c.status === 'current');
    const nextRole = currentIdx < careerPath.length - 1 ? careerPath[currentIdx + 1] : null;

    const nextRoleRequirements = nextRole ? [
      { skill: 'Advanced Financial Modeling', met: emp.skills?.includes('Financial Modeling') || false },
      { skill: 'Leadership Skills', met: emp.skills?.includes('leadership') || emp.skills?.includes('Leadership') || false },
      { skill: 'Data Analytics', met: emp.skills?.includes('data analysis') || emp.skills?.includes('Data Analysis') || false },
      { skill: 'Strategic Planning', met: false },
    ] : [];

    const promotionReadiness = Math.round((fitment * 0.4 + productivity * 0.4 + Math.min(emp.experience_years * 10, 100) * 0.2));

    res.json({
      success: true,
      data: {
        name: emp.name,
        email: emp.email,
        position: emp.position,
        department: emp.department,
        fitmentScore: fitment,
        performanceScore: productivity,
        fatigueScore: emp.fatigueScore || analysis?.fatigue_score || 0,
        utilization: emp.utilization || analysis?.utilization_score || 0,
        promotionReadiness,
        talentCategory: analysis?.talent_category || 'Core Contributor',
        recommendationType: analysis?.recommendation_type || 'stable',
        recommendation: analysis?.recommendation || 'Continue current trajectory.',
        careerPath,
        nextRole: nextRole?.title || 'Director',
        nextRoleRequirements,
        radarData: [
          { subject: 'Communication', A: emp.communication || 70, fullMark: 100 },
          { subject: 'Problem Solving', A: emp.problemSolving || 80, fullMark: 100 },
          { subject: 'Teamwork', A: emp.teamwork || 75, fullMark: 100 },
          { subject: 'Adaptability', A: emp.adaptability || 85, fullMark: 100 },
          { subject: 'Creativity', A: emp.creativity || 65, fullMark: 100 },
        ]
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/employee/me/notifications
export const getMyNotifications = async (req, res) => {
  try {
    const emp = await findMyEmployee(req);
    if (!emp) return res.status(404).json({ success: false, error: 'Employee record not found.' });

    const analysis = await AnalysisResult.findOne({ employee_id: emp._id })
      .sort({ analysis_date: -1 });

    const notifications = [];
    const now = new Date();

    // Generate contextual notifications
    if (emp.fatigueScore >= 70) {
      notifications.push({ id: 1, type: 'alert', title: 'High Fatigue Detected', message: 'Your fatigue score is above threshold. Consider discussing workload adjustment.', time: new Date(now - 3600000).toISOString(), read: false });
    }
    if (emp.fitmentScore >= 80 && emp.productivity >= 80) {
      notifications.push({ id: 2, type: 'promotion', title: 'Promotion Opportunity', message: 'Based on your performance and fitment scores, you may be eligible for promotion.', time: new Date(now - 7200000).toISOString(), read: false });
    }
    if (analysis?.recommendation) {
      notifications.push({ id: 3, type: 'insight', title: 'AI Recommendation', message: analysis.recommendation, time: new Date(now - 86400000).toISOString(), read: true });
    }

    // Default notifications
    notifications.push(
      { id: 4, type: 'training', title: 'New Training Available', message: 'A new course on Advanced Data Analytics is available on the learning portal.', time: new Date(now - 172800000).toISOString(), read: true },
      { id: 5, type: 'system', title: 'Profile Update Reminder', message: 'Please review and update your skills profile for the quarterly assessment.', time: new Date(now - 259200000).toISOString(), read: true },
      { id: 6, type: 'feedback', title: 'Manager Feedback Received', message: 'Your manager has provided feedback on your recent project deliverables.', time: new Date(now - 345600000).toISOString(), read: false },
    );

    res.json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
