import express from 'express';
import { askAI, summarizeMeeting } from '../controllers/aiController.js';
import { rateLimit } from 'express-rate-limit';

const router = express.Router();

// Rate limiting for AI endpoints
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 15, // Limit each IP to 15 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after a minute'
});

// AI Chat Endpoint
router.post('/chat', aiLimiter, askAI);

// Meeting Summary Endpoint
router.post('/summarize', aiLimiter, summarizeMeeting);

export default router;
