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
  LogOut
} from 'lucide-react';
import server from '../environment';

const server_url = `${server}`;
let connections = {};

const peerConfigConnections = {
    "iceServers": [
        {
            "urls": "stun:stun.l.google.com:19302"
        }
    ]
}

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
            } catch (e) {
                console.log("Video not available:", e);
                setVideoAvailable(false);
            }

            // Test audio permission
            try {
                const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioPermission.getTracks().forEach(track => track.stop());
                setAudioAvailable(true);
            } catch (e) {
                console.log("Audio not available:", e);
                setAudioAvailable(false);
            }

            // Check screen share availability
            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

        } catch (error) {
            console.log("Error getting permissions:", error);
        }
    }, []);

    // Get user media stream
    const getUserMedia = useCallback(async () => {
        try {
            // Stop existing tracks
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }

            let stream;
            if ((video && videoAvailable) || (audio && audioAvailable)) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: video && videoAvailable,
                    audio: audio && audioAvailable
                });
            } else {
                // Create black silence stream
                let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
                stream = blackSilence();
            }

            window.localStream = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            // Update peer connections
            for (let id in connections) {
                if (id === socketIdRef.current) continue;
                
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
                });

                // Create offer
                const description = await connections[id].createOffer();
                await connections[id].setLocalDescription(description);
                socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
            }

            // Handle track ended
            stream.getTracks().forEach(track => {
                track.onended = () => {
                    setVideo(false);
                    setAudio(false);
                    getUserMedia();
                };
            });

        } catch (error) {
            console.error("Error accessing media devices:", error);
        }
    }, [video, audio, videoAvailable, audioAvailable, black, silence]);

    // Get display media for screen sharing
    const getDisplayMedia = useCallback(async () => {
        if (screen && navigator.mediaDevices.getDisplayMedia) {
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
                
                // Stop existing tracks
                if (window.localStream) {
                    window.localStream.getTracks().forEach(track => track.stop());
                }

                window.localStream = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }

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
                        setScreen(false);
                        getUserMedia();
                    };
                });

            } catch (error) {
                console.log("Error sharing screen:", error);
                setScreen(false);
            }
        }
    }, [screen, getUserMedia]);

    // Handle signaling messages
    const gotMessageFromServer = useCallback(async (fromId, message) => {
        const signal = JSON.parse(message);
        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                try {
                    await connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp));
                    if (signal.sdp.type === "offer") {
                        const description = await connections[fromId].createAnswer();
                        await connections[fromId].setLocalDescription(description);
                        socketRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }));
                    }
                } catch (e) {
                    console.log("Error handling SDP:", e);
                }
            }
            if (signal.ice) {
                try {
                    await connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
                } catch (e) {
                    console.log("Error adding ICE candidate:", e);
                }
            }
        }
    }, []);

    // Connect to socket server
    const connectToSocketServer = useCallback(() => {
        const isSecure = server_url.startsWith('https');
        socketRef.current = io.connect(server_url, { 
            secure: isSecure,
            rejectUnauthorized: false,
            transports: ['websocket', 'polling']
        });
        
        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });
        
        socketRef.current.on('signal', gotMessageFromServer);
        
        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);
            socketIdRef.current = socketRef.current.id;
            
            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("user-left", (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                setParticipants((participants) => participants.filter((p) => p.socketId !== id));
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            socketRef.current.on("user-joined", (id, clients) => {
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
                        connections[socketListId] = new RTCPeerConnection(peerConfigConnections);
                        
                        connections[socketListId].onicecandidate = (event) => {
                            if (event.candidate !== null) {
                                socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate }));
                            }
                        };

                        connections[socketListId].ontrack = (event) => {
                            const remoteStream = event.streams[0];
                            setVideos(videos => {
                                const videoExists = videos.find(video => video.socketId === socketListId);
                                if (videoExists) {
                                    return videos.map(video =>
                                        video.socketId === socketListId
                                            ? { ...video, stream: remoteStream }
                                            : video
                                    );
                                } else {
                                    const newVideo = {
                                        socketId: socketListId,
                                        stream: remoteStream,
                                        autoPlay: true,
                                        playsInline: true
                                    };
                                    return [...videos, newVideo];
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

                        if (window.localStream) {
                            window.localStream.getTracks().forEach(track => {
                                connections[socketListId].addTrack(track, window.localStream);
                            });
                        }
                    }
                });

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue;

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }));
                                })
                                .catch(e => console.log(e));
                        });
                    }
                }
            });
        });
    }, [gotMessageFromServer, username, audio, video]);

    // Initialize media and connect
    const getMedia = useCallback(() => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }, [videoAvailable, audioAvailable, connectToSocketServer]);

    // Send chat message
    const sendMessage = useCallback(() => {
        if (message.trim() && socketRef.current) {
            socketRef.current.emit('chat-message', message, username);
            setMessage("");
        }
    }, [message, username]);

    // Handle end call
    const handleEndCall = useCallback(() => {
        try {
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
            }
            for (let id in connections) {
                connections[id].close();
            }
            connections = {};
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        } catch (e) {
            console.log("Error ending call:", e);
        }
        window.location.href = "/home";
    }, []);

    // Add message to chat
    const addMessage = useCallback((data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        } 
    }, []);

    // Connect to meeting
    const connect = useCallback(() => {
        if (username.trim()) {
            setAskForUsername(false);
            getMedia();
        }
    }, [username, getMedia]);

    // Toggle video
    const handleVideo = useCallback(() => {
        setVideo(!video);
        setParticipants(prev => prev.map(p => 
            p.isLocal ? { ...p, isVideoOff: !video } : p
        ));
    }, [video]);

    // Toggle audio
    const handleAudio = useCallback(() => {
        setAudio(!audio);
        setParticipants(prev => prev.map(p => 
            p.isLocal ? { ...p, isMuted: !audio } : p
        ));
    }, [audio]);

    // Toggle screen sharing
    const handleScreen = useCallback(() => {
        setScreen(!screen);
    }, [screen]);

    // Toggle chat modal
    const toggleChat = useCallback(() => {
        setModal(!showModal);
        if (!showModal) {
            setNewMessages(0);
        }
    }, [showModal]);

    // Handle Enter key in message input
    const handleKeyPress = useCallback((e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    }, [sendMessage]);

    // Effects
    useEffect(() => {
        getPermissions();
    }, [getPermissions]);

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [video, audio, getUserMedia]);

    useEffect(() => {
        if (screen !== undefined) {
            getDisplayMedia();
        }
    }, [screen, getDisplayMedia]);

    if (askForUsername) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">Join Meeting</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Your Name</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && connect()}
                                placeholder="Enter your name"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <Button 
                            onClick={connect} 
                            disabled={!username.trim()}
                            className="w-full"
                        >
                            Join Meeting
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-900 flex">
            {/* Participants Sidebar - Desktop */}
            <div className={`hidden lg:block w-80 bg-slate-800 border-r border-slate-700 ${showParticipants ? 'block' : 'hidden'}`}>
                <div className="p-4 border-b border-slate-700">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        Participants ({participants.length})
                    </h3>
                </div>
                <div className="p-4 space-y-3 max-h-[calc(100vh-80px)] overflow-y-auto">
                    {participants.map((participant, index) => (
                        <div key={participant.socketId} className="flex items-center space-x-3 p-3 rounded-lg bg-slate-700/50">
                            <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-blue-600 text-white">
                                    {participant.name[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {participant.name}
                                    {participant.isLocal && <span className="ml-2 text-xs text-slate-400">(You)</span>}
                                </p>
                            </div>
                            <div className="flex space-x-1">
                                {participant.isMuted && (
                                    <Badge variant="destructive" className="text-xs">
                                        <MicOff className="h-3 w-3 mr-1" />
                                        Muted
                                    </Badge>
                                )}
                                {participant.isVideoOff && (
                                    <Badge variant="secondary" className="text-xs">
                                        <VideoOff className="h-3 w-3 mr-1" />
                                        Video Off
                                    </Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-slate-800 border-b border-slate-700 p-4 flex items-center justify-between">
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

                {/* Video Grid */}
                <div className="flex-1 relative bg-slate-900 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 h-full">
                        {/* Local Video */}
                        <div className="relative bg-slate-800 rounded-xl overflow-hidden">
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-2 py-1">
                                <span className="text-white text-sm">{username} (You)</span>
                            </div>
                        </div>

                        {/* Remote Videos */}
                        {videos.map((video) => (
                            <div key={video.socketId} className="relative bg-slate-800 rounded-xl overflow-hidden">
                                <video
                                    data-socket={video.socketId}
                                    ref={(ref) => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 left-2 bg-black/50 rounded-lg px-2 py-1">
                                    <span className="text-white text-sm">User {video.socketId.slice(-4)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chat Modal */}
                    {showModal && (
                        <div className="absolute top-4 right-4 w-80 h-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                                <h3 className="font-semibold text-slate-900 dark:text-white">Chat</h3>
                            </div>
                            <div className="p-4 h-64 overflow-y-auto space-y-3">
                                {messages.length > 0 ? messages.map((item, index) => (
                                    <div key={index} className="space-y-1">
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{item.sender}</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">{item.data}</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No messages yet</p>
                                )}
                            </div>
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button onClick={sendMessage} size="sm">
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Control Bar */}
                <div className="bg-slate-800 border-t border-slate-700 p-4">
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
        </div>
    );
}