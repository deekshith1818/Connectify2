import React, { useEffect, useRef, useState, useCallback } from 'react'
import TextField from '@mui/material/TextField';
import { io } from "socket.io-client";
import styles from "../styles/VideoComponent.module.css";
import { Badge } from '@mui/material';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
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
                setAudioAvailable(false);
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
        socketRef.current = io.connect(server_url, { secure: false });
        socketRef.current.on('signal', gotMessageFromServer);
        
        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);
            socketIdRef.current = socketRef.current.id;
            
            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("user-left", (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id));
                if (connections[id]) {
                    connections[id].close();
                    delete connections[id];
                }
            });

            socketRef.current.on("user-joined", (id, clients) => {
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
    }, [gotMessageFromServer]);

    // Initialize media and connect
    const getMedia = useCallback(() => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }, [videoAvailable, audioAvailable, connectToSocketServer]);

    // Send chat message - FIXED: Only emit to server, don't add to local state
    const sendMessage = useCallback(() => {
        if (message.trim() && socketRef.current) {
            // Only emit to server - the server will broadcast back to all clients including sender
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

    // Add message to chat - FIXED: Add all messages from server (including own)
    const addMessage = useCallback((data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        // Only increment new message counter for messages from other users
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
    }, [video]);

    // Toggle audio
    const handleAudio = useCallback(() => {
        setAudio(!audio);
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

    return (
        <div>
            {askForUsername ? (
                <div>
                    <h2>Enter into lobby</h2>
                    <TextField 
                        id="outlined-basic" 
                        label="Username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && connect()}
                    />
                    <Button variant='contained' onClick={connect} disabled={!username.trim()}>
                        Connect
                    </Button>
                    <div>
                        <video ref={localVideoRef} autoPlay muted></video>
                    </div>
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>
                    {showModal && (
                        <div className={styles.chatRoom}>
                            <div className={styles.chatContainer}>
                                <h1>Chat</h1>
                                <div className={styles.chattingDisplay}>
                                    {messages.length !== 0 ? messages.map((item, index) => (
                                        <div style={{ marginBottom: "20px" }} key={index}>
                                            <p style={{ fontWeight: "bold" }}>{item.sender}</p>
                                            <p>{item.data}</p>
                                        </div>
                                    )) : <p>No Messages Yet</p>}
                                </div>
                                <div className={styles.chattingArea}>
                                    <TextField 
                                        value={message} 
                                        onChange={(e) => setMessage(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        id="outlined-basic" 
                                        label="Enter Your chat" 
                                        variant="outlined" 
                                    />
                                    <Button variant='contained' onClick={sendMessage}>
                                        Send
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.buttonContainers}>
                        <IconButton onClick={handleVideo} style={{color:"white"}}>
                            {video ? <VideocamIcon/> : <VideocamOffIcon/>}
                        </IconButton>
                        <IconButton onClick={handleEndCall} style={{color:"red"}}>
                            <CallEndIcon/>
                        </IconButton>
                        <IconButton onClick={handleAudio} style={{color:"white"}}>
                            {audio ? <MicIcon/> : <MicOffIcon/>}
                        </IconButton>
                        {screenAvailable && (
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </IconButton>
                        )}
                        <Badge badgeContent={newMessages} max={999} color='secondary'>
                            <IconButton onClick={toggleChat} style={{ color: "white" }}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoRef} autoPlay muted></video>

                    {videos.map((video) => (
                        <div className={styles.conferenceView} key={video.socketId}>
                            <h2>{video.socketId}</h2>
                            <video
                                data-socket={video.socketId}
                                ref={(ref) => {
                                    if (ref && video.stream) {
                                        ref.srcObject = video.stream;
                                    }
                                }}
                                autoPlay
                                playsInline
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}