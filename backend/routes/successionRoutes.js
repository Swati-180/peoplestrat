import express from 'express';
import { getCriticalRoles, getSuccessionPlan, predictSuccessors, updateCandidate } from '../controllers/successionController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All routes require auth

router.get('/roles', adminOnly, getCriticalRoles);
router.get('/plan/:targetRoleId', adminOnly, getSuccessionPlan);
router.post('/plan/:targetRoleId/predict', adminOnly, predictSuccessors);
router.put('/plan/:targetRoleId/candidate', adminOnly, updateCandidate);

export default router;
