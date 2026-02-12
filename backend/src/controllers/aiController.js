import AIService from '../services/aiService.js';
import dotenv from 'dotenv';

dotenv.config();

export const askAI = async (req, res) => {
    try {
        const { message, context = [] } = req.body;

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Check if AI service is configured
        if (!AIService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: `AI service not configured. Please set ${AIService.getApiKeyEnvVar()} in your environment.`,
                code: 'SERVICE_NOT_CONFIGURED'
            });
        }

        const systemPrompt = "You are a helpful AI assistant for Connectify video meetings. Help users with their questions and meeting-related tasks.";

        // Build messages array with context
        const messages = [
            ...context.map(msg => ({
                sender: msg.sender === 'user' ? 'user' : 'assistant',
                text: msg.text
            })),
            { sender: 'user', text: message }
        ];

        const text = await AIService.generateChat(messages, systemPrompt);
        const modelInfo = AIService.getModelInfo();

        res.json({
            success: true,
            response: text,
            provider: modelInfo.provider,
            model: modelInfo.primaryModel
        });

    } catch (error) {
        console.error('Error in askAI:', error);

        // Handle specific error types
        const status = error.status || error.statusCode || error.response?.status;

        if (status === 429) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: 60
            });
        }

        if (status === 503) {
            return res.status(503).json({
                success: false,
                error: 'AI service is currently experiencing high demand. Please try again in a moment.',
                code: 'SERVICE_OVERLOADED',
                retryAfter: 30
            });
        }

        if (status === 400) {
            return res.status(400).json({
                success: false,
                error: 'Invalid request. Please check your input.',
                code: 'INVALID_REQUEST'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error processing your request. Please try again.',
            code: 'INTERNAL_ERROR'
        });
    }
};

export const summarizeMeeting = async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({
                success: false,
                error: 'Transcript is required'
            });
        }

        // Check if AI service is configured
        if (!AIService.isConfigured()) {
            return res.status(503).json({
                success: false,
                error: `AI service not configured. Please set ${AIService.getApiKeyEnvVar()} in your environment.`,
                code: 'SERVICE_NOT_CONFIGURED'
            });
        }

        // Generate summary
        const summaryPrompt = `Please provide a concise summary of the following meeting transcript. 
Highlight key points, decisions made, and action items. Format the response in markdown with appropriate headings:

${transcript}`;

        const summary = await AIService.generateText(summaryPrompt);

        // Generate action items
        const actionItemsPrompt = `Extract action items from the following meeting summary as a bulleted list. 
Format each item with a clear owner and deadline if mentioned:

${summary}`;

        const actionItems = await AIService.generateText(actionItemsPrompt);
        const modelInfo = AIService.getModelInfo();

        res.json({
            success: true,
            summary,
            actionItems,
            provider: modelInfo.provider,
            model: modelInfo.primaryModel
        });

    } catch (error) {
        console.error('Error in summarizeMeeting:', error);

        const status = error.status || error.statusCode || error.response?.status;

        if (status === 503) {
            return res.status(503).json({
                success: false,
                error: 'AI service temporarily unavailable. Please try again shortly.',
                code: 'SERVICE_OVERLOADED',
                retryAfter: 30
            });
        }

        if (status === 429) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: 60
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error generating meeting summary. Please try again.',
            code: 'INTERNAL_ERROR'
        });
    }
};