/**
 * Metrics Engine — Core productivity & utilization calculators
 * Used by the analysis pipeline to compute base metrics from performance records
 */

const STANDARD_WORK_HOURS = 8; // Standard working hours per day

/**
 * Calculate productivity score (0-100)
 * productivity = (tasks_completed / expected_tasks) × 100
 */
export function calculateProductivity(performanceRecords) {
  if (!performanceRecords || performanceRecords.length === 0) return 0;

  const totalCompleted = performanceRecords.reduce((sum, r) => sum + (r.tasks_completed || 0), 0);
  const totalExpected = performanceRecords.reduce((sum, r) => sum + (r.expected_tasks || 1), 0);

  if (totalExpected === 0) return 0;
  return Math.min(Math.round((totalCompleted / totalExpected) * 100), 100);
}

/**
 * Calculate utilization score (0-100)
 * utilization = (working_hours / available_work_hours) × 100
 */
export function calculateUtilization(performanceRecords, availableHoursPerDay = STANDARD_WORK_HOURS) {
  if (!performanceRecords || performanceRecords.length === 0) return 0;

  const totalWorking = performanceRecords.reduce((sum, r) => sum + (r.working_hours || 0), 0);
  const totalAvailable = performanceRecords.length * availableHoursPerDay;

  if (totalAvailable === 0) return 0;
  return Math.min(Math.round((totalWorking / totalAvailable) * 100), 100);
}

/**
 * Calculate average overtime hours across records
 */
export function calculateAvgOvertime(performanceRecords) {
  if (!performanceRecords || performanceRecords.length === 0) return 0;
  const totalOvertime = performanceRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
  return totalOvertime / performanceRecords.length;
}

/**
 * Calculate average error rate (0-1) across records
 */
export function calculateAvgErrorRate(performanceRecords) {
  if (!performanceRecords || performanceRecords.length === 0) return 0;
  const totalErrorRate = performanceRecords.reduce((sum, r) => sum + (r.error_rate || 0), 0);
  return totalErrorRate / performanceRecords.length;
}

/**
 * Calculate performance trend (positive = improving, negative = declining)
 * Compares recent half vs older half of records
 */
export function calculatePerformanceTrend(performanceRecords) {
  if (!performanceRecords || performanceRecords.length < 4) return 0;

  // Sort by date ascending
  const sorted = [...performanceRecords].sort((a, b) => new Date(a.record_date) - new Date(b.record_date));
  const midpoint = Math.floor(sorted.length / 2);

  const olderRecords = sorted.slice(0, midpoint);
  const recentRecords = sorted.slice(midpoint);

  const olderProductivity = calculateProductivity(olderRecords);
  const recentProductivity = calculateProductivity(recentRecords);

  // Return the percentage change
  if (olderProductivity === 0) return 0;
  return Math.round(((recentProductivity - olderProductivity) / olderProductivity) * 100);
}
