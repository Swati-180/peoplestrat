import User from '../models/User.js';
import Employee from '../models/Employee.js';
import bcrypt from 'bcryptjs';

export const updateProfile = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if new email already exists for another user
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser.id !== req.user.id) {
        return res.status(400).json({ success: false, message: 'Email is already in use' });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: req.body },
      { new: true }
    ).select('-password');

    res.json({ success: true, data: updatedUser, message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateNotifications = async (req, res) => {
  try {
    const prefs = req.body;
    
    let employee = await Employee.findOne({ email: req.user.email });
    if (!employee) {
      employee = new Employee({ email: req.user.email, name: req.user.username });
    }
    
    if (!employee.preferences) {
      employee.preferences = {};
    }

    employee.preferences = {
      ...employee.preferences,
      ...prefs
    };

    employee.markModified('preferences');
    await employee.save();

    res.json({ success: true, message: 'Notification preferences updated' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
