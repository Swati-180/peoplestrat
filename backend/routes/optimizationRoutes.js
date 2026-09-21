import express from 'express';
import { getRecommendations } from '../controllers/optimizationController.js';
import { protect, adminOnly, requireOrganization } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);

// GET /api/optimization/recommendations
router.get('/recommendations', adminOnly, getRecommendations);

export default router;
