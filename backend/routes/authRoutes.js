import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect, authorize, managerOnly, adminOnly } from '../middleware/auth.js';
import { inviteUser, validateToken, getInvitations, cancelInvitation, resendInvitation } from '../controllers/invitationController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Invitation Routes
router.post('/invite', protect, authorize('manager', 'admin'), inviteUser);
router.get('/invite', protect, authorize('manager', 'admin'), getInvitations);
router.post('/invite/:id/cancel', protect, authorize('manager', 'admin'), cancelInvitation);
router.post('/invite/:id/resend', protect, authorize('manager', 'admin'), resendInvitation);
router.get('/invite/:token/validate', validateToken);

export default router;
