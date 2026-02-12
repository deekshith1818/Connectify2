import React, { useEffect, useRef, useState, useCallback } from 'react'
import { io } from "socket.io-client";
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Users,
  MessageCircle,
  Settings,
  MoreVertical,
  Volume2,
  VolumeX,
  User,
  LogOut,
  Pencil
} from 'lucide-react';
import AISidebar from '../components/AISidebar';
import Whiteboard from '../components/Whiteboard';
import Lobby from '../components/Lobby';
import { ChatBubble, ChatBubbleAvatar, ChatBubbleMessage } from '../components/ui/chat-bubble';
import { Send } from 'lucide-react';
import VideoLayout from '../components/VideoLayout';
import server from '../environment';

const server_url = `${server}`;
let connections = {};

// ✅ FIXED: Remote video component with proper autoplay policy handling
const RemoteVideo = ({ stream, socketId, index }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            console.log(`🎬 [RemoteVideo ${index}] Setting srcObject for ${socketId}`);
            console.log(`   Stream ID: ${stream.id}`);
            console.log(`   Tracks: ${stream.getTracks().length}`);
            console.log(`   Video tracks: ${stream.getVideoTracks().length}`);
            console.log(`   Audio tracks: ${stream.getAudioTracks().length}`);
            
            // CRITICAL: Set srcObject first
            videoRef.current.srcObject = stream;
            
            // IMPORTANT: Set volume to max (muted attribute doesn't affect audio playback through speakers)
            videoRef.current.volume = 1.0;
            
            // Force play - browsers require user interaction or muted=true for autoplay
            // Note: muted=true on video element ONLY affects the video element's audio output,
            // NOT the WebRTC audio that goes through the RTCPeerConnection
            const playPromise = videoRef.current.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log(`✅ [RemoteVideo ${index}] Video playing for ${socketId}`);
                    })
                    .catch(err => {
                        console.error(`❌ [RemoteVideo ${index}] Autoplay failed:`, err.message);
                        // If autoplay fails, the video will still show once user interacts
                        console.log('   💡 Tip: User interaction may be required for autoplay');
                    });
            }
        } else {
            console.warn(`⚠️ [RemoteVideo ${index}] No ref or stream:`, {
                hasRef: !!videoRef.current,
                hasStream: !!stream,
                socketId
            });
        }
        
        // Cleanup function
        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [stream, socketId, index]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}  // CRITICAL FIX: Remote videos must NOT be muted to hear other participants
            className="w-full h-full object-cover"
            style={{ backgroundColor: '#1e293b' }}
        />
    );
};

// ✅ FIXED: Added TURN servers for production
const peerConfigConnections = {
    iceServers: [
        // STUN servers - for NAT discovery
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // TURN servers - CRITICAL for production (relays traffic through NAT/firewalls)
        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject'
        }
    ],
    iceCandidatePoolSize: 10
};

