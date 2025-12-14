import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, IconButton, InputAdornment, Link } from '@mui/material';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Plane, Loader2 } from 'lucide-react';

// Scenic Travel Background - Airplane wing view
const TRAVEL_BG = "https://images.unsplash.com/photo-1436491865332-7a6153212e72?q=80&w=2074&auto=format&fit=crop";

// Glass Styles for Inputs
const glassInputStyle = {
    '& .MuiOutlinedInput-root': {
        color: 'white',
        bgcolor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        transition: 'all 0.2s',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
        '&.Mui-focused': {
            bgcolor: 'rgba(255,255,255,0.15)',
            '& fieldset': { borderColor: '#00c6ff', borderWidth: 2 },
        },
    },
    '& input::placeholder': { color: 'rgba(255,255,255,0.5)', opacity: 1 },
};

/**
 * Travel-Themed Sign-In Component
 * Glassmorphism design with scenic airplane background
 */
const SignIn = ({ onSignIn, isLoading = false, error = null }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSignIn && email.trim() && password) {
            onSignIn(email.trim(), password);
        }
    };

    return (
        <Box
            sx={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `url(${TRAVEL_BG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                }
            }}
        >
            <Paper
                elevation={24}
                sx={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '450px',
                    p: 5,
                    mx: 2,
                    borderRadius: 4,
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}
            >
                {/* Header Section */}
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                    <Box 
                        sx={{ 
                            display: 'inline-flex', 
                            p: 1.5, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(255,255,255,0.2)', 
                            mb: 2,
                            animation: 'float 3s ease-in-out infinite',
                            '@keyframes float': {
                                '0%, 100%': { transform: 'translateY(0)' },
                                '50%': { transform: 'translateY(-5px)' }
                            }
                        }}
                    >
                        <Plane color="white" size={32} />
                    </Box>
                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 800, 
                            color: '#fff', 
                            letterSpacing: '-0.5px',
                            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                        }}
                    >
                        Connectify
                    </Typography>
                    <Typography 
                        variant="body2" 
                        sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}
                    >
                        Your journey begins with a secure login
                    </Typography>
                </Box>

                {/* Error Message */}
                {error && (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                        }}
                    >
                        <Typography 
                            variant="body2" 
                            sx={{ color: '#fca5a5', textAlign: 'center' }}
                        >
                            {error}
                        </Typography>
                    </Box>
                )}

                {/* Login Form */}
                <Box 
                    component="form" 
                    onSubmit={handleSubmit} 
                    sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                >
                    <TextField
                        fullWidth
                        placeholder="Username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Mail size={20} color="rgba(255,255,255,0.7)" />
                                </InputAdornment>
                            ),
                        }}
                        sx={glassInputStyle}
                    />

                    <TextField
                        fullWidth
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock size={20} color="rgba(255,255,255,0.7)" />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        edge="end" 
                                        sx={{ color: 'rgba(255,255,255,0.7)' }}
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                        sx={glassInputStyle}
                    />

                    <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        disabled={isLoading || !email.trim() || !password}
                        endIcon={isLoading ? (
                            <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                            <ArrowRight size={20} />
                        )}
                        sx={{
                            height: 50,
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
                            fontSize: '1rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            boxShadow: '0 4px 15px rgba(0, 114, 255, 0.4)',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                                background: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)',
                                boxShadow: '0 6px 20px rgba(0, 114, 255, 0.6)',
                                transform: 'translateY(-2px)'
                            },
                            '&.Mui-disabled': {
                                background: 'rgba(255,255,255,0.2)',
                                color: 'rgba(255,255,255,0.5)'
                            },
                            '@keyframes spin': {
                                from: { transform: 'rotate(0deg)' },
                                to: { transform: 'rotate(360deg)' }
                            }
                        }}
                    >
                        {isLoading ? 'Signing In...' : 'Start Your Journey'}
                    </Button>
                </Box>

                <Typography 
                    variant="body2" 
                    sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}
                >
                    Don't have an account?{' '}
                    <Link 
                        href="/register" 
                        sx={{ 
                            color: '#fff', 
                            fontWeight: 700, 
                            textDecorationColor: 'rgba(255,255,255,0.5)',
                            transition: 'all 0.2s',
                            '&:hover': {
                                color: '#00c6ff',
                                textDecorationColor: '#00c6ff'
                            }
                        }}
                    >
                        Join the adventure
                    </Link>
                </Typography>
            </Paper>
        </Box>
    );
};

export default SignIn;
