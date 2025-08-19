import { Server } from 'socket.io';

let messages = {};
let connections = {};
let timeOnline = {};

const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", 
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("join-call", (path) => {
            if (connections[path] === undefined) {
                connections[path] = [];
            }
            connections[path].push(socket.id);
            timeOnline[socket.id] = Date.now();

            for (const id of connections[path]) {
                io.to(id).emit("user-joined", socket.id, connections[path]);
            }

            // Fixed typo: 'mesages' -> 'messages'
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
                // Fixed: Don't reset messages array to empty
                // messages[matchingRoom] = []; // <-- This was clearing all previous messages!
                
                messages[matchingRoom].push({
                    'sender': sender,
                    "data": data,
                    "socket-id-sender": socket.id
                });
                
                console.log("message", matchingRoom, ":", sender, data);
                
                connections[matchingRoom].forEach((ele) => {
                    io.to(ele).emit("chat-message", data, sender, socket.id);
                });
            }
        });
        
        socket.on("disconnect", () => {
            var diffTime = Math.abs(timeOnline[socket.id] - Date.now());
            console.log("User disconnected:", socket.id, "Time online:", diffTime + "ms");

            var key;
            for (const [k, v] of Object.entries(connections)) {
                for (let a = 0; a < v.length; a++) {
                    if (v[a] === socket.id) {
                        key = k;
                        // Notify other users that this user left
                        for (let i = 0; i < connections[key].length; i++) {
                            io.to(connections[key][i]).emit("user-left", socket.id);
                        }
                        // Remove user from connections
                        var index = connections[key].indexOf(socket.id);
                        connections[key].splice(index, 1);
                        
                        // Clean up empty room
                        if (connections[key].length === 0) {
                            delete connections[key];
                            // Optionally clean up messages for empty rooms
                            // delete messages[key];
                        }
                        break; // Exit inner loop once user is found and removed
                    }
                }
                if (key) break; // Exit outer loop if user was found
            }
            
            // Clean up timeOnline
            delete timeOnline[socket.id];
        });
    });

    return io;
};

export default connectToSocket;