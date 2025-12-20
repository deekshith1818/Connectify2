import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes and socket manager
import userRoutes from "./routes/usersRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import meetingRoutes from "./routes/meetingRoutes.js";
import connectToSocket from "./controllers/socketManager.js";

dotenv.config();

const app = express();
const server = createServer(app);

app.set("port", process.env.PORT || 8000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Allowed Origins - Production and Development
const allowedOrigins = [
  // Production URLs
  "https://connectify-frontend-iota.vercel.app",
  "https://connectify2-nj9q.onrender.com",
  "https://connectify3.onrender.com",
  // Local development
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

// CORS setup
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // For development, you might want to allow all origins in development
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS with options
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Initialize Socket.IO
console.log("🔌 Initializing Socket.IO...");
const io = connectToSocket(server);
console.log("✅ Socket.IO initialized");

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Backend is running 🚀",
    timestamp: new Date().toISOString(),
    status: "healthy"
  });
});

// API routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/meetings", meetingRoutes);

// 404 handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path
  });
});

// Start server
const start = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error("❌ MONGODB_URI environment variable is not set!");
      console.error("   Please add MONGODB_URI to your .env file");
      process.exit(1);
    }

    console.log("📊 Connecting to MongoDB...");
    const connectionDb = await mongoose.connect(mongoUri);
    console.log(`✅ Database connected: ${connectionDb.connection.host}`);

    server.listen(app.get("port"), () => {
      console.log(`✅ Server running on port ${app.get("port")}`);
    });
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
};

start();