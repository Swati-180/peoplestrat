/* ================= EMPLOYEE DATA ================= */

export const employees = [
  {
    employeeId: "EMP001",
    name: "Ramesh Kumar",
    email: "ramesh.kumar@company.com",
    department: "Finance",
    position: "Senior Analyst",
    currentRole: "Financial Analyst",
    recommendedRole: "Senior Financial Analyst",
    salary: 85000,
    joiningDate: "2019-03-15",
    scores: {
      fitment: 68,
      productivity: 72,
      utilization: 85,
      fatigue: 45,
      aptitude: 82,
      skill: 78,
      automationPotential: 78,
    },
    experienceYears: 6.2,
    processes: [
      { name: "Vendor Reconciliation", hours: 90, repetitiveScore: 85 },
      { name: "Monthly Close", hours: 40, repetitiveScore: 60 },
      { name: "Budget Analysis", hours: 30, repetitiveScore: 45 },
    ],
    skills: {
      soft: ["Communication", "Time Management", "Attention to Detail"],
      hard: ["Excel", "SQL", "SAP", "Financial Modeling"],
    },
    history: {
      productivity: [
        { month: "Jun", value: 68 }, { month: "Jul", value: 71 }, { month: "Aug", value: 73 },
        { month: "Sep", value: 70 }, { month: "Oct", value: 74 }, { month: "Nov", value: 72 },
      ],
    },
    documents: [
      { name: "Performance Review Q4 2024.pdf", type: "Review" },
      { name: "Advanced Excel Certification.pdf", type: "Certificate" },
    ],
    tags: ["automation-candidate", "high-potential"],
  },
  {
    employeeId: "EMP002",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    department: "IT",
    position: "Team Lead",
    currentRole: "Development Team Lead",
    recommendedRole: "Engineering Manager",
    salary: 95000,
    joiningDate: "2017-08-10",
    scores: {
      fitment: 89,
      productivity: 91,
      utilization: 88,
      fatigue: 28,
      aptitude: 88,
      skill: 92,
      automationPotential: 35,
    },
    experienceYears: 8.5,
    processes: [
      { name: "Code Review", hours: 60, repetitiveScore: 40 },
      { name: "Sprint Planning", hours: 20, repetitiveScore: 30 },
      { name: "Architecture Design", hours: 80, repetitiveScore: 20 },
    ],
    skills: {
      soft: ["Leadership", "Mentoring", "Conflict Resolution"],
      hard: ["Python", "React", "AWS", "Docker", "System Design"],
    },
    history: {
      productivity: [
        { month: "Jun", value: 89 }, { month: "Jul", value: 90 }, { month: "Aug", value: 92 },
        { month: "Sep", value: 91 }, { month: "Oct", value: 90 }, { month: "Nov", value: 91 },
      ],
    },
    documents: [
      { name: "AWS Certification.pdf", type: "Certificate" },
      { name: "Leadership Training.pdf", type: "Training" },
    ],
    tags: ["high-performer", "promotion-ready"],
  },
  {
    employeeId: "EMP003",
    name: "Robert Taylor",
    email: "robert.taylor@company.com",
    department: "Engineering",
    position: "DevOps Engineer",
    currentRole: "Lead DevOps",
    recommendedRole: "Cloud Architect",
    salary: 105000,
    joiningDate: "2020-05-20",
    scores: {
      fitment: 94,
      productivity: 96,
      utilization: 98,
      fatigue: 92,
      aptitude: 91,
      skill: 94,
      automationPotential: 85,
    },
    experienceYears: 7.5,
    processes: [
      { name: "Pipeline Monitoring", hours: 100, repetitiveScore: 40 },
      { name: "Infrastructure Triage", hours: 50, repetitiveScore: 10 },
      { name: "Security Audit", hours: 30, repetitiveScore: 30 },
    ],
    skills: {
      soft: ["Critical Thinking", "Stress Management"],
      hard: ["Kubernetes", "Terraform", "Go", "GCP"],
    },
    history: {
      productivity: [
        { month: "Jun", value: 95 }, { month: "Jul", value: 96 }, { month: "Aug", value: 96 },
        { month: "Sep", value: 97 }, { month: "Oct", value: 95 }, { month: "Nov", value: 96 },
      ],
    },
    documents: [],
    tags: ["burnout-risk", "automation-expert"],
  },
  {
    employeeId: "EMP004",
    name: "James Wilson",
    email: "james.wilson@company.com",
    department: "Analytics",
    position: "Data Analyst",
    currentRole: "Junior Analyst",
    recommendedRole: "Senior Data Analyst",
    salary: 70000,
    joiningDate: "2022-01-15",
    scores: {
      fitment: 64,
      productivity: 58,
      utilization: 52,
      fatigue: 35,
      aptitude: 62,
      skill: 68,
      automationPotential: 75,
    },
    experienceYears: 2.1,
    processes: [
      { name: "Data Cleaning", hours: 120, repetitiveScore: 90 },
      { name: "Reporting", hours: 30, repetitiveScore: 70 },
    ],
    skills: {
      soft: ["Collaboration", "Presentation"],
      hard: ["Python", "Tableau", "SQL", "Statistics"],
    },
    history: {
      productivity: [
        { month: "Jun", value: 55 }, { month: "Jul", value: 57 }, { month: "Aug", value: 58 },
        { month: "Sep", value: 60 }, { month: "Oct", value: 59 }, { month: "Nov", value: 58 },
      ],
    },
    documents: [],
    tags: ["under-utilized", "training-candidate"],
  }
];

/* ================= DERIVED LOGIC ================= */

/* Fitment Band */
export function getFitmentBand(score) {
  if (score >= 85) return "Overfit";
  if (score >= 70) return "Fit";
  if (score >= 50) return "Train-to-Fit";
  return "Unfit";
}

/* Fatigue Risk */
export function getFatigueRisk(score) {
  if (score >= 75) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

/* FTE Calculation */
export function calculateFTE(employee) {
  const totalHours = employee.processes?.reduce(
    (sum, p) => sum + p.hours,
    0
  ) || 0;
  return Number((totalHours / 160).toFixed(2));
}

/* Automation Opportunities */
export function getAutomationCandidates(employee) {
  return employee.processes?.filter(
    (p) => p.repetitiveScore >= 70
  ) || [];
}

/* Search */
export function searchEmployees(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  return employees.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
  );
}

/* Risk Level (used in AI + Optimization) */
export function getOverallRisk(employee) {
  if (!employee) return "Low";
  
  const fatigue = employee.scores?.fatigue || employee.fatigue || 0;
  const fitment = employee.scores?.fitment || employee.fitmentScore || 100;

  if (fatigue >= 75 || fitment < 50) return "High";
  if (fatigue >= 50 || fitment < 70) return "Medium";
  return "Low";
}

/* Default Export */
export default employees;
