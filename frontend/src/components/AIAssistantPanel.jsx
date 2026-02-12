import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, ChevronDown, Bot, User, AlertCircle, Volume2, VolumeX, Send } from 'lucide-react';

/**
 * AIAssistantPanel - Compact floating chat panel for AI interactions
 */
const AIAssistantPanel = ({ socket, roomId, username }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const messagesEndRef = useRef(null);
    const synthRef = useRef(null);
    const inputRef = useRef(null);

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

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Track last message to prevent duplicates
    const lastMessageRef = useRef('');

    // Listen for AI responses
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (message, sender, socketId) => {
            if (sender?.includes('Connectify AI') && socketId === 'ai-assistant') {
                if (lastMessageRef.current === message) return;
                lastMessageRef.current = message;
                setTimeout(() => { lastMessageRef.current = ''; }, 2000);

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: message,
                    timestamp: new Date().toISOString(),
                }]);
                setIsLoading(false);
                
                if (voiceEnabled && isOpen) {
                    speakText(message);
                }
            }
        };

        const handleAiResponse = (data) => {
            if (data.data) {
                if (lastMessageRef.current === data.data) return;
                lastMessageRef.current = data.data;
                setTimeout(() => { lastMessageRef.current = ''; }, 2000);

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: data.data,
                    isError: data.isError,
                    timestamp: data.timestamp || new Date().toISOString(),
                }]);
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
    const handleSend = () => {
        const message = inputValue.trim();
        if (!message || !socket || !roomId) return;

        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: message,
            timestamp: new Date().toISOString(),
        }]);
        setInputValue('');
        setIsLoading(true);

        const aiMessage = message.toLowerCase().includes('connectify') 
            ? message 
            : `Hey Connectify, ${message}`;

        socket.emit('send-transcription', {
            roomId,
            username: username || 'User',
            text: aiMessage,
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const toggleVoice = () => {
        setVoiceEnabled(prev => !prev);
        if (synthRef.current) synthRef.current.cancel();
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
                        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-200 text-sm"
                    >
                        <Sparkles size={16} className="animate-pulse" />
                        <span className="font-medium">AI Assistant</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        className="fixed bottom-20 right-4 z-40 w-96 flex flex-col bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden"
                        style={{ maxHeight: 'calc(100vh - 160px)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 bg-slate-800/50">
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Sparkles size={16} className="text-purple-400" />
                                    {isSpeaking && (
                                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    )}
                                </div>
                                <span className="font-medium text-white text-sm">Connectify AI</span>
                                {isLoading && (
                                    <div className="flex gap-0.5 ml-1">
                                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-0.5">
                                <button
                                    onClick={toggleVoice}
                                    className={`p-1.5 rounded-md transition-colors ${
                                        voiceEnabled 
                                            ? 'text-green-400 hover:bg-green-500/20' 
                                            : 'text-slate-400 hover:bg-slate-700'
                                    }`}
                                    title={voiceEnabled ? 'Mute' : 'Unmute'}
                                >
                                    {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[180px] max-h-[350px]">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-2">
                                        <Bot size={20} className="text-white" />
                                    </div>
                                    <p className="text-xs text-slate-400 max-w-[200px]">
                                        Ask about your meeting, summaries, or action items.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-2 ${msg.type === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                            msg.type === 'ai' 
                                                ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                                                : 'bg-blue-600'
                                        }`}>
                                            {msg.type === 'ai' ? (
                                                <Sparkles size={12} className="text-white" />
                                            ) : (
                                                <User size={12} className="text-white" />
                                            )}
                                        </div>
                                        
                                        <div className={`max-w-[85%] rounded-xl px-3 py-1.5 text-sm ${
                                            msg.type === 'ai'
                                                ? msg.isError 
                                                    ? 'bg-red-500/20 border border-red-500/30 text-red-200'
                                                    : 'bg-slate-800 text-slate-100'
                                                : 'bg-blue-600 text-white'
                                        }`}>
                                            {msg.isError && (
                                                <div className="flex items-center gap-1 mb-0.5">
                                                    <AlertCircle size={10} />
                                                    <span className="text-xs">Error</span>
                                                </div>
                                            )}
                                            <p className="whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</p>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-2 border-t border-slate-700 bg-slate-800/30">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask AI..."
                                    className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                    disabled={isLoading}
                                />
                                <button 
                                    onClick={handleSend}
                                    disabled={isLoading || !inputValue.trim()}
                                    className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <Send size={16} className="text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AIAssistantPanel;
