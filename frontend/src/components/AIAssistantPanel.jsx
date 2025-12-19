import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, MessageSquare, ChevronDown, Bot, User, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { PromptInputBox } from './ui/ai-prompt-box';

/**
 * AIAssistantPanel - A floating chat panel for AI interactions
 * Connects to socket.io for real-time AI responses
 * 
 * @param {Object} props
 * @param {Object} props.socket - Socket.io client instance
 * @param {string} props.roomId - Current room ID
 * @param {string} props.username - Current user's name
 */
const AIAssistantPanel = ({ socket, roomId, username }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const messagesEndRef = useRef(null);
    const synthRef = useRef(null);

    // Initialize Speech Synthesis
    useEffect(() => {
        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
        return () => {
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Speak text aloud
    const speakText = useCallback((text) => {
        if (!synthRef.current || !voiceEnabled) return;
        
        synthRef.current.cancel();
        
        const cleanText = text
            .replace(/[*_~`]/g, '')
            .replace(/📋|✨|🤖|⚠️|✅|❌|\[.*?\]/g, '')
            .replace(/\n+/g, '. ')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    }, [voiceEnabled]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Track last message to prevent duplicates
    const lastMessageRef = useRef('');

    // Listen for AI responses from server
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (message, sender, socketId) => {
            if (sender && sender.includes('Connectify AI') && socketId === 'ai-assistant') {
                // Deduplicate: skip if same message received within 2 seconds
                if (lastMessageRef.current === message) {
                    console.log('🔄 Skipping duplicate message');
                    return;
                }
                lastMessageRef.current = message;
                setTimeout(() => { lastMessageRef.current = ''; }, 2000);

                const aiMessage = {
                    id: Date.now(),
                    type: 'ai',
                    content: message,
                    timestamp: new Date().toISOString(),
                };
                setMessages(prev => [...prev, aiMessage]);
                setIsLoading(false);
                
                // Speak the response (only from this panel, not VoiceAssistant)
                if (voiceEnabled && isOpen) {
                    speakText(message);
                }
            }
        };

        const handleAiResponse = (data) => {
            if (data.data) {
                // Deduplicate
                if (lastMessageRef.current === data.data) {
                    console.log('🔄 Skipping duplicate ai-response');
                    return;
                }
                lastMessageRef.current = data.data;
                setTimeout(() => { lastMessageRef.current = ''; }, 2000);

                const aiMessage = {
                    id: Date.now(),
                    type: 'ai',
                    content: data.data,
                    isError: data.isError,
                    timestamp: data.timestamp || new Date().toISOString(),
                };
                setMessages(prev => [...prev, aiMessage]);
                setIsLoading(false);
                
                if (voiceEnabled && isOpen && !data.isError) {
                    speakText(data.data);
                }
            }
        };

        socket.on('chat-message', handleChatMessage);
        socket.on('ai-response', handleAiResponse);

        return () => {
            socket.off('chat-message', handleChatMessage);
            socket.off('ai-response', handleAiResponse);
        };
    }, [socket, voiceEnabled, isOpen, speakText]);

    // Handle sending a message
    const handleSend = (message, files) => {
        if (!message.trim() && (!files || files.length === 0)) return;
        if (!socket || !roomId) {
            console.error('Socket or roomId not available');
            return;
        }

        // Add user message to chat
        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Prepare the message - add "Hey Connectify" prefix for wake word detection
        const aiMessage = message.toLowerCase().includes('connectify') 
            ? message 
            : `Hey Connectify, ${message}`;

        // Emit to server
        socket.emit('send-transcription', {
            roomId,
            username: username || 'User',
            text: aiMessage,
        });
    };

    // Toggle voice
    const toggleVoice = () => {
        setVoiceEnabled(prev => !prev);
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        setIsSpeaking(false);
    };

    return (
        <>
            {/* Floating Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-24 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300"
                    >
                        <Sparkles size={20} className="animate-pulse" />
                        <span className="font-medium">AI Assistant</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-4 right-4 z-50 w-[400px] max-w-[calc(100vw-32px)] flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
                        style={{ maxHeight: 'calc(100vh - 120px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-slate-800/50">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Sparkles size={20} className="text-purple-400" />
                                    {isSpeaking && (
                                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    )}
                                </div>
                                <span className="font-semibold text-white">Connectify AI</span>
                                {isLoading && (
                                    <div className="flex gap-1 ml-2">
                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={toggleVoice}
                                    className={`p-2 rounded-lg transition-colors ${
                                        voiceEnabled 
                                            ? 'text-green-400 hover:bg-green-500/20' 
                                            : 'text-slate-400 hover:bg-slate-700'
                                    }`}
                                    title={voiceEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                                >
                                    {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronDown size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4">
                                        <Bot size={32} className="text-white" />
                                    </div>
                                    <h3 className="text-lg font-medium text-white mb-2">Connectify AI</h3>
                                    <p className="text-sm text-slate-400 max-w-[280px]">
                                        Ask me anything about your meeting, request summaries, or get help with action items.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        {/* Avatar */}
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                            msg.type === 'ai' 
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                                                : 'bg-blue-600'
                                        }`}>
                                            {msg.type === 'ai' ? (
                                                <Sparkles size={16} className="text-white" />
                                            ) : (
                                                <User size={16} className="text-white" />
                                            )}
                                        </div>
                                        
                                        {/* Message */}
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                            msg.type === 'ai'
                                                ? msg.isError 
                                                    ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                                                    : 'bg-slate-800 text-slate-100'
                                                : 'bg-blue-600 text-white'
                                        }`}>
                                            {msg.isError && (
                                                <div className="flex items-center gap-1 mb-1">
                                                    <AlertCircle size={12} />
                                                    <span className="text-xs">Error</span>
                                                </div>
                                            )}
                                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t border-slate-700 bg-slate-800/30">
                            <PromptInputBox
                                onSend={handleSend}
                                isLoading={isLoading}
                                placeholder="Ask Connectify AI..."
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistantPanel;