export default function VideoMeetComponent() {
    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoRef = useRef();
    const videoRef = useRef([]);

    const [videoAvailable, setVideoAvailable] = useState(false);
    const [audioAvailable, setAudioAvailable] = useState(false);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);
    const [showModal, setModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [videos, setVideos] = useState([]);
    const [showParticipants, setShowParticipants] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
    const [lobbyStream, setLobbyStream] = useState(null);  // Stream for lobby preview
    const [isLobbyAudioEnabled, setIsLobbyAudioEnabled] = useState(true);
    const [isLobbyVideoEnabled, setIsLobbyVideoEnabled] = useState(true);
    const [pinnedId, setPinnedId] = useState(null);  // For Speaker View - pinned participant
    const [localStream, setLocalStream] = useState(null);  // ADDED: React state for local stream to trigger re-renders

    // Helper functions for black video and silence audio
    const silence = useCallback(() => {
        let ctx = new (window.AudioContext || window.webkitAudioContext)();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume();
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
    }, []);

    const black = useCallback(({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    }, []);

    // Get initial permissions
    const getPermissions = useCallback(async () => {
        try {
            // Test video permission
            try {
                const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
                videoPermission.getTracks().forEach(track => track.stop());
                setVideoAvailable(true);
                console.log('✅ Video permission granted');
            } catch (e) {
                console.log("❌ Video not available:", e);
                setVideoAvailable(false);
            }

            // Test audio permission
            try {
                const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioPermission.getTracks().forEach(track => track.stop());
                setAudioAvailable(true);
                console.log('✅ Audio permission granted');
            } catch (e) {
                console.log("❌ Audio not available:", e);
                setAudioAvailable(false);
            }

            // Check screen share availability
            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
                console.log('✅ Screen share available');
            } else {
                setScreenAvailable(false);
                console.log('❌ Screen share not available');
            }

        } catch (error) {
            console.error("❌ Error getting permissions:", error);
        }
    }, []);

    // Get user media stream
    const getUserMedia = useCallback(async () => {
        try {
            console.log('🎥 Getting user media... Video:', video, 'Audio:', audio);
            
            // Stop existing tracks
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                    track.stop();
                    console.log('🛑 Stopped track:', track.kind);
                });
            }

            let stream;
            if ((video && videoAvailable) || (audio && audioAvailable)) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: video && videoAvailable,
                    audio: audio && audioAvailable
                });
                console.log('✅ Got user media stream with', stream.getTracks().length, 'tracks');
            } else {
                // Create black silence stream
                let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                stream = blackSilence();
                console.log('📺 Created black/silence stream');
            }

            window.localStream = stream;
            setLocalStream(stream);  // ADDED: Update React state
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                console.log('✅ Set local video srcObject');
            }

            // Update peer connections
            for (let id in connections) {
                if (id === socketIdRef.current) continue;
                
                console.log('🔄 Updating peer connection for', id);
                
                // Remove old stream
                const senders = connections[id].getSenders();
                senders.forEach(sender => {
                    if (sender.track) {
                        connections[id].removeTrack(sender);
                    }
                });

                // Add new stream
                stream.getTracks().forEach(track => {
                    connections[id].addTrack(track, stream);
                    console.log('➕ Added track to peer:', track.kind);
                });

                // Create offer
                const description = await connections[id].createOffer();
                await connections[id].setLocalDescription(description);
                socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                console.log('📤 Sent updated offer to', id);
            }

            // Handle track ended
            stream.getTracks().forEach(track => {
                track.onended = () => {
                    console.log('🛑 Track ended:', track.kind);
                    setVideo(false);
                    setAudio(false);
                    getUserMedia();
                };
            });

        } catch (error) {
            console.error("❌ Error accessing media devices:", error);
        }
    }, [video, audio, videoAvailable, audioAvailable, black, silence]);

    // Get display media for screen sharing
    const getDisplayMedia = useCallback(async () => {
        if (screen && navigator.mediaDevices.getDisplayMedia) {
            try {
                console.log('🖥️ Getting display media...');
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                
                // Stop existing tracks
                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => track.stop());
                }

                window.localStream = stream;
                setLocalStream(stream);  // ADDED: Update React state
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

                console.log('✅ Screen sharing started');

                // Update peer connections
                for (let id in connections) {
                    if (id === socketIdRef.current) continue;

                    // Remove old tracks and add new ones
                    const senders = connections[id].getSenders();
                    senders.forEach(sender => {
                        if (sender.track) {
                            connections[id].removeTrack(sender);
                        }
                    });

                    stream.getTracks().forEach(track => {
                        connections[id].addTrack(track, stream);
                    });

                    const description = await connections[id].createOffer();
                    await connections[id].setLocalDescription(description);
                    socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
                }

                stream.getTracks().forEach(track => {
                    track.onended = () => {
                        console.log('🛑 Screen share ended');
                        setScreen(false);
                        getUserMedia();
                    };
                });

            } catch (error) {
                console.error("❌ Error sharing screen:", error);
                setScreen(false);
            }
        }
    }, [screen, getUserMedia]);

    // Handle signaling messages
    // ICE candidate buffer - stores candidates that arrive before remote description is set
    const iceCandidateBufferRef = useRef({});
    
    const gotMessageFromServer = useCallback(async (fromId, message) => {
        console.log('📥 Got message from server. From:', fromId, 'Type:', JSON.parse(message).sdp?.type || 'ICE');
        
        const signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                try {
                    console.log('📨 Processing SDP:', signal.sdp.type);
                    await connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    console.log('✅ Set remote description for', fromId);
                    
                    // CRITICAL FIX: Flush buffered ICE candidates after remote description is set
                    if (iceCandidateBufferRef.current[fromId] && iceCandidateBufferRef.current[fromId].length > 0) {
                        console.log(`🧊 Flushing ${iceCandidateBufferRef.current[fromId].length} buffered ICE candidates for`, fromId);
                        for (const candidate of iceCandidateBufferRef.current[fromId]) {
                            try {
                                await connections[fromId].addIceCandidate(new RTCIceCandidate(candidate));
                                console.log('🧊 Added buffered ICE candidate');
                            } catch (e) {
                                console.error('❌ Error adding buffered ICE candidate:', e);
                            }
                        }
                        iceCandidateBufferRef.current[fromId] = [];
                    }
                    
                    if (signal.sdp.type === "offer") {
                        const description = await connections[fromId].createAnswer();
                        await connections[fromId].setLocalDescription(description);
                        socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }));
                        console.log('📤 Sent answer to', fromId);
                    }
                } catch (e) {
                    console.error("❌ Error handling SDP:", e);
                }
            }
            if (signal.ice) {
                try {
                    // CRITICAL FIX: Buffer ICE candidates if remote description not yet set
                    if (connections[fromId] && connections[fromId].remoteDescription && connections[fromId].remoteDescription.type) {
                        await connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
                        console.log('🧊 Added ICE candidate from', fromId);
                    } else {
                        // Buffer the candidate for later
                        if (!iceCandidateBufferRef.current[fromId]) {
                            iceCandidateBufferRef.current[fromId] = [];
                        }
                        iceCandidateBufferRef.current[fromId].push(signal.ice);
                        console.log('🧊 Buffered ICE candidate from', fromId, '(waiting for remote description)');
                    }
                } catch (e) {
                    console.error("❌ Error adding ICE candidate:", e);
                }
            }
        }
    }, []);

    // Connect to socket server
    const connectToSocketServer = useCallback(() => {
        console.log('🔌 Connecting to socket server:', server_url);
        
        const isSecure = server_url.startsWith('https');
        socketRef.current = io.connect(server_url, { 
            secure: isSecure,
            rejectUnauthorized: false,
            transports: ['websocket', 'polling']
        });
        
        socketRef.current.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
        });
        
        socketRef.current.on('signal', gotMessageFromServer);
        
        socketRef.current.on("connect", () => {
            console.log('✅ Socket connected. ID:', socketRef.current.id);
            socketRef.current.emit("join-call", window.location.href);
            socketIdRef.current = socketRef.current.id;
            
            socketRef.current.on("chat-message", addMessage);

            // Whiteboard sync event
            socketRef.current.on("toggle-whiteboard", ({ isOpen }) => {
                console.log('📋 Remote whiteboard toggle:', isOpen);
                setIsWhiteboardOpen(isOpen);
            });

            socketRef.current.on("user-left", (id) => {
                console.log('👋 User left:', id);
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                setParticipants((participants) => participants.filter((p) => p.socketId !== id));
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            socketRef.current.on("user-joined", (id, clients) => {
                console.log('👤 User joined. ID:', id, 'Total clients:', clients.length);
                
                // Add current user to participants
                setParticipants(prev => {
                    const currentUser = prev.find(p => p.socketId === socketIdRef.current);
                    if (!currentUser) {
                        return [...prev, {
                            socketId: socketIdRef.current,
                            name: username,
                            isMuted: !audio,
                            isVideoOff: !video,
                            isLocal: true
                        }];
                    }
                    return prev;
                });

                clients.forEach((socketListId) => {
                    if (!connections[socketListId]) {
                        console.log('🔗 Creating peer connection for', socketListId);
                        connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                        
                        // ✅ ADDED: ICE candidate handler
                        connections[socketListId].onicecandidate = (event) => {
                            if (event.candidate !== null) {
                                console.log('🧊 Sending ICE candidate to', socketListId);
                                socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }));
                            }
                        };

                        // ✅ ADDED: Connection state monitoring
                        connections[socketListId].oniceconnectionstatechange = () => {
                            console.log(`🔌 ICE Connection State (${socketListId}):`, 
                                connections[socketListId].iceConnectionState
                            );
                            
                            // Restart ICE if failed
                            if (connections[socketListId].iceConnectionState === 'failed') {
                                console.error('❌ ICE failed, attempting restart...');
                                connections[socketListId].restartIce();
                            }
                        };

                        connections[socketListId].onconnectionstatechange = () => {
                            const state = connections[socketListId].connectionState;
                            console.log(`🔗 Connection State (${socketListId}):`, state);
                            
                            // ENHANCED: Automatic recovery on connection failure
                            if (state === 'failed' || state === 'disconnected') {
                                console.warn(`⚠️ Connection ${state} for ${socketListId}, attempting ICE restart...`);
                                try {
                                    connections[socketListId].restartIce();
                                } catch (e) {
                                    console.error('❌ ICE restart failed:', e);
                                }
                            }
                        };

                        connections[socketListId].onsignalingstatechange = () => {
                            console.log(`📡 Signaling State (${socketListId}):`, 
                                connections[socketListId].signalingState
                            );
                        };

                        // ✅ IMPROVED: Track handler with detailed logging and proper stream handling
                        connections[socketListId].ontrack = (event) => {
                            console.log('📹 Remote track received from', socketListId);
                            console.log('  - Track kind:', event.track.kind);
                            console.log('  - Track enabled:', event.track.enabled);
                            console.log('  - Track muted:', event.track.muted);
                            console.log('  - Track readyState:', event.track.readyState);
                            console.log('  - Streams count:', event.streams.length);
                            
                            if (event.streams.length === 0) {
                                console.error('❌ No streams in track event!');
                                return;
                            }
                            
                            const remoteStream = event.streams[0];
                            console.log('✅ Stream details:', {
                                id: remoteStream.id,
                                active: remoteStream.active,
                                tracks: remoteStream.getTracks().length,
                                videoTracks: remoteStream.getVideoTracks().length,
                                audioTracks: remoteStream.getAudioTracks().length
                            });
                            
                            // Check if video track is enabled
                            const videoTrack = remoteStream.getVideoTracks()[0];
                            if (videoTrack) {
                                console.log('  - Video track enabled:', videoTrack.enabled);
                                console.log('  - Video track muted:', videoTrack.muted);
                                console.log('  - Video track readyState:', videoTrack.readyState);
                            } else {
                                console.warn('⚠️ No video track in stream!');
                            }
                            
                            setVideos(videos => {
                                const videoExists = videos.find(video => video.socketId === socketListId);
                                if (videoExists) {
                                    console.log('🔄 Updating existing video for', socketListId);
                                    return videos.map(video =>
                                        video.socketId === socketListId
                                            ? { ...video, stream: remoteStream }
                                            : video
                                    );
                                } else {
                                    console.log('➕ Adding new video for', socketListId);
                                    const newVideo = {
                                        socketId: socketListId,
                                        stream: remoteStream,
                                        autoPlay: true,
                                        playsInline: true
                                    };
                                    const updatedVideos = [...videos, newVideo];
                                    console.log('  - Total videos now:', updatedVideos.length);
                                    return updatedVideos;
                                }
                            });

                            // Add remote user to participants
                            setParticipants(prev => {
                                const existing = prev.find(p => p.socketId === socketListId);
                                if (!existing) {
                                    return [...prev, {
                                        socketId: socketListId,
                                        name: `User ${socketListId.slice(-4)}`,
                                        isMuted: false,
                                        isVideoOff: false,
                                        isLocal: false
                                    }];
                                }
                                return prev;
                            });
                        };

                        // Add local stream tracks
                        if (window.localStream) {
                            console.log('➕ Adding local stream tracks to peer', socketListId);
                            window.localStream.getTracks().forEach(track => {
                                connections[socketListId].addTrack(track, window.localStream);
                                console.log('  - Added', track.kind, 'track');
                            });
                        } else {
                            console.warn('⚠️ No local stream available yet');
                        }
                    }
                });

                if (id === socketIdRef.current) {
                    console.log('🤝 Creating offers for all peers');
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    console.log('📤 Sending offer to', id2);
                                    socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }));
                                })
                                .catch(e => console.error('❌ Error setting local description:', e));
                        }).catch(e => console.error('❌ Error creating offer:', e));
                    }
                }
            });
        });
    }, [gotMessageFromServer, username, audio, video]);

    // Initialize media and connect
    const getMedia = useCallback(async () => {
        console.log('🎬 getMedia called - Getting local stream first...');
        
        // CRITICAL FIX: Get local media stream BEFORE connecting to socket
        // This ensures window.localStream exists when peer connections are created
        try {
            // Set states first
            setVideo(videoAvailable);
            setAudio(audioAvailable);
            
            // Get the media stream
            let stream;
            if (videoAvailable || audioAvailable) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvailable,
                    audio: audioAvailable
                });
                console.log('✅ Got initial user media:', {
                    video: videoAvailable,
                    audio: audioAvailable,
                    tracks: stream.getTracks().length
                });
            } else {
                // Create black silence stream
                let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                stream = blackSilence();
                console.log('📺 Created black/silence stream (no permissions)');
            }
            
            window.localStream = stream;
            setLocalStream(stream);  // ADDED: Update React state
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            console.log('✅ Local stream ready, now connecting to socket...');
            // Now connect to socket server with stream ready
            connectToSocketServer();
            
        } catch (error) {
            console.error('❌ Error getting initial media:', error);
            // Still connect even if media fails
            connectToSocketServer();
        }
    }, [videoAvailable, audioAvailable, connectToSocketServer, black, silence]);

    // Send chat message
    const sendMessage = useCallback(() => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit('chat-message', message, username);
            setMessage("");
        }
    }, [message, username]);

    // Handle end call
    const handleEndCall = useCallback(() => {
        console.log('📞 Ending call...');
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                    track.stop();
                    console.log('🛑 Stopped local track:', track.kind);
                });
            }
            for (let id in connections) {
                connections[id].close();
                console.log('🔌 Closed connection:', id);
            }
            connections = {};
            if (socketRef.current) {
                socketRef.current.disconnect();
                console.log('🔌 Socket disconnected');
            }
        } catch (e) {
            console.error("❌ Error ending call:", e);
        }
        window.location.href = "/home";
    }, []);

    // Add message to chat
    const addMessage = useCallback((data, sender, socketIdSender) => {
        console.log('💬 New message from', sender);
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        } 
    }, []);

    // Connect to meeting - uses existing lobby stream
    const connect = useCallback(() => {
        if (username.trim()) {
            console.log('👤 Joining as:', username);
            setAskForUsername(false);
            
            // Use the existing lobby stream instead of requesting new media
            if (lobbyStream) {
                console.log('🔄 Using existing lobby stream for meeting');
                window.localStream = lobbyStream;
                setLocalStream(lobbyStream);  // ADDED: Update React state
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = lobbyStream;
                }
                
                // Set video/audio states based on lobby settings
                setVideo(isLobbyVideoEnabled);
                setAudio(isLobbyAudioEnabled);
                
                // Connect to socket with stream already available
                connectToSocketServer();
            } else {
                // Fallback: get new media if lobby stream not available
                getMedia();
            }
        }
    }, [username, lobbyStream, isLobbyVideoEnabled, isLobbyAudioEnabled, connectToSocketServer, getMedia]);

    // Toggle video
    const handleVideo = useCallback(() => {
        console.log('📹 Toggling video:', !video);
        setVideo(!video);
        setParticipants(prev => prev.map(p => 
            p.isLocal ? { ...p, isVideoOff: !video } : p
        ));
    }, [video]);

    // Toggle audio
    const handleAudio = useCallback(() => {
        console.log('🎤 Toggling audio:', !audio);
        setAudio(!audio);
        setParticipants(prev => prev.map(p => 
            p.isLocal ? { ...p, isMuted: !audio } : p
        ));
    }, [audio]);

    // Toggle screen sharing
    const handleScreen = useCallback(() => {
        console.log('🖥️ Toggling screen share:', !screen);
        setScreen(!screen);
    }, [screen]);

    // Toggle chat modal
    const toggleChat = useCallback(() => {
        setModal(!showModal);
        if (!showModal) {
            setNewMessages(0);
        }
    }, [showModal]);

    // Toggle whiteboard
    const handleWhiteboard = useCallback(() => {
        const newState = !isWhiteboardOpen;
        setIsWhiteboardOpen(newState);
        console.log('📋 Toggling whiteboard:', newState);
        socketRef.current?.emit("toggle-whiteboard", { 
            roomId: window.location.href, 
            isOpen: newState 
        });
    }, [isWhiteboardOpen]);

    // Handle Enter key in message input
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    }, [sendMessage]);

    // Toggle lobby audio
    const toggleLobbyAudio = useCallback(() => {
        if (lobbyStream) {
            lobbyStream.getAudioTracks().forEach(track => {
                track.enabled = !isLobbyAudioEnabled;
            });
            setIsLobbyAudioEnabled(!isLobbyAudioEnabled);
            console.log('🎤 Lobby audio toggled:', !isLobbyAudioEnabled);
        }
    }, [lobbyStream, isLobbyAudioEnabled]);

    // Toggle lobby video
    const toggleLobbyVideo = useCallback(() => {
        if (lobbyStream) {
            lobbyStream.getVideoTracks().forEach(track => {
                track.enabled = !isLobbyVideoEnabled;
            });
            setIsLobbyVideoEnabled(!isLobbyVideoEnabled);
            console.log('📹 Lobby video toggled:', !isLobbyVideoEnabled);
        }
    }, [lobbyStream, isLobbyVideoEnabled]);

    // Effects
    useEffect(() => {
        console.log('🚀 Component mounted, getting permissions...');
        getPermissions();
    }, [getPermissions]);

    useEffect(() => {
        // Only update media after initial setup (when socket is connected)
        if (video !== undefined && audio !== undefined && socketRef.current?.connected) {
            console.log('🔄 Video/Audio toggled, updating media streams...');
            getUserMedia();
        }
    }, [video, audio, getUserMedia]);

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen, getDisplayMedia]);

    // ✅ NEW: Debug effect to monitor videos state
    useEffect(() => {
        console.log('📊 Videos state updated:', {
            count: videos.length,
            videos: videos.map(v => ({
                socketId: v.socketId.slice(-4),
                hasStream: !!v.stream,
                streamActive: v.stream?.active,
                trackCount: v.stream?.getTracks().length
            }))
        });
    }, [videos]);

    // Initialize lobby stream on mount
    useEffect(() => {
        const initLobbyStream = async () => {
            if (askForUsername && !lobbyStream) {
                console.log('🎬 Initializing lobby stream...');
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    setLobbyStream(stream);
                    console.log('✅ Lobby stream ready');
                } catch (error) {
                    console.error('❌ Error getting lobby stream:', error);
                    // Try video only
                    try {
                        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                        setLobbyStream(videoStream);
                        setIsLobbyAudioEnabled(false);
                    } catch (videoError) {
                        console.error('❌ Video also failed:', videoError);
                    }
                }
            }
        };
        initLobbyStream();
        
        // Cleanup on unmount
        return () => {
            if (lobbyStream && askForUsername) {
                // Only cleanup if still in lobby
                lobbyStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [askForUsername]);

    // Get meeting code from URL
    const getMeetingCode = () => {
        const path = window.location.pathname;
        return path.split('/').pop() || 'Unknown';
    };

    if (askForUsername) {
        return (
            <Lobby
                stream={lobbyStream}
                onJoin={connect}
                username={username}
                setUsername={setUsername}
                isAudioEnabled={isLobbyAudioEnabled}
                isVideoEnabled={isLobbyVideoEnabled}
                toggleAudio={toggleLobbyAudio}
                toggleVideo={toggleLobbyVideo}
                meetingCode={getMeetingCode()}
            />
        );
    }

    return (
        <div className="h-screen bg-slate-900 flex">
            {/* Main Video Area */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowParticipants(!showParticipants)}
                            className="lg:hidden text-white hover:bg-slate-700"
                        >
                            <Users className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-semibold text-white">Meeting Room</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-slate-700">
                            <Settings className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-slate-700">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Video Grid or Whiteboard */}
                <div className="flex-1 relative bg-slate-900 min-h-0 overflow-hidden">
                    {isWhiteboardOpen ? (
                        /* Whiteboard View */
                        <div className="h-full p-4">
                            <Whiteboard 
                                socket={socketRef.current} 
                                roomId={window.location.href} 
                            />
                        </div>
                    ) : (
                        /* Video Layout - Grid or Speaker View */
                        <VideoLayout
                            localStream={localStream}
                            localVideoRef={localVideoRef}
                            peers={videos}
                            pinnedId={pinnedId}
                            setPinnedId={setPinnedId}
                            username={username}
                        />
                    )}

                    {/* Chat Modal */}
                    {showModal && (
                        <div className="absolute top-4 right-4 w-96 h-[500px] bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden flex flex-col">
                            {/* Header */}
                            <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                        <h3 className="font-semibold text-white">Live Chat</h3>
                                    </div>
                                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                        {messages.length} messages
                                    </Badge>
                                </div>
                            </div>
                            
                            {/* Messages */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {messages.length > 0 ? messages.map((item, index) => {
                                    const isCurrentUser = item.sender === username;
                                    return (
                                        <ChatBubble key={index} variant={isCurrentUser ? "sent" : "received"}>
                                            <ChatBubbleAvatar 
                                                fallback={item.sender?.charAt(0).toUpperCase() || 'U'}
                                            />
                                            <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                                <span className="text-xs text-slate-400 mb-1 px-1">{item.sender}</span>
                                                <ChatBubbleMessage variant={isCurrentUser ? "sent" : "received"}>
                                                    {item.data}
                                                </ChatBubbleMessage>
                                            </div>
                                        </ChatBubble>
                                    );
                                }) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <MessageCircle className="h-12 w-12 text-slate-600 mb-3" />
                                        <p className="text-slate-400 text-sm">No messages yet</p>
                                        <p className="text-slate-500 text-xs mt-1">Start the conversation!</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Input */}
                            <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                                    />
                                    <Button 
                                        onClick={sendMessage} 
                                        size="icon"
                                        className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 transition-all"
                                    >
                                        <Send className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Bar */}
                <div className="flex-shrink-0 bg-slate-800 border-t border-slate-700 p-4">
                    <div className="flex items-center justify-center space-x-4">
                        <Button
                            variant={audio ? "outline" : "destructive"}
                            size="icon"
                            onClick={handleAudio}
                            className="rounded-full h-12 w-12"
                        >
                            {audio ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                        </Button>

                        <Button
                            variant={video ? "outline" : "destructive"}
                            size="icon"
                            onClick={handleVideo}
                            className="rounded-full h-12 w-12"
                        >
                            {video ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        </Button>

                        {screenAvailable && (
                            <Button
                                variant={screen ? "destructive" : "outline"}
                                size="icon"
                                onClick={handleScreen}
                                className="rounded-full h-12 w-12"
                            >
                                {screen ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleChat}
                            className="rounded-full h-12 w-12 relative"
                        >
                            <MessageCircle className="h-5 w-5" />
                            {newMessages > 0 && (
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                    {newMessages}
                                </Badge>
                            )}
                        </Button>

                        {/* Whiteboard Toggle Button */}
                        <Button
                            variant={isWhiteboardOpen ? "default" : "outline"}
                            size="icon"
                            onClick={handleWhiteboard}
                            className="rounded-full h-12 w-12"
                            title={isWhiteboardOpen ? "Close Whiteboard" : "Open Whiteboard"}
                        >
                            <Pencil className="h-5 w-5" />
                        </Button>

                        <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleEndCall}
                            className="rounded-full h-12 w-12"
                        >
                            <PhoneOff className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Participants Dialog - Mobile */}
            <Dialog open={showParticipants && window.innerWidth < 1024} onOpenChange={setShowParticipants}>
                <DialogContent className="w-80 max-h-[80vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <Users className="mr-2 h-5 w-5" />
                            Participants ({participants.length})
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {participants.map((participant) => (
                            <div key={participant.socketId} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                                <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-blue-600 text-white">
                                        {participant.name[0]?.toUpperCase() || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                        {participant.name}
                                        {participant.isLocal && <span className="ml-2 text-xs text-slate-500">(You)</span>}
                                    </p>
                                </div>
                                <div className="flex space-x-1">
                                    {participant.isMuted && (
                                        <Badge variant="destructive" className="text-xs">
                                            <MicOff className="h-3 w-3 mr-1" />
                                        </Badge>
                                    )}
                                    {participant.isVideoOff && (
                                        <Badge variant="secondary" className="text-xs">
                                            <VideoOff className="h-3 w-3 mr-1" />
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* AI Sidebar - Collapsible sidebar with AI Assistant */}
            <AISidebar 
                socket={socketRef.current} 
                roomId={window.location.href} 
                username={username}
                participants={participants}
                onEndCall={handleEndCall}
            />
        </div>
    );
}