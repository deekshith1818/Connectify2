import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Sparkles, MicOff, Volume2, AlertCircle, VolumeX } from 'lucide-react';

/**
 * VoiceAssistant - Speech recognition + Text-to-Speech component for AI Meeting Assistant
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
    const [voiceEnabled, setVoiceEnabled] = useState(true); // TTS toggle
    const [lastAiResponse, setLastAiResponse] = useState('');
    
    const recognitionRef = useRef(null);
    const isListeningRef = useRef(false);
    const synthRef = useRef(null);

    // Initialize Speech Synthesis (TTS)
    useEffect(() => {
        if ('speechSynthesis' in window) {
            synthRef.current = window.speechSynthesis;
            console.log('🔊 SpeechSynthesis initialized');
        } else {
            console.warn('⚠️ SpeechSynthesis not supported');
        }

        return () => {
            // Cancel any ongoing speech when unmounting
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Function to speak text aloud
    const speakText = useCallback((text) => {
        if (!synthRef.current || !voiceEnabled) {
            console.log('🔇 Voice disabled or not supported');
            return;
        }

        // Cancel any currently playing speech
        synthRef.current.cancel();

        // Clean up the text (remove markdown, emojis, etc.)
        const cleanText = text
            .replace(/[*_~`]/g, '') // Remove markdown
            .replace(/📋|✨|🤖|⚠️|✅|❌/g, '') // Remove emojis
            .replace(/\n+/g, '. ') // Replace newlines with pauses
            .trim();

        if (!cleanText) return;

        console.log('🔊 Speaking:', cleanText.substring(0, 50) + '...');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'en-US';
        utterance.rate = 1.0; // Normal speed
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a natural voice
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
            console.log('🎙️ Started speaking');
            setIsSpeaking(true);
            
            // Pause speech recognition while AI is speaking to prevent feedback
            if (isListeningRef.current && recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore
                }
            }
        };

        utterance.onend = () => {
            console.log('🎙️ Finished speaking');
            setIsSpeaking(false);
            
            // Resume speech recognition after AI finishes speaking
            if (isListeningRef.current && recognitionRef.current) {
                setTimeout(() => {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        // Ignore
                    }
                }, 300);
            }
        };

        utterance.onerror = (event) => {
            console.error('🔊 Speech error:', event.error);
            setIsSpeaking(false);
        };

        synthRef.current.speak(utterance);
    }, [voiceEnabled]);

    // Initialize Speech Recognition once on mount
    useEffect(() => {
        console.log('🎙️ VoiceAssistant mounted');
        console.log('   Socket:', socket ? 'Connected' : 'Not connected');
        console.log('   Room ID:', roomId);
        console.log('   Username:', username);

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            setIsSupported(false);
            console.error('❌ Speech Recognition not supported in this browser');
            return;
        }

        console.log('✅ Speech Recognition is supported');

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            console.log('🎤 Speech recognition STARTED');
            setError(null);
            setDebugInfo('Listening...');
        };

        recognition.onresult = (event) => {
            const resultIndex = event.results.length - 1;
            const result = event.results[resultIndex];
            const transcript = result[0].transcript.trim();
            
            console.log(`📝 Transcript (${result.isFinal ? 'FINAL' : 'interim'}):`, transcript);
            
            if (!result.isFinal) {
                setDebugInfo(`Hearing: "${transcript}"`);
            }
            
            if (result.isFinal && transcript) {
                console.log('✅ Final transcript:', transcript);
                setLastTranscript(transcript);
                setDebugInfo(`Sent: "${transcript}"`);
                
                if (socket && socket.connected) {
                    console.log('📤 Emitting to socket:', {
                        roomId,
                        username: username || 'Unknown User',
                        text: transcript
                    });
                    socket.emit('send-transcription', {
                        roomId,
                        username: username || 'Unknown User',
                        text: transcript
                    });
                } else {
                    console.error('❌ Socket not connected!');
                    setError('Socket not connected');
                }
            }
        };

        recognition.onerror = (event) => {
            console.error('❌ Speech recognition error:', event.error);
            setDebugInfo(`Error: ${event.error}`);
            
            if (event.error === 'not-allowed') {
                setError('Microphone access denied');
                setIsListening(false);
                isListeningRef.current = false;
            } else if (event.error === 'no-speech') {
                console.log('No speech detected, will restart...');
            } else if (event.error === 'network') {
                setError('Network error');
            } else if (event.error !== 'aborted') {
                setError(`Error: ${event.error}`);
            }
        };

        recognition.onend = () => {
            console.log('🎤 Speech recognition ENDED');
            
            if (isListeningRef.current && !isSpeaking) {
                console.log('🔄 Auto-restarting speech recognition...');
                setTimeout(() => {
                    if (isListeningRef.current && recognitionRef.current && !isSpeaking) {
                        try {
                            recognitionRef.current.start();
                        } catch (e) {
                            if (!e.message.includes('already started')) {
                                setError('Failed to restart');
                                setIsListening(false);
                                isListeningRef.current = false;
                            }
                        }
                    }
                }, 100);
            }
        };

        recognitionRef.current = recognition;

        return () => {
            console.log('🎙️ VoiceAssistant unmounting...');
            isListeningRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {}
            }
            if (synthRef.current) {
                synthRef.current.cancel();
            }
        };
    }, []);

    // Update ref when state changes
    useEffect(() => {
        isListeningRef.current = isListening;
    }, [isListening]);

    // Toggle listening state
    const toggleListening = useCallback(() => {
        console.log('🔘 Toggle clicked, current state:', isListening);
        
        if (!recognitionRef.current) {
            setError('Speech recognition not available');
            return;
        }

        if (isListening) {
            console.log('⏹️ Stopping...');
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
            console.log('▶️ Starting...');
            try {
                isListeningRef.current = true;
                recognitionRef.current.start();
                setIsListening(true);
                setError(null);
                setDebugInfo('Starting...');
            } catch (e) {
                console.error('❌ Start error:', e.message);
                if (e.message.includes('already started')) {
                    setIsListening(true);
                    isListeningRef.current = true;
                } else {
                    setError('Could not start');
                    isListeningRef.current = false;
                }
            }
        }
    }, [isListening]);

    // Toggle voice output
    const toggleVoice = useCallback(() => {
        setVoiceEnabled(prev => !prev);
        if (synthRef.current) {
            synthRef.current.cancel();
        }
        setIsSpeaking(false);
    }, []);

    // Listen for AI responses from server and speak them
    useEffect(() => {
        if (!socket) return;

        console.log('🔌 Setting up socket listeners for AI responses');

        const handleAiResponse = (data) => {
            console.log('🤖 AI Response received:', data);
            
            if (data.data && !data.isError) {
                setLastAiResponse(data.data);
                
                // Speak the AI response
                if (voiceEnabled && isListening) {
                    speakText(data.data);
                }
            }
        };

        const handleChatMessage = (message, sender, socketId) => {
            // Check if this is an AI message
            if (sender && sender.includes('Connectify AI') && socketId === 'ai-assistant') {
                console.log('🤖 AI Chat message received');
                
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
        return (
            <div className="fixed bottom-24 left-6 z-50">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 text-yellow-200">
                    <AlertCircle size={16} />
                    <span className="text-xs">Speech not supported (use Chrome)</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-24 left-6 z-50 flex flex-col items-start gap-2">
            {/* Speaking indicator */}
            {isSpeaking && (
                <div className="px-3 py-2 rounded-xl bg-purple-500/30 backdrop-blur-sm border border-purple-500/50 text-white text-xs animate-pulse">
                    <div className="flex items-center gap-2">
                        <Volume2 size={14} className="text-purple-300" />
                        <span>AI is speaking...</span>
                    </div>
                </div>
            )}

            {/* Debug info */}
            {isListening && debugInfo && !isSpeaking && (
                <div className="px-3 py-2 rounded-xl bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 text-white text-xs max-w-xs">
                    <div className="flex items-center gap-2">
                        <Volume2 size={12} className="text-green-400 animate-pulse" />
                        <span className="text-slate-200">{debugInfo}</span>
                    </div>
                </div>
            )}

            {/* Last transcript */}
            {isListening && lastTranscript && !isSpeaking && (
                <div className="px-3 py-2 rounded-xl bg-green-500/20 backdrop-blur-sm border border-green-500/30 text-green-200 text-xs max-w-xs">
                    <p className="text-green-100 truncate">✓ {lastTranscript}</p>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="px-3 py-2 rounded-xl bg-red-500/20 backdrop-blur-sm border border-red-500/30 text-red-200 text-xs max-w-xs">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={12} />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Control buttons */}
            <div className="flex items-center gap-2">
                {/* Main toggle button */}
                <button
                    onClick={toggleListening}
                    className={`
                        flex items-center gap-2 px-4 py-3 rounded-full shadow-xl transition-all duration-300
                        ${isListening 
                            ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-purple-500/30' 
                            : 'bg-slate-800/90 backdrop-blur-sm text-slate-300 hover:bg-slate-700/90 border border-slate-700/50'
                        }
                    `}
                >
                    {isListening ? (
                        <>
                            <div className="relative">
                                <Sparkles size={18} className="animate-pulse" />
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
                            </div>
                            <span className="text-sm font-medium">AI Active</span>
                        </>
                    ) : (
                        <>
                            <MicOff size={18} />
                            <span className="text-sm font-medium">Enable AI</span>
                        </>
                    )}
                </button>

                {/* Voice toggle button */}
                {isListening && (
                    <button
                        onClick={toggleVoice}
                        className={`
                            p-3 rounded-full shadow-lg transition-all duration-300
                            ${voiceEnabled 
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }
                        `}
                        title={voiceEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                    >
                        {voiceEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                    </button>
                )}
            </div>

            {/* Instructions */}
            {isListening && (
                <div className="px-3 py-2 rounded-xl bg-indigo-500/20 backdrop-blur-sm border border-indigo-500/30 text-indigo-200 text-xs">
                    <p>Say <span className="font-bold text-white">"Hey Connectify"</span> + your question</p>
                    {voiceEnabled && <p className="mt-1 text-indigo-300">🔊 Voice response enabled</p>}
                </div>
            )}
        </div>
    );
};

export default VoiceAssistant;
