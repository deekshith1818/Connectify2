import { Server } from 'socket.io';
import { deactivateMeeting } from './meeting.controller.js';

let messages = {};
let connections = {};
let timeOnline = {};

const connectToSocket = (server) => {
    // CORS configuration
    const allowedOrigins = [
        "https://connectify2-nj9q.onrender.com",
        "https://connectify3.onrender.com",
        "https://connectify2-jhtb.onrender.com",
        "https://connectify2-cyxk.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000"
    ];

    // Create Socket.IO server - IMPORTANT: pass server object properly
    const io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        },
        transports: ["websocket", "polling"]
    });

    io.on("connection", (socket) => {
        console.log("✅ New client connected:", socket.id);

        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = Date.now();

            // Join socket.io room for whiteboard functionality
            socket.join(path);

            for (const id of connections[path]) {
                io.to(id).emit("user-joined", socket.id, connections[path]);
            }

            if (messages[path] !== undefined) {
                for (let a = 0; a < messages[path].length; a++) {
                    io.to(socket.id).emit("chat-message",
                        messages[path][a]['data'],
                        messages[path][a]['sender'],
                        messages[path][a]['socket-id-sender']
                    );
                }
            }
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            const [matchingRoom, found] = Object.entries(connections)
                .reduce(([room, isFound], [roomKey, roomValue]) => {
                    if (!isFound && roomValue.includes(socket.id)) {
                        return [roomKey, true];
                    }
                    return [room, isFound];
                }, ["", false]);

            if (found === true) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }

                messages[matchingRoom].push({
                    'sender': sender,
                    "data": data,
                    "socket-id-sender": socket.id
                });

                console.log("💬 Message in", matchingRoom, ":", sender, data);

                connections[matchingRoom].forEach((ele) => {
                    io.to(ele).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        // ========== WHITEBOARD EVENTS ==========

        // Handle drawing - broadcast to all other users in the room
        socket.on("draw-line", (data) => {
            const { roomId, prevPoint, currentPoint, color, width } = data;
            console.log("🎨 Drawing in room:", roomId);
            socket.to(roomId).emit("draw-line", { prevPoint, currentPoint, color, width });
        });

        // Handle canvas clear - broadcast to all users in the room
        socket.on("clear-canvas", ({ roomId }) => {
            console.log("🗑️ Clearing canvas in room:", roomId);
            socket.to(roomId).emit("clear-canvas");
        });

        // Handle whiteboard toggle - sync state across participants
        socket.on("toggle-whiteboard", ({ roomId, isOpen }) => {
            console.log("📋 Whiteboard toggled in room:", roomId, "isOpen:", isOpen);
            socket.to(roomId).emit("toggle-whiteboard", { isOpen });
        });

        socket.on("disconnect", () => {
            const diffTime = Math.abs(timeOnline[socket.id] - Date.now());
            console.log("❌ User disconnected:", socket.id, "Time online:", diffTime + "ms");

            let key;
            for (const [k, v] of Object.entries(connections)) {
                for (let a = 0; a < v.length; a++) {
                    if (v[a] === socket.id) {
                        key = k;
                        for (let i = 0; i < connections[key].length; i++) {
                            io.to(connections[key][i]).emit("user-left", socket.id);
                        }
                        const index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);

                        // Room is empty - deactivate meeting in database
                        if (connections[key].length === 0) {
                            console.log("🔒 Room empty, deactivating meeting:", key);
                            deactivateMeeting(key);
                            delete connections[key];
                        }
                        break;
                    }
                }
                if (key) break;
            }

            delete timeOnline[socket.id];
        });
    });

    return io;
};

export default connectToSocket;