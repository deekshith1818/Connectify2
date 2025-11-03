import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the model
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

export const askAI = async (req, res) => {
    try {
        const { message, context = [] } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Format the conversation history
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
        const text = response.text();

        res.json({ response: text });
    } catch (error) {
        console.error('Error in askAI:', error);
        res.status(500).json({ error: 'Error processing your request' });
    }
};

export const summarizeMeeting = async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        const prompt = `Please provide a concise summary of the following meeting transcript. 
        Highlight key points, decisions made, and action items. Format the response in markdown with appropriate headings:
        
        ${transcript}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract action items if needed
        const actionItemsPrompt = `Extract action items from the following meeting summary as a bulleted list. 
        Format each item with a clear owner and deadline if mentioned:
        
        ${text}`;
        
        const actionItemsResult = await model.generateContent(actionItemsPrompt);
        const actionItemsResponse = await actionItemsResult.response;
        const actionItems = actionItemsResponse.text();

        res.json({
            summary: text,
            actionItems: actionItems
        });
    } catch (error) {
        console.error('Error in summarizeMeeting:', error);
        res.status(500).json({ error: 'Error generating meeting summary' });
    }
};
