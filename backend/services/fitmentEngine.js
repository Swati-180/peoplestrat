/**
 * Fitment Engine — Calculates how well an employee matches their assigned role
 * 
 * fitment_score = (0.4 × productivity) + (0.2 × experience_score) + (0.2 × skill_match_score) + (0.2 × quality_score)
 */

import { calculateProductivity, calculateAvgErrorRate } from './metricsEngine.js';

// Role-skill mapping for the F&A / PSS / SAP domain
const ROLE_SKILL_MAP = {
  // F&A
  'Invoice Posting': ['invoice processing', 'accounts payable', 'SAP FI', 'data entry', 'reconciliation', 'ERP'],
  'Payment Processing': ['payment gateway', 'bank reconciliation', 'treasury', 'cash management', 'NEFT/RTGS', 'compliance'],
  'Customer Invoicing': ['accounts receivable', 'billing', 'collections', 'credit management', 'SAP SD', 'customer relations'],
  'Record to Report': ['general ledger', 'financial reporting', 'month-end close', 'journal entries', 'IFRS', 'audit'],
  'Taxation': ['GST', 'TDS', 'income tax', 'tax filing', 'compliance', 'tax planning', 'statutory reporting'],
  'Treasury': ['cash flow', 'investments', 'forex', 'risk management', 'banking', 'liquidity management'],
  // PSS
  'DMS/Billdesk': ['document management', 'bill processing', 'digital archiving', 'workflow automation', 'scanning'],
  'Helpdesk': ['ticket resolution', 'customer support', 'ITIL', 'service management', 'troubleshooting', 'SLA management'],
  'Master Data Management': ['data governance', 'data quality', 'MDM tools', 'SAP MDG', 'data cleansing', 'validation'],
  // SAP
  'Change Requests': ['SAP ABAP', 'change management', 'functional spec', 'testing', 'configuration', 'transport management'],
  'SAP Support': ['SAP Basis', 'incident management', 'performance tuning', 'system monitoring', 'user management'],
  'Vendor Management': ['procurement', 'vendor onboarding', 'contract management', 'SAP MM', 'negotiation', 'PO processing'],
  'Infrastructure': ['server management', 'network', 'cloud', 'backup', 'disaster recovery', 'security'],
  'New Requirements': ['business analysis', 'requirements gathering', 'solution design', 'UAT', 'project management', 'stakeholder management'],
};

// Band-level experience expectations (years)
const BAND_EXPERIENCE = {
  'OR': 0, 'D3': 1, 'D2': 3, 'D1': 5,
  'M4': 7, 'M3': 9, 'M2': 11, 'M1': 13,
  'L3': 15, 'L2': 18, 'L1': 20,
};

/**
 * Calculate how well an employee's skills match their role requirements
 * @returns 0-100 score
 */
export function calculateSkillMatch(employee) {
  const roleSkills = ROLE_SKILL_MAP[employee.sub_process] || ROLE_SKILL_MAP[employee.currentRole] || [];
  if (roleSkills.length === 0) return 50; // default mid-score if no mapping

  const employeeSkills = (employee.skills || []).map(s => s.toLowerCase());
  let matchCount = 0;

  for (const requiredSkill of roleSkills) {
    const found = employeeSkills.some(es => 
      es.includes(requiredSkill.toLowerCase()) || requiredSkill.toLowerCase().includes(es)
    );
    if (found) matchCount++;
  }

  return Math.round((matchCount / roleSkills.length) * 100);
}

/**
 * Calculate experience score relative to band expectations
 * @returns 0-100 score
 */
export function calculateExperienceScore(employee) {
  const expectedExp = BAND_EXPERIENCE[employee.band] || 5;
  const actualExp = employee.experience_years || 0;
  
  // Score based on how well experience matches or exceeds band expectation
  // Perfect match = 80, exceeds = up to 100, below = proportionally less
  if (actualExp >= expectedExp) {
    return Math.min(80 + Math.round(((actualExp - expectedExp) / Math.max(expectedExp, 1)) * 20), 100);
  }
  return Math.max(Math.round((actualExp / Math.max(expectedExp, 1)) * 80), 10);
}

/**
 * Calculate quality score from error rate
 * quality = (1 - error_rate) × 100
 * @returns 0-100 score
 */
export function calculateQualityScore(performanceRecords) {
  const avgErrorRate = calculateAvgErrorRate(performanceRecords);
  return Math.round((1 - avgErrorRate) * 100);
}

/**
 * Calculate the full fitment score
 * fitment = (0.4 × productivity) + (0.2 × experience) + (0.2 × skill_match) + (0.2 × quality)
 * @returns { fitmentScore, skillMatch, experienceScore, qualityScore, productivity }
 */
export function calculateFitmentScore(employee, performanceRecords) {
  const productivity = calculateProductivity(performanceRecords);
  const experienceScore = calculateExperienceScore(employee);
  const skillMatchScore = calculateSkillMatch(employee);
  const qualityScore = calculateQualityScore(performanceRecords);

  const fitmentScore = Math.round(
    (0.4 * productivity) +
    (0.2 * experienceScore) +
    (0.2 * skillMatchScore) +
    (0.2 * qualityScore)
  );

  return {
    fitmentScore: Math.min(Math.max(fitmentScore, 0), 100),
    productivity,
    experienceScore,
    skillMatchScore,
    qualityScore,
  };
}

export { ROLE_SKILL_MAP, BAND_EXPERIENCE };
