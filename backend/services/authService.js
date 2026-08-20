const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');

class AuthService {
  async registerUser(userData) {
    const { username, email, password, department, role } = userData;
    
    let user = await User.findOne({ email });
    if (user) throw new Error('User already exists');

    user = new User({
      username,
      email,
      password,
      role: role || 'employee'
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Create linked Employee Profile
    const employee = new Employee({
      userId: user._id,
      department
    });
    await employee.save();

    return this.generateToken(user);
  }

  async loginUser(usernameOrEmail, password) {
    console.log('[authService] login attempt for', usernameOrEmail);
    let user = await User.findOne({ $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }] });
    if (!user) {
      console.log('[authService] user not found');
      throw new Error('Invalid Credentials');
    }
    console.log('[authService] found user', user.username, 'hashedPassword:', user.password);

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('[authService] password match:', isMatch);
    if (!isMatch) throw new Error('Invalid Credentials');

    return this.generateToken(user);
  }

  async getUserById(userId) {
    return await User.findById(userId).select('-password');
  }

  generateToken(user) {
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secretToken123', { expiresIn: 360000 });
    return { token, user: { id: user.id, username: user.username, email: user.email, role: user.role } };
  }
}

module.exports = new AuthService();
