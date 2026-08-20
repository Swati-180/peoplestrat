const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const assessmentController = require('../controllers/assessmentController');

// @route   POST api/assessments
// @access  Private
router.post('/', [auth, authorize('admin', 'manager', 'hr')], assessmentController.createAssessment);

// @route   POST api/assessments/:id/questions
// @access  Private
router.post('/:id/questions', [auth, authorize('admin', 'manager', 'hr')], assessmentController.addQuestion);

// @route   GET api/assessments/:id/start
// @access  Private
router.get('/:id/start', auth, assessmentController.getAssessmentForStart);

// @route   POST api/assessments/:id/submit
// @access  Private
router.post('/:id/submit', auth, assessmentController.submitAssessmentAndGrade);

module.exports = router;
