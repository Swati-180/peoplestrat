import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import Invitation from '../models/Invitation.js';

// =====================
// REGISTER
// =====================
export const register = async (req, res) => {
  try {
    const { name, username, password, inviteToken } = req.body;

    if (!username || !password || !inviteToken) {
      return res.status(400).json({ message: 'Missing fields. Registration requires an invitation token.' });
    }

    // Validate the token format
    if (!inviteToken.includes('.')) {
      return res.status(400).json({ message: 'Invalid invitation token format.' });
    }
    const [inviteId, rawToken] = inviteToken.split('.');

    const invitation = await Invitation.findById(inviteId);
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }

    if (invitation.status !== 'pending') {
      return res.status(400).json({ message: `Invitation is already ${invitation.status}.` });
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await invitation.save();
      return res.status(400).json({ message: 'Invitation has expired.' });
    }

    const isMatch = await invitation.matchToken(rawToken);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid token.' });
    }

    // Use email and role from the invitation (ignoring any user-provided values)
    const email = invitation.email;
    const role = invitation.role;

    // Double check user doesn't exist
    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: 'Email or username already in use' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username,
      email: email.toLowerCase(),
      password: hashed,
      role
    });

    await user.save();

    // Mark invitation as accepted
    invitation.status = 'accepted';
    await invitation.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// =====================
// LOGIN
// =====================
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: 'Please provide identifier and password' });
    }

    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { username: identifier };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


// =====================
// GET LOGGED USER
// =====================
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
