/**
 * Recommendation Engine — Generates human-readable AI recommendations
 * Based on analysis scores and workforce optimization rules
 */

/**
 * Generate recommendation for a single employee based on their analysis scores
 * @param {Object} scores - { productivity, utilization, fitmentScore, fatigueScore }
 * @returns { type: string, recommendation: string, priority: string }
 */
export function generateRecommendation(scores) {
  const { productivity, utilization, fitmentScore, fatigueScore } = scores;

  // Priority order: burnout first (safety), then misalignment, then opportunities

  // 1. Burnout Risk (fatigue > 70)
  if (fatigueScore > 70) {
    return {
      type: 'burnout_risk',
      recommendation: `Burnout Risk Detected — Employee overtime and workload intensity suggest critical fatigue risk (score: ${fatigueScore}/100). Immediate workload redistribution and wellness intervention recommended. Consider temporary task reassignment and mandatory recovery period.`,
      priority: 'critical',
    };
  }

  // 2. Overloaded (utilization > 95%)
  if (utilization > 95) {
    return {
      type: 'overloaded',
      recommendation: `Overload Risk — Employee utilization at ${utilization}% indicates excessive workload allocation. Redistribute tasks to prevent quality degradation and burnout. Review team capacity planning.`,
      priority: 'high',
    };
  }

  // 3. Role Misalignment (fitment < 50)
  if (fitmentScore < 50) {
    return {
      type: 'role_misalignment',
      recommendation: `Role Misalignment — Employee fitment score of ${fitmentScore}/100 indicates poor match between skills/experience and current role requirements. Consider role reassignment, targeted upskilling program, or internal mobility to a better-fit position.`,
      priority: 'high',
    };
  }

  // 4. Underutilized (utilization < 50%)
  if (utilization < 50) {
    return {
      type: 'underutilized',
      recommendation: `Underutilized Employee — Utilization at ${utilization}% is significantly below organizational benchmarks. Consider cross-training for additional process areas, assigning to project teams, or redistributing workload from overloaded peers.`,
      priority: 'medium',
    };
  }

  // 5. Promotion Candidate (fitment > 85)
  if (fitmentScore > 85) {
    return {
      type: 'promotion_candidate',
      recommendation: `Promotion Candidate — Employee demonstrates excellent role fitment (${fitmentScore}/100) with strong productivity and experience alignment. Ready for higher responsibility. Consider for team lead or next-band promotion in upcoming review cycle.`,
      priority: 'medium',
    };
  }

  // 6. High Performer (productivity > 90)
  if (productivity > 90) {
    return {
      type: 'high_performer',
      recommendation: `High Performer — Employee consistently exceeds productivity benchmarks at ${productivity}%. Ensure retention through recognition, growth opportunities, and competitive compensation review. Consider mentorship role assignment.`,
      priority: 'low',
    };
  }

  // 7. Stable / No Action
  return {
    type: 'stable',
    recommendation: `Stable Contributor — Employee performance metrics are within acceptable ranges (Productivity: ${productivity}%, Utilization: ${utilization}%, Fitment: ${fitmentScore}/100). Continue monitoring and provide regular development opportunities.`,
    priority: 'low',
  };
}

/**
 * Generate automation opportunity recommendation for a process
 * @param {Object} fteWorkload - FTEWorkload document
 * @returns { isCandidate: boolean, recommendation: string, estimatedSavings: number }
 */
export function generateAutomationRecommendation(fteWorkload) {
  const { process_name, sub_process, is_repetitive, is_rule_based, workload_volume, required_fte, estimated_cost_per_fte } = fteWorkload;

  const isCandidate = (is_repetitive && is_rule_based) || 
                       (is_repetitive && workload_volume > 500) ||
                       (is_rule_based && workload_volume > 1000);

  if (!isCandidate) {
    return {
      isCandidate: false,
      recommendation: `${sub_process} under ${process_name} — Current workload characteristics do not indicate strong automation potential. Continue manual processing with periodic review.`,
      estimatedSavings: 0,
    };
  }

  // Estimate savings: assume automation can replace 30-60% of FTE based on volume
  const automationEfficiency = is_repetitive && is_rule_based ? 0.6 : 0.3;
  const fteReduction = required_fte * automationEfficiency;
  const estimatedSavings = Math.round(fteReduction * (estimated_cost_per_fte || 500000)); // default ₹5L/FTE

  return {
    isCandidate: true,
    recommendation: `Automation Opportunity — ${sub_process} (${process_name}) shows ${is_repetitive ? 'repetitive' : ''} ${is_rule_based ? 'rule-based' : ''} workload patterns with volume of ${workload_volume} units. Estimated FTE reduction: ${fteReduction.toFixed(1)} FTEs. Potential annual savings: ₹${(estimatedSavings / 100000).toFixed(1)}L. Consider RPA/process automation implementation.`,
    estimatedSavings,
    fteReduction: parseFloat(fteReduction.toFixed(1)),
  };
}

/**
 * Calculates 6x6 Talent Matrix coordinates
 * @param {Object} scores - { productivity, quality_score, fitmentScore, experience_score, learning_score, leadership_score }
 * @returns { x: number, y: number, category: string }
 */
export function calculateMatrixCoordinates(scores) {
  const { 
    productivity = 0, 
    quality_score = 0, 
    fitmentScore = 0, 
    experience_score = 0, 
    learning_score = 50, // default
    leadership_score = 50 // default
  } = scores;

  // 1. Performance Calculation (Y-axis: 1-6)
  // Weighted: Productivity (50%), Quality (30%), Completion (20%)
  const perfScore = (productivity * 0.5) + (quality_score * 0.3) + (productivity * 0.2); // using productivity as proxy for completion here
  const y = Math.min(6, Math.max(1, Math.ceil(perfScore / (100 / 6))));

  // 2. Potential Calculation (X-axis: 1-6)
  // Weighted: Fitment (30%), Experience (30%), Learning (20%), Leadership (20%)
  const potScore = (fitmentScore * 0.3) + (experience_score * 0.3) + (learning_score * 0.2) + (leadership_score * 0.2);
  const x = Math.min(6, Math.max(1, Math.ceil(potScore / (100 / 6))));

  // 3. Category Mapping
  let category = 'Core Contributor';
  if (y >= 5 && x >= 5) category = 'Future Leader / Essential Talent';
  else if (y >= 5 && x >= 3) category = 'Key Specialist / High Performer';
  else if (y >= 4 && x >= 5) category = 'Growth Talent / High Potential';
  else if (y <= 2 && x >= 5) category = 'Trainable Employee';
  else if (y <= 2 && x <= 2) category = 'Performance Risk / Critical Action';
  else if (x >= 5) category = 'Untapped Potential';
  else if (y >= 5) category = 'Solid Performer';

  return { x, y, category };
}

// Deprecated in favor of calculateMatrixCoordinates
export function categorizeTalent(scores) {
  const { x, y, category } = calculateMatrixCoordinates(scores);
  let quadrant = 'medium';
  if (y >= 5 && x >= 5) quadrant = 'elite';
  else if (y >= 4 && x >= 4) quadrant = 'strong';
  else if (y <= 2 || x <= 2) quadrant = 'critical';
  
  return { category, quadrant };
}
