/**
 * Fatigue Engine — Calculates burnout risk for employees
 * 
 * fatigue_score = (0.4 × overtime_hours_index) + (0.3 × workload_intensity) + (0.3 × performance_decline)
 */

import { calculateAvgOvertime, calculatePerformanceTrend } from './metricsEngine.js';

const MAX_OVERTIME_HOURS = 4; // 4 hours overtime/day = max burnout indicator
const STANDARD_HOURS = 8;
const OVERLOAD_THRESHOLD = 10; // 10+ hours/day = high workload intensity

/**
 * Calculate overtime hours index (0-100)
 * Normalized: avg overtime / max expected overtime × 100
 */
export function calculateOvertimeIndex(performanceRecords) {
  const avgOvertime = calculateAvgOvertime(performanceRecords);
  return Math.min(Math.round((avgOvertime / MAX_OVERTIME_HOURS) * 100), 100);
}

/**
 * Calculate workload intensity (0-100)
 * Based on average working hours relative to standard
 */
export function calculateWorkloadIntensity(performanceRecords) {
  if (!performanceRecords || performanceRecords.length === 0) return 0;

  const avgWorkingHours = performanceRecords.reduce((sum, r) => sum + (r.working_hours || 0), 0) / performanceRecords.length;
  
  // Below standard = low intensity, above = proportionally higher
  if (avgWorkingHours <= STANDARD_HOURS) return 0;
  
  const excessHours = avgWorkingHours - STANDARD_HOURS;
  const maxExcess = OVERLOAD_THRESHOLD - STANDARD_HOURS; // 2 hours excess = max intensity
  return Math.min(Math.round((excessHours / maxExcess) * 100), 100);
}

/**
 * Calculate performance decline indicator (0-100)
 * Uses trend: if performance declining, score increases
 */
export function calculatePerformanceDecline(performanceRecords) {
  const trend = calculatePerformanceTrend(performanceRecords);
  
  // Negative trend = declining performance = higher fatigue indicator
  if (trend >= 0) return 0; // No decline
  
  // -50% decline = score of 100 (max fatigue signal)
  return Math.min(Math.round(Math.abs(trend) * 2), 100);
}

/**
 * Calculate full fatigue score
 * fatigue = (0.4 × overtime_index) + (0.3 × workload_intensity) + (0.3 × performance_decline)
 * @returns { fatigueScore, overtimeIndex, workloadIntensity, performanceDecline }
 */
export function calculateFatigueScore(performanceRecords) {
  const overtimeIndex = calculateOvertimeIndex(performanceRecords);
  const workloadIntensity = calculateWorkloadIntensity(performanceRecords);
  const performanceDecline = calculatePerformanceDecline(performanceRecords);

  const fatigueScore = Math.round(
    (0.4 * overtimeIndex) +
    (0.3 * workloadIntensity) +
    (0.3 * performanceDecline)
  );

  return {
    fatigueScore: Math.min(Math.max(fatigueScore, 0), 100),
    overtimeIndex,
    workloadIntensity,
    performanceDecline,
  };
}
