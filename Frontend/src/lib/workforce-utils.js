/**
 * Workforce utility functions — works with both mock data and live API data
 */

/**
 * Aggregates workforce-wide KPIs from employee data.
 */
export function getWorkforceKPIs(liveEmployees) {
    const data = liveEmployees || [];
    const count = data.length;
    if (count === 0) return {
        totalEmployees: 0,
        avgFitment: 0,
        avgProductivity: 0,
        avgUtilization: 0,
        burnoutRisk: 0,
        automationSavings: "$0L",
        rawAutomationSavings: 0
    };

    const avgFitment = Math.round(
        data.reduce((sum, e) => sum + (e.fitmentScore || e.scores?.fitment || 0), 0) / count
    );
    const avgProductivity = Math.round(
        data.reduce((sum, e) => sum + (e.productivity || e.scores?.productivity || 0), 0) / count
    );
    const avgUtilization = Math.round(
        data.reduce((sum, e) => sum + (e.utilization || e.scores?.utilization || 0), 0) / count
    );

    const highFatigue = data.filter(e => (e.fatigueScore || e.scores?.fatigue || 0) >= 70).length;
    const highFatiguePct = Math.round((highFatigue / count) * 100);

    const totalAutomationSavings = data.reduce((sum, e) => {
        const potential = e.automationPotential || e.scores?.automationPotential || 0;
        return sum + (potential * (e.salary || 500000) / 100);
    }, 0);

    return {
        totalEmployees: count,
        avgFitment,
        avgProductivity,
        avgUtilization,
        burnoutRisk: highFatiguePct,
        automationSavings: totalAutomationSavings >= 100000
            ? `$${(totalAutomationSavings / 100000).toFixed(1)}L`
            : `$${Math.round(totalAutomationSavings).toLocaleString()}`,
        rawAutomationSavings: totalAutomationSavings
    };
}

/**
 * Gets department/process-level distributions for charts.
 */
export function getDepartmentDistributions(liveEmployees) {
    const data = liveEmployees || [];
    // Group by process_area (F&A, PSS, SAP) or department
    const groupKey = data.some(e => e.process_area) ? 'process_area' : 'department';
    const groups = [...new Set(data.map(e => e[groupKey]).filter(Boolean))];

    return groups.map(group => {
        const groupEmps = data.filter(e => e[groupKey] === group);
        if (groupEmps.length === 0) return { name: group, fitment: 0, count: 0, utilization: 0, productivity: 0 };
        
        return {
            name: group,
            fitment: Math.round(groupEmps.reduce((sum, e) => sum + (e.fitmentScore || e.scores?.fitment || 0), 0) / groupEmps.length),
            count: groupEmps.length,
            utilization: Math.round(groupEmps.reduce((sum, e) => sum + (e.utilization || e.scores?.utilization || 0), 0) / groupEmps.length),
            productivity: Math.round(groupEmps.reduce((sum, e) => sum + (e.productivity || e.scores?.productivity || 0), 0) / groupEmps.length),
        };
    });
}

/**
 * Gets band distribution for charts.
 */
export function getBandDistribution(liveEmployees) {
    const data = liveEmployees || [];
    const bandOrder = ['OR', 'D3', 'D2', 'D1', 'M4', 'M3', 'M2', 'M1', 'L3', 'L2', 'L1'];
    const bands = {};
    data.forEach(e => {
        const band = e.band || 'Unknown';
        bands[band] = (bands[band] || 0) + 1;
    });

    return bandOrder
        .filter(b => bands[b])
        .map(b => ({ name: b, count: bands[b] || 0 }));
}

/**
 * Generates AI workforce signals based on real data.
 */
export function getAISignals(liveEmployees) {
    const data = liveEmployees || [];
    const signals = [];

    const highFatigue = data.filter(e => (e.fatigueScore || e.scores?.fatigue || 0) >= 70);
    if (highFatigue.length > 0) {
        signals.push({
            type: "fatigue",
            message: `${highFatigue.length} employees in burnout risk zone — immediate attention required`,
            impacted: highFatigue.map(e => e.name),
            path: "/fatigue"
        });
    }

    const lowFitment = data.filter(e => (e.fitmentScore || e.scores?.fitment || 0) < 50);
    if (lowFitment.length > 0) {
        signals.push({
            type: "fitment",
            message: `${lowFitment.length} role misalignment(s) detected — reskilling recommended`,
            impacted: lowFitment.map(e => e.name),
            path: "/fitment"
        });
    }

    const underutilized = data.filter(e => (e.utilization || e.scores?.utilization || 0) < 50);
    if (underutilized.length > 0) {
        signals.push({
            type: "utilization",
            message: `${underutilized.length} underutilized employee(s) — cross-training opportunity`,
            impacted: underutilized.map(e => e.name),
            path: "/employees"
        });
    }

    const overloaded = data.filter(e => (e.utilization || e.scores?.utilization || 0) > 95);
    if (overloaded.length > 0) {
        signals.push({
            type: "overload",
            message: `${overloaded.length} employee(s) at capacity risk — workload rebalancing needed`,
            impacted: overloaded.map(e => e.name),
            path: "/optimization"
        });
    }

    const promotionReady = data.filter(e => (e.fitmentScore || e.scores?.fitment || 0) > 85);
    if (promotionReady.length > 0) {
        signals.push({
            type: "promotion",
            message: `${promotionReady.length} promotion candidate(s) identified by fitment analysis`,
            impacted: promotionReady.map(e => e.name),
            path: "/six-by-six"
        });
    }

    return signals;
}
