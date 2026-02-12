/**
 * AI Service Factory for Connectify
 * Supports both OpenAI and Google Gemini providers
 * 
 * Environment Variables:
 * - AI_PROVIDER: 'openai' or 'gemini' (default: 'gemini')
 * - OPENAI_API_KEY: OpenAI API key (required if using OpenAI)
 * - GEMINI_API_KEY: Google Gemini API key (required if using Gemini)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Configuration
const CONFIG = {
    provider: process.env.AI_PROVIDER || 'gemini',
    openai: {
        model: 'gpt-3.5-turbo',
        fallbackModel: 'gpt-3.5-turbo',
    },
    gemini: {
        model: 'gemini-2.5-flash',
        fallbackModel: 'gemini-2.5-flash',
    },
    maxRetries: 3,
    baseDelay: 1000, // milliseconds
};

// Initialize providers lazily
let openaiClient = null;
let geminiClient = null;

/**
 * Get the OpenAI client (lazy initialization)
 */
const getOpenAIClient = () => {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    return openaiClient;
};

/**
 * Get the Gemini client (lazy initialization)
 */
const getGeminiClient = () => {
    if (!geminiClient) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return geminiClient;
};

/**
 * Sleep helper for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Check if an error is retryable (rate limit or server overload)
 */
const isRetryableError = (error) => {
    const status = error.status || error.statusCode || error.response?.status;
    return status === 429 || status === 503 || status === 500;
};

/**
 * Generate text using OpenAI
 */
const generateWithOpenAI = async (prompt, useFallback = false) => {
    const client = getOpenAIClient();
    const model = useFallback ? CONFIG.openai.fallbackModel : CONFIG.openai.model;

    const response = await client.chat.completions.create({
        model: model,
        messages: [
            { role: 'user', content: prompt }
        ],
        max_tokens: 2048,
        temperature: 0.7,
    });

    return response.choices[0].message.content;
};

/**
 * Generate chat response using OpenAI
 */
const generateChatWithOpenAI = async (messages, systemPrompt, useFallback = false) => {
    const client = getOpenAIClient();
    const model = useFallback ? CONFIG.openai.fallbackModel : CONFIG.openai.model;

    const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
        }))
    ];

    const response = await client.chat.completions.create({
        model: model,
        messages: formattedMessages,
        max_tokens: 2048,
        temperature: 0.7,
    });

    return response.choices[0].message.content;
};

/**
 * Generate text using Gemini
 */
const generateWithGemini = async (prompt, useFallback = false) => {
    const client = getGeminiClient();
    const modelName = useFallback ? CONFIG.gemini.fallbackModel : CONFIG.gemini.model;
    const model = client.getGenerativeModel({ model: modelName });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

/**
 * Generate chat response using Gemini
 */
const generateChatWithGemini = async (messages, systemPrompt, useFallback = false) => {
    const client = getGeminiClient();
    const modelName = useFallback ? CONFIG.gemini.fallbackModel : CONFIG.gemini.model;
    const model = client.getGenerativeModel({ model: modelName });

    const chat = model.startChat({
        history: [
            {
                role: "user",
                parts: [{ text: systemPrompt }],
            },
            {
                role: "model",
                parts: [{ text: "I understand. I'm ready to help." }],
            },
            ...messages.slice(0, -1).map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            })),
        ],
    });

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage?.text || '');
    const response = await result.response;
    return response.text();
};

/**
 * Retry wrapper with exponential backoff
 */
const retryWithBackoff = async (fn, maxRetries = CONFIG.maxRetries) => {
    let lastError = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isLast = attempt === maxRetries - 1;

            if (isRetryableError(error) && !isLast) {
                const delay = CONFIG.baseDelay * Math.pow(2, attempt);
                console.log(`⚠️ Attempt ${attempt + 1} failed (${error.status || 'unknown'}). Retrying in ${delay}ms...`);
                await sleep(delay);
            } else if (!isRetryableError(error)) {
                throw error; // Don't retry non-transient errors
            }
        }
    }

    throw lastError;
};

/**
 * AI Service - Main interface
 */
const AIService = {
    /**
     * Get the current provider name
     */
    getProvider: () => CONFIG.provider,

    /**
     * Check if the AI service is configured
     */
    isConfigured: () => {
        if (CONFIG.provider === 'openai') {
            return !!process.env.OPENAI_API_KEY;
        }
        return !!process.env.GEMINI_API_KEY;
    },

    /**
     * Get the API key environment variable name for the current provider
     */
    getApiKeyEnvVar: () => {
        return CONFIG.provider === 'openai' ? 'OPENAI_API_KEY' : 'GEMINI_API_KEY';
    },

    /**
     * Generate text from a prompt
     * @param {string} prompt - The text prompt
     * @returns {Promise<string>} - The generated text
     */
    generateText: async (prompt) => {
        let useFallback = false;

        const execute = async () => {
            if (CONFIG.provider === 'openai') {
                return await generateWithOpenAI(prompt, useFallback);
            }
            return await generateWithGemini(prompt, useFallback);
        };

        try {
            return await retryWithBackoff(execute);
        } catch (error) {
            // Try with fallback model
            if (isRetryableError(error)) {
                console.log(`🔄 Primary model overloaded, trying fallback...`);
                useFallback = true;
                return await retryWithBackoff(execute);
            }
            throw error;
        }
    },

    /**
     * Generate chat response with context
     * @param {Array} messages - Array of {sender: 'user'|'assistant', text: string}
     * @param {string} systemPrompt - System prompt for context
     * @returns {Promise<string>} - The generated response
     */
    generateChat: async (messages, systemPrompt) => {
        let useFallback = false;

        const execute = async () => {
            if (CONFIG.provider === 'openai') {
                return await generateChatWithOpenAI(messages, systemPrompt, useFallback);
            }
            return await generateChatWithGemini(messages, systemPrompt, useFallback);
        };

        try {
            return await retryWithBackoff(execute);
        } catch (error) {
            // Try with fallback model
            if (isRetryableError(error)) {
                console.log(`🔄 Primary model overloaded, trying fallback...`);
                useFallback = true;
                return await retryWithBackoff(execute);
            }
            throw error;
        }
    },

    /**
     * Get current model information
     */
    getModelInfo: () => {
        if (CONFIG.provider === 'openai') {
            return {
                provider: 'openai',
                primaryModel: CONFIG.openai.model,
                fallbackModel: CONFIG.openai.fallbackModel,
            };
        }
        return {
            provider: 'gemini',
            primaryModel: CONFIG.gemini.model,
            fallbackModel: CONFIG.gemini.fallbackModel,
        };
    },
};

// Log which provider is configured on module load
console.log(`🤖 AI Service initialized with provider: ${CONFIG.provider.toUpperCase()}`);
if (AIService.isConfigured()) {
    const info = AIService.getModelInfo();
    console.log(`   Primary model: ${info.primaryModel}`);
    console.log(`   Fallback model: ${info.fallbackModel}`);
} else {
    console.warn(`⚠️ Warning: ${AIService.getApiKeyEnvVar()} is not set!`);
}

export default AIService;
export { AIService };
