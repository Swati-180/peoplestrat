const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/role');
const employeeController = require('../controllers/employeeController');

const upload = multer({ storage: multer.memoryStorage() });

// @route   POST api/employees/upload-resume
// @access  Private
router.post('/upload-resume', [auth, upload.single('resume')], employeeController.uploadResume);

// @route   GET api/employees
// @access  Private
router.get('/', [auth, authorize('admin', 'manager', 'hr', 'employee')], employeeController.getEmployees);

// @route   POST api/employees/update-data
// @access  Private
router.post('/update-data', [auth, authorize('employee')], employeeController.updateEmployeeData);

module.exports = router;
