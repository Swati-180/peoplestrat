import express from 'express';
import { getPipelineLeaders, predictPipelineStage, updatePipelineStage } from '../controllers/pipelineController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/leaders', adminOnly, getPipelineLeaders);
router.post('/:employeeId/predict', adminOnly, predictPipelineStage);
router.put('/:employeeId/stage', adminOnly, updatePipelineStage);

export default router;
