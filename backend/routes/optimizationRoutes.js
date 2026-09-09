import express from 'express';
import { getRecommendations } from '../controllers/optimizationController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// GET /api/optimization/recommendations
router.get('/recommendations', adminOnly, getRecommendations);

export default router;
