import httpStatus from "http-status";
import { OAuth2Client } from "google-auth-library";
import { User } from "../models/user.model.js";
import crypto from "crypto";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and handle user authentication
 * - If user exists with same email, link Google account
 * - If user doesn't exist, create new user
 */
export const googleAuth = async (req, res) => {
    const { credential } = req.body;

    if (!credential) {
        return res.status(400).json({ message: "Google credential is required" });
    }

    try {
        // Verify the Google ID token
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        if (!email) {
            return res.status(400).json({ message: "Email not provided by Google" });
        }

        // Check if user exists with this email
        let user = await User.findOne({ email });

        if (user) {
            // User exists - link Google account if not already linked
            if (!user.googleId) {
                user.googleId = googleId;
                console.log(`📎 Linked Google account to existing user: ${email}`);
            }
        } else {
            // Check if user exists with this googleId (edge case)
            user = await User.findOne({ googleId });

            if (!user) {
                // Create new user with Google credentials
                // Generate unique username from email
                const baseUsername = email.split('@')[0];
                let username = baseUsername;
                let counter = 1;

                // Ensure username is unique
                while (await User.findOne({ username })) {
                    username = `${baseUsername}_${counter}`;
                    counter++;
                }

                user = new User({
                    name: name || email.split('@')[0],
                    username,
                    email,
                    googleId,
                    authMethod: 'google',
                    // No password for Google-only users
                });
                console.log(`🆕 Created new Google user: ${email}`);
            }
        }

        // Generate session token (same as local login)
        const token = crypto.randomBytes(20).toString("hex");
        user.token = token;
        await user.save();

        console.log(`✅ Google auth successful for: ${email}`);

        return res.status(httpStatus.OK).json({
            token: token,
            user: {
                name: user.name,
                username: user.username,
                email: user.email,
                authMethod: user.authMethod,
                hasPassword: !!user.password
            }
        });

    } catch (error) {
        console.error("❌ Google auth error:", error);

        if (error.message?.includes('Token used too late') || error.message?.includes('Token used too early')) {
            return res.status(401).json({ message: "Google token expired. Please try again." });
        }

        if (error.message?.includes('Invalid token')) {
            return res.status(401).json({ message: "Invalid Google token" });
        }

        return res.status(500).json({ message: "Google authentication failed" });
    }
};
