import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getWorkforceSummary, getSkillGaps } from '../controllers/analyticsController.js';

const router = express.Router();

// All analytics routes require authentication
router.use(protect);

// GET /api/analytics/workforce-summary
router.get('/workforce-summary', adminOnly, getWorkforceSummary);

// GET /api/analytics/skill-gaps
router.get('/skill-gaps', adminOnly, getSkillGaps);

export default router;
