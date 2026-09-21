import express from 'express';
import { getDraft, upsertDraft, deleteDraft } from '../controllers/draftController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use((req, res, next) => {
  if (!req.organizationId) {
    return res.status(400).json({ success: false, error: 'Organization context is required' });
  }
  next();
});

router.get('/', getDraft);
router.put('/', upsertDraft);
router.delete('/', deleteDraft);

export default router;
