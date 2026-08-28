import express from 'express';
import { protect } from '../middleware/auth.js';
import { getWorkforceSummary, getSkillGaps } from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// GET /api/analytics/workforce-summary
router.get('/workforce-summary', getWorkforceSummary);

// GET /api/analytics/skill-gaps
router.get('/skill-gaps', getSkillGaps);

export default router;
