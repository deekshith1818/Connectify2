import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Configuration
const CONFIG = {
    primaryModel: "gemini-2.5-pro",
    fallbackModel: "gemini-1.5-flash",
    maxRetries: 3,
    baseDelay: 1000, // milliseconds
};

// Get model with fallback
const getModel = (useFallback = false) => {
    const modelName = useFallback ? CONFIG.fallbackModel : CONFIG.primaryModel;
    return genAI.getGenerativeModel({ model: modelName });
};

// Retry helper with exponential backoff
const retryWithBackoff = async (fn, maxRetries = CONFIG.maxRetries) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            const isLastAttempt = attempt === maxRetries - 1;
            const is503Error = error.status === 503;
            
            if (is503Error && !isLastAttempt) {
                const delay = CONFIG.baseDelay * Math.pow(2, attempt);
                console.log(`Attempt ${attempt + 1} failed (503). Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error;
            }
        }
    }
};

export const askAI = async (req, res) => {
    try {
        const { message, context = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                success: false,
                error: 'Message is required' 
            });
        }

        let useFallback = false;
        let text;

        // Try with primary model first, then fallback
        const executeChat = async () => {
            const model = getModel(useFallback);
            
            const chat = model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: "You are a helpful AI assistant for Connectify video meetings. Help users with their questions and meeting-related tasks." }],
                    },
                    {
                        role: "model",
                        parts: [{ text: "I'm here to help with your Connectify meeting. How can I assist you today?" }],
                    },
                    ...context.map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'model',
                        parts: [{ text: msg.text }],
                    })),
                ],
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();
        };

        try {
            // Try primary model with retries
            text = await retryWithBackoff(executeChat);
        } catch (error) {
            if (error.status === 503) {
                console.log('Primary model overloaded, switching to fallback model...');
                useFallback = true;
                
                try {
                    text = await retryWithBackoff(executeChat);
                } catch (fallbackError) {
                    console.error('Fallback model also failed:', fallbackError);
                    return res.status(503).json({
                        success: false,
                        error: 'AI service is currently experiencing high demand. Please try again in a moment.',
                        code: 'SERVICE_OVERLOADED',
                        retryAfter: 30
                    });
                }
            } else {
                throw error;
            }
        }

        res.json({ 
            success: true,
            response: text,
            model: useFallback ? CONFIG.fallbackModel : CONFIG.primaryModel
        });

    } catch (error) {
        console.error('Error in askAI:', error);
        
        // Handle specific error types
        if (error.status === 429) {
            return res.status(429).json({
                success: false,
                error: 'Rate limit exceeded. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: 60
            });
        }

        if (error.status === 400) {
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

        let useFallback = false;

        const generateSummary = async () => {
            const model = getModel(useFallback);
            
            const prompt = `Please provide a concise summary of the following meeting transcript. 
            Highlight key points, decisions made, and action items. Format the response in markdown with appropriate headings:
            
            ${transcript}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        };

        const generateActionItems = async (summaryText) => {
            const model = getModel(useFallback);
            
            const actionItemsPrompt = `Extract action items from the following meeting summary as a bulleted list. 
            Format each item with a clear owner and deadline if mentioned:
            
            ${summaryText}`;
            
            const actionItemsResult = await model.generateContent(actionItemsPrompt);
            const actionItemsResponse = await actionItemsResult.response;
            return actionItemsResponse.text();
        };

        let summary, actionItems;

        try {
            // Try primary model
            summary = await retryWithBackoff(generateSummary);
            actionItems = await retryWithBackoff(() => generateActionItems(summary));
        } catch (error) {
            if (error.status === 503) {
                console.log('Primary model overloaded, switching to fallback model...');
                useFallback = true;
                
                try {
                    summary = await retryWithBackoff(generateSummary);
                    actionItems = await retryWithBackoff(() => generateActionItems(summary));
                } catch (fallbackError) {
                    console.error('Fallback model also failed:', fallbackError);
                    return res.status(503).json({
                        success: false,
                        error: 'AI service is currently experiencing high demand. Please try again in a moment.',
                        code: 'SERVICE_OVERLOADED',
                        retryAfter: 30
                    });
                }
            } else {
                throw error;
            }
        }

        res.json({
            success: true,
            summary,
            actionItems,
            model: useFallback ? CONFIG.fallbackModel : CONFIG.primaryModel
        });

    } catch (error) {
        console.error('Error in summarizeMeeting:', error);
        
        if (error.status === 503) {
            return res.status(503).json({
                success: false,
                error: 'AI service temporarily unavailable. Please try again shortly.',
                code: 'SERVICE_OVERLOADED',
                retryAfter: 30
            });
        }

        if (error.status === 429) {
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