import { User } from "../models/user.model.js";

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.query.token || 
                     req.body.token;

        if (!token) {
            return res.status(401).json({ message: "Authentication token required" });
        }

        const user = await User.findOne({ token: token });
        if (!user) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        // Add user to request object for use in route handlers
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: "Authentication error" });
    }
};
