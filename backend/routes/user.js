import express from 'express';
import { protect } from '../middleware/auth.js';
import { 
  updateProfile, 
  changePassword, 
  updateNotifications 
} from '../controllers/userController.js';

const router = express.Router();

// All routes are private
router.use(protect);

router.post('/update-profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/update-notifications', updateNotifications);

export default router;
