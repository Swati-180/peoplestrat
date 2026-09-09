import express from 'express';
import { protect } from '../middleware/auth.js';
import { startQuiz, webhook, getQuizSummary } from '../controllers/quizController.js';

// Ported from mayamaya_plan.md §6 (Eleviq `quiz.router.ts`).
// userId-only: no :orgId params, no org-membership middleware.
const router = express.Router();

// Public by webhook design — verified by HMAC inside the controller, no session.
router.post('/webhook', webhook);

// Authenticated employee routes.
router.post('/start-quiz', protect, startQuiz);
router.get('/summary', protect, getQuizSummary);

export default router;
