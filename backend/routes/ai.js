const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const aiController = require('../controllers/aiController');

// @route   GET api/ai/run-fitment/:employeeId
// @access  Private
router.get('/run-fitment/:employeeId', [auth, authorize('admin', 'manager', 'hr')], aiController.runFitment);

// @route   POST api/ai/chat
// @access  Private
router.post('/chat', [auth, authorize('admin', 'manager', 'hr', 'employee')], aiController.chatAssistant);

module.exports = router;
