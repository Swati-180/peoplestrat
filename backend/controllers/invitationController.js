import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Invitation from '../models/Invitation.js';
import User from '../models/User.js';
import { sendInvitationEmail } from '../services/emailService.js';

export const inviteUser = async (req, res) => {
  try {
    const { email, role } = req.body;
    const inviterRole = req.user.role.toLowerCase();

    // Permissions check
    if (inviterRole === 'manager' && role !== 'employee') {
      return res.status(403).json({ message: 'Managers can only invite employees.' });
    }
    if (inviterRole !== 'admin' && inviterRole !== 'manager') {
      return res.status(403).json({ message: 'Unauthorized to send invitations.' });
    }
    if (role === 'admin') {
      return res.status(403).json({ message: 'Admins cannot be invited via this flow.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // Invalidate existing pending invitations for this email
    await Invitation.updateMany(
      { email: email.toLowerCase(), status: 'pending' },
      { status: 'expired' }
    );

    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    
    // Create invitation (hash will be generated inside controller since we use bcrypt)
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const invitation = await Invitation.create({
      email: email.toLowerCase(),
      role,
      tokenHash,
      invitedBy: req.user._id,
      expiresAt
    });

    // The user will receive: invitationId + rawToken
    const inviteLinkToken = `${invitation._id}.${rawToken}`;
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${inviteLinkToken}`;

    // Send real email (or Ethereal mock)
    await sendInvitationEmail(email.toLowerCase(), role, inviteUrl);

    res.status(201).json({ message: 'Invitation sent successfully.' });
  } catch (err) {
    console.error('Invite error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const validateToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || !token.includes('.')) {
      return res.status(400).json({ message: 'Invalid token format.' });
    }

    const [inviteId, rawToken] = token.split('.');

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

    res.status(200).json({ 
      message: 'Token is valid.', 
      email: invitation.email,
      role: invitation.role 
    });
  } catch (err) {
    console.error('Validate token error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --- NEW APIS for User Management ---

export const getInvitations = async (req, res) => {
  try {
    const userRole = req.user.role.toLowerCase();
    let query = {};
    
    // Managers can only see invitations they sent
    if (userRole === 'manager') {
      query.invitedBy = req.user._id;
    } else if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized to view invitations.' });
    }

    const invitations = await Invitation.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, invitations });
  } catch (err) {
    console.error('Get invitations error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const cancelInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findById(id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }
    
    // Check permissions
    if (req.user.role.toLowerCase() === 'manager' && invitation.invitedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only cancel invitations you sent.' });
    }
    
    invitation.status = 'expired'; // Using expired to invalidate it
    await invitation.save();
    
    res.status(200).json({ success: true, message: 'Invitation cancelled successfully.' });
  } catch (err) {
    console.error('Cancel invitation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    const oldInvitation = await Invitation.findById(id);
    
    if (!oldInvitation) {
      return res.status(404).json({ message: 'Invitation not found.' });
    }
    
    // Check permissions
    if (req.user.role.toLowerCase() === 'manager' && oldInvitation.invitedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only resend invitations you sent.' });
    }

    if (oldInvitation.status === 'accepted') {
      return res.status(400).json({ message: 'Cannot resend. User has already accepted and registered.' });
    }

    // Invalidate old invitation
    oldInvitation.status = 'expired';
    await oldInvitation.save();

    // Create a new token & invitation
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newInvitation = await Invitation.create({
      email: oldInvitation.email,
      role: oldInvitation.role,
      tokenHash,
      invitedBy: req.user._id,
      expiresAt
    });

    const inviteLinkToken = `${newInvitation._id}.${rawToken}`;
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/register?token=${inviteLinkToken}`;

    await sendInvitationEmail(newInvitation.email, newInvitation.role, inviteUrl);

    res.status(200).json({ success: true, message: 'Invitation resent successfully.', newInvitation });
  } catch (err) {
    console.error('Resend invitation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

