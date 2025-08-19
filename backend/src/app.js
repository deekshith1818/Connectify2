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
    app.set("port", 8000)

   
    app.use(express.json({ limit: "50mb" }));

    app.use(express.urlencoded({ limit: "50mb", extended: true }));


    app.use(cors({
    origin: "https://connectify2-nj9q.onrender.com", // allow only your frontend
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    }));
    app.use("/api/v1/users", userRoutes);
    const start = async () => {
        const connectionDb = await mongoose.connect("mongodb+srv://root:KhVys0W5Yp4RNhuB@cluster0.ijjgfjy.mongodb.net/zoom");
        console.log(`Database connected successfully : ${connectionDb.connection.host}`);
        server.listen(app.get("port"), () => {
            console.log("Server is running on port 8000");
        })
    }

    start();