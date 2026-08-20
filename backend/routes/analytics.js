const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const analyticsController = require('../controllers/analyticsController');

// @route   GET api/analytics/workforce-summary
// @access  Private
router.get('/workforce-summary', [auth, authorize('admin', 'manager', 'hr', 'employee')], analyticsController.getWorkforceSummary);

// @route   GET api/analytics/skill-gaps
// @access  Private
router.get('/skill-gaps', [auth, authorize('admin', 'manager', 'hr', 'employee')], analyticsController.getSkillGaps);

module.exports = router;
