const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Debug endpoint to list all users
router.get('/debug/users', async (req, res) => {
  try {
    const users = await User.find().select('username email role _id');
    res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({ id: u._id, username: u.username, email: u.email, role: u.role }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test password verification
router.post('/debug/verify-user', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.json({ found: false, username, message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(password, user.password);
    
    res.json({ 
      found: true, 
      username, 
      email: user.email,
      passwordMatches: isMatch,
      storedPassword: user.password.substring(0, 20) + '...',
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
