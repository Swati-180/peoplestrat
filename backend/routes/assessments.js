import express from 'express';
import { protect, managerOnly } from '../middleware/auth.js';
import { createAssessment, addQuestion, getAssessmentForStart, submitAssessmentAndGrade } from '../controllers/assessmentController.js';

const router = express.Router();

// @route   POST api/assessments
// @access  Private (Manager/Admin/HR)
router.post('/', protect, managerOnly, createAssessment);

// @route   POST api/assessments/:id/questions
// @access  Private (Manager/Admin/HR)
router.post('/:id/questions', protect, managerOnly, addQuestion);

// @route   GET api/assessments/:id/start
// @access  Private
router.get('/:id/start', protect, getAssessmentForStart);

// @route   POST api/assessments/:id/submit
// @access  Private
router.post('/:id/submit', protect, submitAssessmentAndGrade);

export default router;
