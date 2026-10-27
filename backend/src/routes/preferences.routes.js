import { Router } from 'express';
import { getPreferences, updatePreferences } from '../controllers/preferences.controller.js';
import { validateUserId, validatePreferences } from '../middleware/validateRequest.js';

const router = Router();

router.get('/preferences/:userId', validateUserId, getPreferences);
router.put('/preferences/:userId', validateUserId, validatePreferences, updatePreferences);

export default router;
