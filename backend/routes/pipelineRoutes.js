import express from 'express';
import { getPipelineLeaders, predictPipelineStage, updatePipelineStage } from '../controllers/pipelineController.js';
import { protect, managerOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/leaders', managerOnly, getPipelineLeaders);
router.post('/:employeeId/predict', managerOnly, predictPipelineStage);
router.put('/:employeeId/stage', managerOnly, updatePipelineStage);

export default router;
