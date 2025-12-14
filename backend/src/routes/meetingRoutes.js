import { Router } from 'express';
import { startMeeting, validateMeeting } from '../controllers/meeting.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Start a new meeting - Protected route (requires authentication)
router.route('/start').post(authMiddleware, startMeeting);

// Validate meeting code - Public route (no auth needed)
router.route('/validate/:meetingCode').get(validateMeeting);

export default router;
