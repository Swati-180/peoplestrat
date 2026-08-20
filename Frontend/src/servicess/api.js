// Re-export from the canonical services/api.js to maintain backward compatibility
// (Some components import from @/servicess/api due to the typo in directory name)
export { api, fetchEmployees, fetchEmployeeStats, fetchUploads, fetchAnalysisSummary, fetchEmployeeAnalysis, runAnalysis } from '../services/api.js';
