import { Server } from 'socket.io';
import { deactivateMeeting } from './meeting.controller.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Generative AI with gemini-2.5-flash
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const primaryModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Helper function to generate content with retry and fallback
async function generateWithRetry(prompt, maxRetries = 2) {
    let lastError = null;

    // Try primary model first
    for (let i = 0; i < maxRetries; i++) {
        try {
            console.log(`🔄 Attempt ${i + 1} with gemini-2.5-flash...`);
            const result = await primaryModel.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            lastError = error;
            console.log(`⚠️ Primary model failed: ${error.message}`);
            if (error.status !== 503 && error.status !== 429) {
                throw error; // Don't retry non-transient errors
            }
            // Wait before retry (exponential backoff)
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
        }
    }

    // Try fallback model
    try {
        console.log(`🔄 Trying fallback (retry) with gemini-2.5-flash...`);
        const result = await fallbackModel.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.log(`⚠️ Fallback model also failed: ${error.message}`);
        throw lastError || error;
    }
}

// In-memory storage for meeting transcripts
const roomTranscripts = {};

let messages = {};
let connections = {};
let timeOnline = {};

const connectToSocket = (server) => {
    // CORS configuration
    const allowedOrigins = [
        "https://connectify2-nj9q.onrender.com",
        "https://connectify3.onrender.com",
        "https://connectify2-jhtb.onrender.com",
        "https://connectify2-cyxk.onrender.com",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000"
    ];

    // Create Socket.IO server - IMPORTANT: pass server object properly
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        },
        transports: ["websocket", "polling"]
    });

    io.on("connection", (socket) => {
        console.log("✅ New client connected:", socket.id);

        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = Date.now();

            // Join socket.io room for whiteboard functionality
            socket.join(path);

            // Initialize transcript storage for this room
            if (!roomTranscripts[path]) {
                roomTranscripts[path] = "";
            }

            for (const id of connections[path]) {
                io.to(id).emit("user-joined", socket.id, connections[path]);
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit("chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ["", false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    'sender': sender,
                    "data": data,
                    "socket-id-sender": socket.id
                });

                console.log("💬 Message in", matchingRoom, ":", sender, data);

                connections[matchingRoom].forEach((ele) => {
                    io.to(ele).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        // ========== WHITEBOARD EVENTS ==========

        // Handle drawing - broadcast to all other users in the room
        socket.on("draw-line", (data) => {
            const { roomId, prevPoint, currentPoint, color, width } = data;
            console.log("🎨 Drawing in room:", roomId);
            socket.to(roomId).emit("draw-line", { prevPoint, currentPoint, color, width });
        });

        // Handle canvas clear - broadcast to all users in the room
        socket.on("clear-canvas", ({ roomId }) => {
            console.log("🗑️ Clearing canvas in room:", roomId);
            socket.to(roomId).emit("clear-canvas");
        });

        // Handle whiteboard toggle - sync state across participants
        socket.on("toggle-whiteboard", ({ roomId, isOpen }) => {
            console.log("📋 Whiteboard toggled in room:", roomId, "isOpen:", isOpen);
            socket.to(roomId).emit("toggle-whiteboard", { isOpen });
        });

        // ========== AI TRANSCRIPTION EVENTS ==========

        // Handle speech-to-text transcriptions
        socket.on("send-transcription", async ({ roomId, username, text }) => {
            // Debug log every received transcription
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            console.log("🎤 RECEIVED TRANSCRIPTION");
            console.log("   Text:", text);
            console.log("   Room:", roomId);
            console.log("   User:", username);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

            if (!text || !text.trim()) {
                console.log("⚠️ Empty transcription, ignoring");
                return;
            }

            // Store transcript in room history
            if (!roomTranscripts[roomId]) {
                roomTranscripts[roomId] = "";
            }
            roomTranscripts[roomId] += `${username}: ${text}\n`;

            // Broadcast live transcription to all participants (for captions)
            socket.to(roomId).emit("live-transcription", {
                username,
                text,
                timestamp: new Date().toISOString()
            });

            // Wake Word Detection - Case insensitive with punctuation handling
            // Remove punctuation and convert to lowercase for matching
            const cleanText = text.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
            const wakeWords = ["hey connectify", "hey assistant", "ok connectify", "connectify"];
            const hasWakeWord = wakeWords.some(word => cleanText.includes(word));

            console.log("🔍 Wake word check:");
            console.log("   Clean text:", cleanText);
            console.log("   Has wake word:", hasWakeWord);
            console.log("   API Key present:", !!process.env.GEMINI_API_KEY);

            if (hasWakeWord) {
                console.log("🤖 WAKE WORD DETECTED! Processing AI request...");

                // Check if API key is configured
                if (!process.env.GEMINI_API_KEY) {
                    console.error("❌ GEMINI_API_KEY is not set in .env file!");

                    // Emit error to chat so user can see it
                    io.in(roomId).emit("chat-message",
                        "⚠️ AI Error: GEMINI_API_KEY is not configured. Please add it to your .env file.",
                        "Connectify AI ⚠️",
                        "ai-assistant"
                    );
                    return;
                }

                try {
                    // Build context-aware prompt
                    const prompt = `You are Connectify AI, a helpful meeting assistant embedded in a video conferencing app.

Meeting Context (Recent Transcript):
${roomTranscripts[roomId].slice(-2000)}

User "${username}" just said: "${text}"

Instructions:
- If they're asking a question, answer it helpfully and concisely
- If they want a summary, summarize the meeting context
- If they want action items, extract them from the context
- Keep responses brief (2-3 sentences max) for voice readability
- Be friendly and professional

Your response:`;

                    console.log("📤 Sending prompt to Gemini API...");
                    console.log("   Prompt length:", prompt.length, "characters");

                    const response = await generateWithRetry(prompt);

                    console.log("✨ AI Response received:");
                    console.log("   Length:", response.length, "characters");
                    console.log("   Preview:", response.substring(0, 150) + "...");

                    // Send AI response to all participants in the room
                    const aiMessage = {
                        sender: "Connectify AI",
                        data: response,
                        isAi: true,
                        timestamp: new Date().toISOString()
                    };

                    // Store in messages
                    if (!messages[roomId]) {
                        messages[roomId] = [];
                    }
                    messages[roomId].push({
                        'sender': aiMessage.sender,
                        'data': aiMessage.data,
                        'socket-id-sender': 'ai-assistant',
                        'isAi': true
                    });

                    // Broadcast to all users in the room using io.in() for reliability
                    io.in(roomId).emit("ai-response", aiMessage);

                    // Also emit as regular chat message for compatibility
                    if (connections[roomId] && connections[roomId].length > 0) {
                        connections[roomId].forEach((socketId) => {
                            io.to(socketId).emit("chat-message", response, "Connectify AI ✨", "ai-assistant");
                        });
                        console.log("✅ AI Response sent to room:", roomId, "| Recipients:", connections[roomId].length);
                    } else {
                        console.log("⚠️ No connections found for room:", roomId);
                    }

                } catch (error) {
                    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
                    console.error("❌ GEMINI API ERROR:");
                    console.error("   Message:", error.message);
                    console.error("   Status:", error.status || "N/A");
                    console.error("   Details:", error.errorDetails || "N/A");
                    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

                    // Send visible error message to chat
                    const errorMessage = error.status === 429
                        ? "⚠️ AI Rate limit exceeded. Please wait a moment and try again."
                        : error.status === 503
                            ? "⚠️ AI service is temporarily overloaded. Please try again."
                            : `⚠️ AI Error: ${error.message}. Check server logs for details.`;

                    io.in(roomId).emit("chat-message",
                        errorMessage,
                        "Connectify AI ⚠️",
                        "ai-assistant"
                    );

                    // Also emit as ai-response for UI handling
                    io.to(socket.id).emit("ai-response", {
                        sender: "Connectify AI",
                        data: errorMessage,
                        isAi: true,
                        isError: true,
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                console.log("💤 No wake word detected, transcription stored only");
            }
        });

        // Get meeting summary on demand
        socket.on("get-meeting-summary", async ({ roomId }) => {
            if (!roomTranscripts[roomId] || !process.env.GEMINI_API_KEY) {
                socket.emit("ai-response", {
                    sender: "Connectify AI",
                    data: "No meeting transcript available yet. Start speaking to begin transcription!",
                    isAi: true,
                    timestamp: new Date().toISOString()
                });
                return;
            }

            try {
                const prompt = `Summarize this meeting transcript in 3-5 bullet points. Be concise:

${roomTranscripts[roomId]}

Meeting Summary:`;

                const result = await model.generateContent(prompt);
                const summary = result.response.text();

                socket.emit("ai-response", {
                    sender: "Connectify AI",
                    data: `📋 Meeting Summary:\n\n${summary}`,
                    isAi: true,
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error("❌ Summary Error:", error.message);
                socket.emit("ai-response", {
                    sender: "Connectify AI",
                    data: "Sorry, I couldn't generate the summary. Please try again.",
                    isAi: true,
                    isError: true,
                    timestamp: new Date().toISOString()
                });
            }
        });

        socket.on("disconnect", () => {
            const diffTime = Math.abs(timeOnline[socket.id] - Date.now());
            console.log("❌ User disconnected:", socket.id, "Time online:", diffTime + "ms");

            let key;
            for (const [k, v] of Object.entries(connections)) {
                for (let a = 0; a < v.length; a++) {
                    if (v[a] === socket.id) {
                        key = k;
                        for (let i = 0; i < connections[key].length; i++) {
                            io.to(connections[key][i]).emit("user-left", socket.id);
                        }
                        const index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);

                        // Room is empty - deactivate meeting in database
                        if (connections[key].length === 0) {
                            console.log("🔒 Room empty, deactivating meeting:", key);
                            deactivateMeeting(key);
                            // Clean up room transcript
                            delete roomTranscripts[key];
                            delete connections[key];
                        }
                        break;
                    }
                }
                if (key) break;
            }

            delete timeOnline[socket.id];
        });
    });

    return io;
};

export default connectToSocket;
