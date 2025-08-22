    import express from "express";
    import { createServer } from "node:http";

    import { Server } from "socket.io"

    import mongoose from "mongoose";
    import cors from "cors";
    import dotenv from "dotenv";
    import connectToSocket from "./controllers/socketManager.js";
    import userRoutes from "./routes/usersRoutes.js";
    dotenv.config();

    const app = express();
    const server = createServer(app);
    const io = connectToSocket(server);
    app.set("port", process.env.PORT || 8000)

   
    app.use(express.json({ limit: "50mb" }));

    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // CORS configuration - allow both production and development origins
    const allowedOrigins = [
        "https://connectify2-nj9q.onrender.com",
        "https://connectify3.onrender.com", 
        "http://localhost:5173", // Vite dev server
        "http://localhost:3000"  // Alternative dev port
    ];

    app.use(cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }));

    app.use("/api/v1/users", userRoutes);

    const start = async () => {
        const mongoUri = process.env.MONGODB_URI || "mongodb+srv://root:KhVys0W5Yp4RNhuB@cluster0.ijjgfjy.mongodb.net/zoom";
        const connectionDb = await mongoose.connect(mongoUri);
        console.log(`Database connected successfully : ${connectionDb.connection.host}`);
        server.listen(app.get("port"), () => {
            console.log(`Server is running on port ${app.get("port")}`);
        })
    }

    start();