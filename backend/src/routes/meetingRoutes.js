import { Router } from 'express';
import {
    startMeeting,
    validateMeeting,
    getMeetingStats,
    scheduleMeeting,
    getRecentMeetings
} from '../controllers/meeting.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Start a new meeting - Protected route (requires authentication)
router.route('/start').post(authMiddleware, startMeeting);

// Validate meeting code - Public route (no auth needed)
router.route('/validate/:meetingCode').get(validateMeeting);

// Get meeting statistics - Protected route
router.route('/stats').get(authMiddleware, getMeetingStats);

// Schedule a future meeting - Protected route
router.route('/schedule').post(authMiddleware, scheduleMeeting);

// Get recent meetings - Protected route
router.route('/recent').get(authMiddleware, getRecentMeetings);

export default router;
