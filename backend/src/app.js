import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes and socket manager
import userRoutes from "./routes/usersRoutes.js";
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

// Allowed Origins
const allowedOrigins = [
  "https://connectify2-nj9q.onrender.com",
  "https://connectify3.onrender.com", 
  "https://connectify2-jhtb.onrender.com",
  "https://connectify2-cyxk.onrender.com",
  "http://localhost:5173", 
  "http://localhost:3000",
  "https://connectify-frontend-d62v0shob-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-2p5geygxe-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-ijuffjl3v-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-1l53a45hw-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-jf8gzlm9x-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-lfpo0ycx3-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-9baqn7a5n-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-cwtvwzw9b-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-4o7f2y4t8-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-f7ybif8d2-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-fkjp7t4z1-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-i3fvukxvh-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-oqiuc56up-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-iv258fm4b-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-h7qnj1y0i-deekshith-nanavenis-projects.vercel.app",
  "https://connectify-frontend-iota.vercel.app",
];

// CORS setup
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept", "Origin"],
  credentials: true
}));

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
    const mongoUri = process.env.MONGODB_URI 
      || "mongodb+srv://root:KhVys0W5Yp4RNhuB@cluster0.ijjgfjy.mongodb.net/zoom";
    
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