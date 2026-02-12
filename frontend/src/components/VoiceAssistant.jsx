import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, MicOff, Volume2, AlertCircle, VolumeX, ChevronUp, ChevronDown } from 'lucide-react';

/**
 * VoiceAssistant - Compact Speech recognition + Text-to-Speech component
 * - Listens for "Hey Connectify" wake word and sends transcriptions to server
 * - Speaks AI responses aloud using SpeechSynthesis API
 */
const VoiceAssistant = ({ socket, roomId, username }) => {
    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true);
    const [lastTranscript, setLastTranscript] = useState('');
    const [error, setError] = useState(null);
    const [debugInfo, setDebugInfo] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    
    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);
    const synthRef = useRef(null);

    // Initialize Speech Synthesis (TTS)
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

    // Function to speak text aloud
    const speakText = useCallback((text) => {
        if (!synthRef.current || !voiceEnabled) return;

        synthRef.current.cancel();

        const cleanText = text
            .replace(/[*_~`]/g, '')
            .replace(/📋|✨|🤖|⚠️|✅|❌/g, '')
            .replace(/\n+/g, '. ')
            .trim();

        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = synthRef.current.getVoices();
        const preferredVoice = voices.find(v => 
            v.name.includes('Google') || 
            v.name.includes('Samantha') || 
            v.name.includes('Daniel') ||
            v.lang === 'en-US'
        );
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.onstart = () => {
            setIsSpeaking(true);
            if (isListeningRef.current && recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            if (isListeningRef.current && recognitionRef.current) {
                setTimeout(() => {
                    try { recognitionRef.current.start(); } catch (e) {}
                }, 300);
            }
        };

        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
    }, [voiceEnabled]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setIsSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setError(null);
            setDebugInfo('Listening...');
        };

        recognition.onresult = (event) => {
            const resultIndex = event.results.length - 1;
            const result = event.results[resultIndex];
            const transcript = result[0].transcript.trim();
            
            if (!result.isFinal) {
                setDebugInfo(`"${transcript.slice(-30)}..."`);
            }
            
            if (result.isFinal && transcript) {
                setLastTranscript(transcript);
                setDebugInfo(`Sent!`);
                
                if (socket && socket.connected) {
                    socket.emit('send-transcription', {
                        roomId,
                        username: username || 'Unknown User',
                        text: transcript
                    });
                } else {
                    setError('Not connected');
                }
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'not-allowed') {
                setError('Mic denied');
                setIsListening(false);
                isListeningRef.current = false;
            } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
                setError(event.error);
            }
        };

        recognition.onend = () => {
            if (isListeningRef.current && !isSpeaking) {
                setTimeout(() => {
                    if (isListeningRef.current && recognitionRef.current && !isSpeaking) {
                        try { recognitionRef.current.start(); } catch (e) {}
                    }
                }, 100);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) {}
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Not available');
            return;
        }

        if (isListening) {
            try {
                isListeningRef.current = false;
                recognitionRef.current.stop();
                if (synthRef.current) synthRef.current.cancel();
            } catch (e) {}
            setIsListening(false);
            setLastTranscript('');
            setDebugInfo('');
            setIsSpeaking(false);
        } else {
            try {
                isListeningRef.current = true;
                recognitionRef.current.start();
                setIsListening(true);
                setError(null);
                setDebugInfo('Starting...');
            } catch (e) {
                if (e.message.includes('already started')) {
                    setIsListening(true);
                    isListeningRef.current = true;
                } else {
                    setError('Failed');
                    isListeningRef.current = false;
                }
            }
        }
    }, [isListening]);

    const toggleVoice = useCallback(() => {
        setVoiceEnabled(prev => !prev);
        if (synthRef.current) synthRef.current.cancel();
        setIsSpeaking(false);
    }, []);

    // Listen for AI responses
    useEffect(() => {
        if (!socket) return;

        const handleAiResponse = (data) => {
            if (data.data && !data.isError && voiceEnabled && isListening) {
                speakText(data.data);
            }
        };

        const handleChatMessage = (message, sender, socketId) => {
            if (sender?.includes('Connectify AI') && socketId === 'ai-assistant') {
                if (voiceEnabled && isListening && message) {
                    speakText(message);
                }
            }
        };

        socket.on('ai-response', handleAiResponse);
        socket.on('chat-message', handleChatMessage);

        return () => {
            socket.off('ai-response', handleAiResponse);
            socket.off('chat-message', handleChatMessage);
        };
    }, [socket, voiceEnabled, isListening, speakText]);

    if (!isSupported) {
        return null; // Hide completely if not supported
    }

    return (
        <div className="fixed bottom-20 left-4 z-40 flex flex-col items-start gap-1.5 max-w-[200px]">
            {/* Expanded info panel */}
            {isListening && isExpanded && (
                <div className="w-full space-y-1.5 animate-in slide-in-from-bottom-2 duration-200">
                    {/* Speaking indicator */}
                    {isSpeaking && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-purple-500/30 border border-purple-500/50 text-white text-xs flex items-center gap-1.5">
                            <Volume2 size={12} className="text-purple-300 animate-pulse" />
                            <span>Speaking...</span>
                        </div>
                    )}

                    {/* Debug info */}
                    {debugInfo && !isSpeaking && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/50 text-slate-200 text-xs truncate">
                            {debugInfo}
                        </div>
                    )}

                    {/* Last transcript */}
                    {lastTranscript && !isSpeaking && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30 text-green-200 text-xs truncate">
                            ✓ {lastTranscript.slice(-40)}...
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex items-center gap-1.5">
                            <AlertCircle size={10} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-xs">
                        <span className="font-semibold text-white">"Hey Connectify"</span> + question
                    </div>
                </div>
            )}

            {/* Control row */}
            <div className="flex items-center gap-1.5">
                {/* Main toggle button */}
                <button
                    onClick={toggleListening}
                    className={`
                        flex items-center gap-1.5 px-3 py-2 rounded-full shadow-lg transition-all duration-200 text-sm
                        ${isListening 
                            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-purple-500/30' 
                            : 'bg-slate-800/90 backdrop-blur-sm text-slate-300 hover:bg-slate-700/90 border border-slate-700/50'
                        }
                    `}
                >
                    {isListening ? (
                        <>
                            <div className="relative">
                                <Sparkles size={14} className="animate-pulse" />
                                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
                            </div>
                            <span className="font-medium">AI Active</span>
                        </>
                    ) : (
                        <>
                            <MicOff size={14} />
                            <span className="font-medium">Enable AI</span>
                        </>
                    )}
                </button>

                {/* Voice toggle */}
                {isListening && (
                    <button
                        onClick={toggleVoice}
                        className={`
                            p-2 rounded-full shadow-lg transition-all duration-200
                            ${voiceEnabled 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }
                        `}
                        title={voiceEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                    >
                        {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                    </button>
                )}

                {/* Expand/Collapse toggle */}
                {isListening && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-full bg-slate-800/90 text-slate-400 hover:text-white border border-slate-700/50 transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                    </button>
                )}
            </div>
        </div>
    );
};

export default VoiceAssistant;
