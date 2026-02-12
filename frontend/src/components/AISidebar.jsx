import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, 
    Users, 
    MessageCircle, 
    Settings, 
    LogOut, 
    Bot, 
    User as UserIcon,
    Send,
    Volume2,
    VolumeX,
    Mic,
    MicOff,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { Sidebar, SidebarBody, SidebarItem, useSidebar } from './ui/sidebar';
import { cn } from '../lib/utils';

/**
 * AISidebar - Collapsible sidebar with AI Assistant integrated
 */
const AISidebar = ({ socket, roomId, username, participants = [], onEndCall }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('ai'); // 'ai' | 'participants'
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isListening, setIsListening] = useState(false);
    
    const messagesEndRef = useRef(null);
    const synthRef = useRef(null);
    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);
    const lastMessageRef = useRef('');

    // Initialize Speech Synthesis
    useEffect(() => {
        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
        }
        return () => {
            if (synthRef.current) synthRef.current.cancel();
        };
    }, []);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const resultIndex = event.results.length - 1;
            const result = event.results[resultIndex];
            const transcript = result[0].transcript.trim();
            
            if (result.isFinal && transcript && socket?.connected) {
                socket.emit('send-transcription', {
                    roomId,
                    username: username || 'User',
                    text: transcript
                });
            }
        };

        recognition.onend = () => {
            if (isListeningRef.current && !isSpeaking) {
                setTimeout(() => {
                    try { recognition.start(); } catch (e) {}
                }, 100);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            isListeningRef.current = false;
            try { recognition.stop(); } catch (e) {}
        };
    }, [socket, roomId, username, isSpeaking]);

    // Speak text
    const speakText = useCallback((text) => {
        if (!synthRef.current || !voiceEnabled) return;
        synthRef.current.cancel();
        
        const cleanText = text.replace(/[*_~`]/g, '').replace(/\n+/g, '. ').trim();
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        synthRef.current.speak(utterance);
    }, [voiceEnabled]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listen for AI responses
    useEffect(() => {
        if (!socket) return;

        const handleAiResponse = (data) => {
            if (data.data && lastMessageRef.current !== data.data) {
                lastMessageRef.current = data.data;
                setTimeout(() => { lastMessageRef.current = ''; }, 2000);

                setMessages(prev => [...prev, {
                    id: Date.now(),
                    type: 'ai',
                    content: data.data,
                    isError: data.isError,
                }]);
                setIsLoading(false);
                
                if (voiceEnabled && !data.isError) {
                    speakText(data.data);
                }
            }
        };

        const handleChatMessage = (message, sender, socketId) => {
            if (sender?.includes('Connectify AI') && socketId === 'ai-assistant') {
                if (lastMessageRef.current !== message) {
                    lastMessageRef.current = message;
                    setTimeout(() => { lastMessageRef.current = ''; }, 2000);

                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        type: 'ai',
                        content: message,
                    }]);
                    setIsLoading(false);
                    
                    if (voiceEnabled) {
                        speakText(message);
                    }
                }
            }
        };

        socket.on('ai-response', handleAiResponse);
        socket.on('chat-message', handleChatMessage);

        return () => {
            socket.off('ai-response', handleAiResponse);
            socket.off('chat-message', handleChatMessage);
        };
    }, [socket, voiceEnabled, speakText]);

    // Handle send message
    const handleSend = () => {
        const message = inputValue.trim();
        if (!message || !socket || !roomId) return;

        setMessages(prev => [...prev, {
            id: Date.now(),
            type: 'user',
            content: message,
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

    // Toggle voice listening
    const toggleListening = () => {
        if (!recognitionRef.current) return;

        if (isListening) {
            isListeningRef.current = false;
            try { recognitionRef.current.stop(); } catch (e) {}
            setIsListening(false);
        } else {
            isListeningRef.current = true;
            try { recognitionRef.current.start(); } catch (e) {}
            setIsListening(true);
        }
    };

    return (
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
            <SidebarBody className="bg-slate-800/95 backdrop-blur-sm border-r border-slate-700">
                <div className="flex flex-col h-full">
                    {/* Logo/Header */}
                    <div className="flex items-center gap-3 px-2 py-3 border-b border-slate-700/50 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <AnimatePresence>
                            {sidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-white font-semibold whitespace-nowrap"
                                >
                                    Connectify AI
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex flex-col gap-1 px-1">
                        <SidebarItem
                            icon={<Bot className={cn("w-5 h-5 flex-shrink-0", activeTab === 'ai' ? "text-purple-400" : "text-slate-400")} />}
                            label="AI Assistant"
                            onClick={() => setActiveTab('ai')}
                            active={activeTab === 'ai'}
                        />
                        <SidebarItem
                            icon={<Users className={cn("w-5 h-5 flex-shrink-0", activeTab === 'participants' ? "text-purple-400" : "text-slate-400")} />}
                            label={`Participants (${participants.length})`}
                            onClick={() => setActiveTab('participants')}
                            active={activeTab === 'participants'}
                        />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 mt-4 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {sidebarOpen && activeTab === 'ai' && (
                                <motion.div
                                    key="ai"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="h-full flex flex-col px-2"
                                >
                                    {/* Voice Controls */}
                                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700/50">
                                        <button
                                            onClick={toggleListening}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all",
                                                isListening 
                                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white" 
                                                    : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                                            )}
                                        >
                                            {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                                            {isListening ? "Listening..." : "Voice"}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setVoiceEnabled(!voiceEnabled);
                                                if (synthRef.current) synthRef.current.cancel();
                                            }}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors",
                                                voiceEnabled ? "bg-green-500/20 text-green-400" : "bg-slate-700/50 text-slate-400"
                                            )}
                                            title={voiceEnabled ? "Mute AI" : "Unmute AI"}
                                        >
                                            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                                        </button>
                                    </div>

                                    {/* Speaking indicator */}
                                    {isSpeaking && (
                                        <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs">
                                            <Volume2 className="w-3 h-3 animate-pulse" />
                                            <span>AI is speaking...</span>
                                        </div>
                                    )}

                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                                        {messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 flex items-center justify-center mb-3">
                                                    <Bot className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <p className="text-slate-400 text-xs">
                                                    Ask me anything about your meeting
                                                </p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => (
                                                <div
                                                    key={msg.id}
                                                    className={cn(
                                                        "flex gap-2",
                                                        msg.type === 'user' ? "flex-row-reverse" : ""
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                                        msg.type === 'ai' ? "bg-gradient-to-br from-indigo-500 to-purple-600" : "bg-blue-600"
                                                    )}>
                                                        {msg.type === 'ai' ? <Sparkles className="w-3 h-3 text-white" /> : <UserIcon className="w-3 h-3 text-white" />}
                                                    </div>
                                                    <div className={cn(
                                                        "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                                                        msg.type === 'ai'
                                                            ? msg.isError 
                                                                ? "bg-red-500/20 border border-red-500/30 text-red-200"
                                                                : "bg-slate-700/70 text-slate-100"
                                                            : "bg-blue-600 text-white"
                                                    )}>
                                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                            placeholder="Ask AI..."
                                            className="flex-1 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                            disabled={isLoading}
                                        />
                                        <button 
                                            onClick={handleSend}
                                            disabled={isLoading || !inputValue.trim()}
                                            className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
                                        >
                                            <Send className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {sidebarOpen && activeTab === 'participants' && (
                                <motion.div
                                    key="participants"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="h-full overflow-y-auto px-2 space-y-2"
                                >
                                    {participants.map((participant) => (
                                        <div key={participant.socketId} className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                                                {participant.name?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-white truncate">
                                                    {participant.name}
                                                    {participant.isLocal && <span className="text-slate-400 text-xs ml-1">(You)</span>}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-4 border-t border-slate-700/50 px-1">
                        <SidebarItem
                            icon={<LogOut className="w-5 h-5 text-red-400 flex-shrink-0" />}
                            label="Leave Meeting"
                            onClick={onEndCall}
                            className="hover:bg-red-500/10"
                        />
                    </div>
                </div>
            </SidebarBody>
        </Sidebar>
    );
};

export default AISidebar;
