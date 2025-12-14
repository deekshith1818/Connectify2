import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    Box,
    Button,
    TextField,
    Typography,
    IconButton,
    Avatar,
    InputAdornment
} from '@mui/material';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    LogIn,
    User,
    Sparkles
} from 'lucide-react';

/**
 * Premium Pre-Flight Lobby Component
 * Dark glassmorphism design inspired by Linear, 21.dev, Google Meet
 */
const Lobby = ({
    stream,
    onJoin,
    username,
    setUsername,
    isAudioEnabled,
    isVideoEnabled,
    toggleAudio,
    toggleVideo,
    meetingCode
}) => {
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const [audioLevel, setAudioLevel] = useState([0, 0, 0, 0, 0]);
    const animationRef = useRef(null);

    // Attach stream to video element
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Audio visualizer
    const initAudioAnalyser = useCallback(() => {
        if (!stream || !isAudioEnabled) {
            setAudioLevel([0, 0, 0, 0, 0]);
            return;
        }

        try {
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) return;

            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 32;

            const source = audioContextRef.current.createMediaStreamSource(stream);
            source.connect(analyserRef.current);

            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

            const updateLevel = () => {
                if (!analyserRef.current || !isAudioEnabled) {
                    setAudioLevel([0, 0, 0, 0, 0]);
                    return;
                }
                
                analyserRef.current.getByteFrequencyData(dataArray);
                const levels = [
                    Math.min(dataArray[0] / 255, 1),
                    Math.min(dataArray[2] / 255, 1),
                    Math.min(dataArray[4] / 255, 1),
                    Math.min(dataArray[6] / 255, 1),
                    Math.min(dataArray[8] / 255, 1)
                ];
                setAudioLevel(levels);
                animationRef.current = requestAnimationFrame(updateLevel);
            };

            updateLevel();
        } catch (error) {
            console.error('Audio analyser error:', error);
        }
    }, [stream, isAudioEnabled]);

    useEffect(() => {
        initAudioAnalyser();
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [initAudioAnalyser]);

    // Update audio levels when toggling
    useEffect(() => {
        if (!isAudioEnabled) {
            setAudioLevel([0, 0, 0, 0, 0]);
        }
    }, [isAudioEnabled]);

    const handleJoin = () => {
        if (username.trim()) {
            onJoin();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && username.trim()) {
            onJoin();
        }
    };

    const getInitials = () => {
        if (!username.trim()) return '?';
        return username.trim().charAt(0).toUpperCase();
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: `
                    radial-gradient(ellipse at 50% 0%, rgba(120, 119, 198, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
                    radial-gradient(ellipse at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 40%),
                    linear-gradient(180deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)
                `,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 3,
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Animated mesh background */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px',
                    pointerEvents: 'none'
                }}
            />

            {/* Main Glass Container */}
            <Box
                sx={{
                    maxWidth: 480,
                    width: '100%',
                    borderRadius: 4,
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(40px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: `
                        0 0 0 1px rgba(255, 255, 255, 0.05),
                        0 20px 50px -12px rgba(0, 0, 0, 0.5),
                        0 0 100px rgba(99, 102, 241, 0.1)
                    `,
                    position: 'relative',
                    zIndex: 1
                }}
            >
                {/* Header */}
                <Box
                    sx={{
                        padding: '20px 24px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: 'white', 
                                fontWeight: 600,
                                fontSize: '1.1rem',
                                letterSpacing: '-0.02em'
                            }}
                        >
                            Ready to join?
                        </Typography>
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontFamily: 'monospace',
                                fontSize: '0.75rem'
                            }}
                        >
                            Room: {meetingCode}
                        </Typography>
                    </Box>
                    <Sparkles size={20} color="rgba(99, 102, 241, 0.8)" />
                </Box>

                {/* Video Preview Container */}
                <Box 
                    sx={{ 
                        position: 'relative', 
                        aspectRatio: '16/9',
                        margin: '16px',
                        borderRadius: 3,
                        overflow: 'hidden',
                        background: 'linear-gradient(145deg, #12121a 0%, #0a0a0f 100%)',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                >
                    {/* Video Element or Avatar Fallback */}
                    {isVideoEnabled && stream ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                transform: 'scaleX(-1)'
                            }}
                        />
                    ) : (
                        <Box
                            sx={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'linear-gradient(145deg, #1a1a24 0%, #0f0f18 100%)'
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 100,
                                    height: 100,
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    fontSize: '2.5rem',
                                    fontWeight: 600,
                                    boxShadow: '0 0 40px rgba(99, 102, 241, 0.3)'
                                }}
                            >
                                {getInitials()}
                            </Avatar>
                        </Box>
                    )}

                    {/* Floating Controls - Inside Video */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: 1.5,
                            padding: '10px 16px',
                            borderRadius: 3,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    >
                        {/* Mic Button with Audio Visualizer */}
                        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton
                                onClick={toggleAudio}
                                sx={{
                                    width: 48,
                                    height: 48,
                                    background: isAudioEnabled 
                                        ? 'rgba(255, 255, 255, 0.1)' 
                                        : 'rgba(239, 68, 68, 0.9)',
                                    border: '1px solid',
                                    borderColor: isAudioEnabled 
                                        ? 'rgba(255, 255, 255, 0.15)' 
                                        : 'rgba(239, 68, 68, 1)',
                                    color: 'white',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        background: isAudioEnabled 
                                            ? 'rgba(255, 255, 255, 0.15)' 
                                            : 'rgba(239, 68, 68, 1)',
                                        transform: 'scale(1.05)'
                                    }
                                }}
                            >
                                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                            </IconButton>

                            {/* Audio Visualizer Bars */}
                            {isAudioEnabled && (
                                <Box 
                                    sx={{ 
                                        display: 'flex', 
                                        alignItems: 'flex-end', 
                                        gap: '2px',
                                        height: 20
                                    }}
                                >
                                    {audioLevel.map((level, i) => (
                                        <Box
                                            key={i}
                                            sx={{
                                                width: 3,
                                                height: `${Math.max(4, level * 20)}px`,
                                                borderRadius: 1,
                                                background: 'linear-gradient(to top, #10b981, #34d399)',
                                                transition: 'height 0.05s ease',
                                                animation: level > 0.1 ? 'pulse 0.3s ease infinite' : 'none',
                                                '@keyframes pulse': {
                                                    '0%, 100%': { opacity: 0.8 },
                                                    '50%': { opacity: 1 }
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}
                        </Box>

                        {/* Camera Button */}
                        <IconButton
                            onClick={toggleVideo}
                            sx={{
                                width: 48,
                                height: 48,
                                background: isVideoEnabled 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : 'rgba(239, 68, 68, 0.9)',
                                border: '1px solid',
                                borderColor: isVideoEnabled 
                                    ? 'rgba(255, 255, 255, 0.15)' 
                                    : 'rgba(239, 68, 68, 1)',
                                color: 'white',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    background: isVideoEnabled 
                                        ? 'rgba(255, 255, 255, 0.15)' 
                                        : 'rgba(239, 68, 68, 1)',
                                    transform: 'scale(1.05)'
                                }
                            }}
                        >
                            {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
                        </IconButton>
                    </Box>

                    {/* Status Pill */}
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            padding: '4px 10px',
                            borderRadius: 2,
                            background: 'rgba(0, 0, 0, 0.5)',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <Box
                            sx={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: isVideoEnabled ? '#10b981' : '#ef4444',
                                boxShadow: isVideoEnabled 
                                    ? '0 0 8px rgba(16, 185, 129, 0.6)'
                                    : '0 0 8px rgba(239, 68, 68, 0.6)'
                            }}
                        />
                        <Typography 
                            variant="caption" 
                            sx={{ 
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '0.7rem',
                                fontWeight: 500
                            }}
                        >
                            {isVideoEnabled ? 'Camera on' : 'Camera off'}
                        </Typography>
                    </Box>
                </Box>

                {/* Input Section */}
                <Box sx={{ padding: '0 16px 20px 16px' }}>
                    <TextField
                        fullWidth
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyPress={handleKeyPress}
                        variant="outlined"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <User size={18} color="rgba(255, 255, 255, 0.4)" />
                                </InputAdornment>
                            ),
                            sx: {
                                background: 'rgba(255, 255, 255, 0.03)',
                                borderRadius: 2,
                                color: 'white',
                                '& fieldset': {
                                    borderColor: 'rgba(255, 255, 255, 0.08)',
                                    transition: 'border-color 0.2s ease'
                                },
                                '&:hover fieldset': {
                                    borderColor: 'rgba(99, 102, 241, 0.3) !important'
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: 'rgba(99, 102, 241, 0.5) !important',
                                    borderWidth: '1px !important'
                                },
                                '& input::placeholder': {
                                    color: 'rgba(255, 255, 255, 0.4)'
                                }
                            }
                        }}
                        sx={{ mb: 2 }}
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={handleJoin}
                        disabled={!username.trim()}
                        startIcon={<LogIn size={18} />}
                        sx={{
                            padding: '14px 24px',
                            borderRadius: 2,
                            fontWeight: 600,
                            textTransform: 'none',
                            fontSize: '0.95rem',
                            letterSpacing: '-0.01em',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #5457e5 0%, #7c4fe5 100%)',
                                boxShadow: '0 6px 30px rgba(99, 102, 241, 0.4)',
                                transform: 'translateY(-1px)'
                            },
                            '&.Mui-disabled': {
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'rgba(255, 255, 255, 0.3)',
                                boxShadow: 'none'
                            },
                            '@keyframes shimmer': {
                                '0%': { backgroundPosition: '200% 0' },
                                '100%': { backgroundPosition: '-200% 0' }
                            }
                        }}
                    >
                        Join Room
                    </Button>

                    {/* Subtle hint text */}
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            display: 'block',
                            textAlign: 'center',
                            mt: 2,
                            color: 'rgba(255, 255, 255, 0.35)',
                            fontSize: '0.7rem'
                        }}
                    >
                        By joining, you agree to our terms of service
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default Lobby;
