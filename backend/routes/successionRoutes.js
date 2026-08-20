import express from 'express';
import { getCriticalRoles, getSuccessionPlan, predictSuccessors, updateCandidate } from '../controllers/successionController.js';
import { protect, managerOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require auth

router.get('/roles', managerOnly, getCriticalRoles);
router.get('/plan/:targetRoleId', managerOnly, getSuccessionPlan);
router.post('/plan/:targetRoleId/predict', managerOnly, predictSuccessors);
router.put('/plan/:targetRoleId/candidate', managerOnly, updateCandidate);

export default router;
