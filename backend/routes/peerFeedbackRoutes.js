import express from 'express';
import { submitFeedback, getAggregatedFeedback, getColleagues } from '../controllers/peerFeedbackController.js';
import { protect, managerOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/colleagues', protect, getColleagues);
router.post('/submit', protect, submitFeedback);
router.get('/target/:employeeId', protect, managerOnly, getAggregatedFeedback);

export default router;
