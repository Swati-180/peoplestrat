import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getMyProfile,
  updateMyProfile,
  getMyWorkMetrics,
  getMySkills,
  getMyFatigue,
  getMyCareer,
  getMyNotifications,
  submitBehaviorAssessment,
  submitPulseCheck,
} from '../controllers/employeePortalController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.get('/me/work-metrics', getMyWorkMetrics);
router.get('/me/skills', getMySkills);
router.get('/me/fatigue', getMyFatigue);
router.get('/me/career', getMyCareer);
router.get('/me/notifications', getMyNotifications);

// Phase 2 endpoints
router.post('/pulse-check', submitPulseCheck);
router.post('/assessments/behavior', submitBehaviorAssessment);

export default router;
