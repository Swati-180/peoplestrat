import express from 'express';
import { getRecommendations } from '../controllers/optimizationController.js';

const router = express.Router();

// GET /api/optimization/recommendations
router.get('/recommendations', getRecommendations);

export default router;
