import crypto from 'crypto';
import httpStatus from 'http-status';
import { Meeting } from '../models/meeting.model.js';
import { User } from '../models/user.model.js';

/**
 * Start a new meeting (Host creates room)
 * @route POST /api/v1/meetings/start
 * @access Protected (requires auth)
 */
const startMeeting = async (req, res) => {
    console.log("🚀 Debug: Start Meeting initiated...");
    console.log("🔐 Debug: req.user =", req.user);

    try {
        // Step 1: Check Auth Token Content
        const username = req.user?.username || req.user?.userId || req.user;

        if (!username) {
            console.error("❌ Error: No username found in req.user. Token might be invalid.");
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Invalid Authentication: No user data in token"
            });
        }

        console.log(`🔍 Debug: Looking up user '${username}' in DB...`);

        // Step 2: Get the Real User ID from Database
        const user = await User.findOne({ username: username });

        if (!user) {
            console.error(`❌ Error: User '${username}' not found in database.`);
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "User account not found"
            });
        }

        console.log(`✅ Debug: User found. ID: ${user._id}, Type: ${typeof user._id}`);

        // Step 3: Generate Meeting Code
        const meetingCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        console.log(`🔢 Debug: Generated code: ${meetingCode}`);

        // Step 4: Check for uniqueness
        const existingMeeting = await Meeting.findOne({ meetingCode });
        if (existingMeeting) {
            console.log("⚠️ Debug: Code already exists, regenerating...");
            const newCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            return res.status(httpStatus.CREATED).json({
                success: true,
                meetingCode: newCode
            });
        }

        // Step 5: Create and Save Meeting
        console.log("💾 Debug: Creating meeting document...");
        const newMeeting = new Meeting({
            meetingCode: meetingCode,
            hostId: user._id, // Assign the ObjectId, NOT the string username
            isActive: true
        });

        console.log("💾 Debug: Meeting object:", JSON.stringify(newMeeting, null, 2));
        console.log("💾 Debug: Saving meeting to MongoDB...");

        await newMeeting.save();

        console.log(`✅ Success: Meeting ${meetingCode} saved successfully!`);

        return res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Meeting created successfully',
            meetingCode
        });

    } catch (error) {
        console.error("🔥 CRITICAL SERVER ERROR 🔥");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Full error:", error);

        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Validate if a meeting exists and is active
 * @route GET /api/v1/meetings/validate/:meetingCode
 * @access Public
 */
const validateMeeting = async (req, res) => {
    try {
        const { meetingCode } = req.params;

        if (!meetingCode) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Meeting code is required'
            });
        }

        // Find active meeting with this code
        const meeting = await Meeting.findOne({
            meetingCode: meetingCode.toUpperCase(),
            isActive: true
        });

        if (!meeting) {
            console.log(`❌ Invalid meeting code: ${meetingCode}`);
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: 'Invalid or expired meeting code'
            });
        }

        console.log(`✅ Valid meeting code: ${meetingCode}`);
        return res.status(httpStatus.OK).json({
            success: true,
            message: 'Meeting is valid and active',
            meetingCode: meeting.meetingCode
        });

    } catch (error) {
        console.error('❌ Error validating meeting:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to validate meeting',
            error: error.message
        });
    }
};

/**
 * Deactivate a meeting (called when room is empty)
 * @param {string} meetingCode - The meeting code to deactivate
 */
const deactivateMeeting = async (meetingCode) => {
    try {
        // Extract meeting code from URL path if full URL is passed
        const code = meetingCode.includes('/')
            ? meetingCode.split('/').pop()
            : meetingCode;

        const result = await Meeting.findOneAndUpdate(
            { meetingCode: code.toUpperCase(), isActive: true },
            { isActive: false },
            { new: true }
        );

        if (result) {
            console.log(`🔒 Meeting deactivated: ${code}`);
        }
        return result;
    } catch (error) {
        console.error('❌ Error deactivating meeting:', error);
        return null;
    }
};

export { startMeeting, validateMeeting, deactivateMeeting };
