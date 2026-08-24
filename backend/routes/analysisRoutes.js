import express from 'express';
import { runAnalysis, getAnalysisResults, getEmployeeAnalysis, getAnalysisSummary, predictFlightRisk, getFlightRisk, getGapAnalysis, getGapInterventions } from '../controllers/analysisController.js';
import { chatAssistant } from '../controllers/aiController.js';
import { protect, managerOnly } from '../middleware/auth.js';

const router = express.Router();

// All analysis routes require authentication
router.use(protect);

// POST /api/analysis/run — Trigger analysis (manager only)
router.post('/run', managerOnly, runAnalysis);

// GET /api/analysis/results — Get analysis results with filters
router.get('/results', managerOnly, getAnalysisResults);

// GET /api/analysis/summary — Workforce summary KPIs
router.get('/summary', managerOnly, getAnalysisSummary);

// GET /api/analysis/employee/:id — Get specific employee analysis
router.get('/employee/:id', getEmployeeAnalysis);

// POST /api/analysis/predict-flight-risk/:employeeId
router.post('/predict-flight-risk/:employeeId', managerOnly, predictFlightRisk);

// GET /api/analysis/flight-risk/:employeeId
router.get('/flight-risk/:employeeId', managerOnly, getFlightRisk);

// GET /api/analysis/gaps — Deterministic gaps summary
router.get('/gaps', managerOnly, getGapAnalysis);

// POST /api/analysis/gaps/:employeeId/interventions — On-demand AI recommendations
router.post('/gaps/:employeeId/interventions', managerOnly, getGapInterventions);

// POST /api/analysis/chat — AI workforce assistant
router.post('/chat', chatAssistant);

export default router;
