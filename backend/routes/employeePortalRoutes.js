import express from 'express';
import { protect, requireOrganization } from '../middleware/auth.js';
import {
  getMyProfile,
  updateMyProfile,
  getMyWorkMetrics,
  getMySkills,
  getMyFatigue,
  getMyCareer,
  getMyNotifications,
  submitPulseCheck,
  getMyResume,
  updateMyResume,
} from '../controllers/employeePortalController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);
router.use(requireOrganization);

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.get('/me/work-metrics', getMyWorkMetrics);
router.get('/me/skills', getMySkills);
router.get('/me/fatigue', getMyFatigue);
router.get('/me/career', getMyCareer);
router.get('/me/notifications', getMyNotifications);

// Resume endpoints (Phase 5A)
router.get('/me/resume', getMyResume);
router.put('/me/resume', updateMyResume);

// Phase 2 endpoints
router.post('/pulse-check', submitPulseCheck);

export default router;
