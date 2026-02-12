import crypto from 'crypto';
import httpStatus from 'http-status';
import { Meeting } from '../models/meeting.model.js';
import { User } from '../models/user.model.js';
import { sendInviteEmail } from '../services/emailService.js';

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
            isActive: true,
            status: 'active',
            startTime: new Date()
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
            {
                isActive: false,
                status: 'completed',
                endTime: new Date()
            },
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

/**
 * Get meeting statistics for the current user
 * @route GET /api/v1/meetings/stats
 * @access Protected
 */
const getMeetingStats = async (req, res) => {
    try {
        const username = req.user?.username || req.user?.userId || req.user;

        if (!username) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required"
            });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        // Get start of current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // MongoDB Aggregation for stats
        const stats = await Meeting.aggregate([
            {
                $match: {
                    hostId: user._id,
                    startTime: { $gte: startOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    totalMeetings: { $sum: 1 },
                    totalParticipants: { $sum: '$participantCount' },
                    totalDurationMs: {
                        $sum: {
                            $cond: [
                                { $and: [{ $ne: ['$endTime', null] }, { $ne: ['$startTime', null] }] },
                                { $subtract: ['$endTime', '$startTime'] },
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Get all-time participant count
        const allTimeStats = await Meeting.aggregate([
            { $match: { hostId: user._id } },
            { $group: { _id: null, totalParticipants: { $sum: '$participantCount' } } }
        ]);

        const result = stats[0] || { totalMeetings: 0, totalParticipants: 0, totalDurationMs: 0 };
        const allTimeParticipants = allTimeStats[0]?.totalParticipants || 0;

        // Convert milliseconds to hours
        const totalHours = (result.totalDurationMs / (1000 * 60 * 60)).toFixed(1);

        console.log(`📊 Stats for ${username}:`, {
            totalMeetings: result.totalMeetings,
            totalParticipants: allTimeParticipants,
            totalHours
        });

        return res.status(httpStatus.OK).json({
            success: true,
            stats: {
                totalMeetings: result.totalMeetings,
                totalParticipants: allTimeParticipants,
                totalHours: parseFloat(totalHours)
            }
        });

    } catch (error) {
        console.error('❌ Error getting meeting stats:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get meeting statistics',
            error: error.message
        });
    }
};

/**
 * Schedule a future meeting
 * @route POST /api/v1/meetings/schedule
 * @access Protected
 */
const scheduleMeeting = async (req, res) => {
    try {
        const { title, startTime, participants } = req.body;
        const username = req.user?.username || req.user?.userId || req.user;

        if (!username) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required"
            });
        }

        if (!startTime) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Start time is required"
            });
        }

        // Validate start time is in the future
        const scheduledTime = new Date(startTime);
        if (scheduledTime <= new Date()) {
            return res.status(httpStatus.BAD_REQUEST).json({
                success: false,
                message: "Start time must be in the future"
            });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        // Generate unique meeting code
        let meetingCode;
        let isUnique = false;
        while (!isUnique) {
            meetingCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            const existing = await Meeting.findOne({ meetingCode });
            if (!existing) isUnique = true;
        }

        // Create scheduled meeting
        const newMeeting = new Meeting({
            meetingCode,
            hostId: user._id,
            title: title || 'Scheduled Meeting',
            startTime: scheduledTime,
            status: 'scheduled',
            isActive: false, // Not active until meeting starts
            participants: participants || [], // Email addresses for notifications
            reminderSent: false
        });

        await newMeeting.save();

        console.log(`📅 Meeting scheduled: ${meetingCode} for ${scheduledTime}`);

        // Send invite emails to all participants with host info
        if (participants && participants.length > 0) {
            console.log(`📧 Sending invite emails to ${participants.length} participant(s)...`);
            const hostInfo = {
                name: user.name,
                email: user.email || null,
                username: user.username
            };
            const emailResult = await sendInviteEmail(newMeeting, hostInfo);
            console.log(`📧 Invite email result:`, emailResult.success ? 'Sent!' : emailResult.message);
        }

        return res.status(httpStatus.CREATED).json({
            success: true,
            message: 'Meeting scheduled successfully',
            meeting: {
                meetingCode: newMeeting.meetingCode,
                title: newMeeting.title,
                startTime: newMeeting.startTime,
                status: newMeeting.status,
                participants: newMeeting.participants
            }
        });

    } catch (error) {
        console.error('❌ Error scheduling meeting:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to schedule meeting',
            error: error.message
        });
    }
};

/**
 * Get recent meetings for the current user
 * @route GET /api/v1/meetings/recent
 * @access Protected
 */
const getRecentMeetings = async (req, res) => {
    try {
        const username = req.user?.username || req.user?.userId || req.user;

        if (!username) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                success: false,
                message: "Authentication required"
            });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                success: false,
                message: "User not found"
            });
        }

        // Get last 5 meetings sorted by startTime descending
        const meetings = await Meeting.find({ hostId: user._id })
            .sort({ startTime: -1 })
            .limit(5)
            .select('meetingCode title startTime endTime status participantCount');

        // Format the response
        const formattedMeetings = meetings.map(meeting => {
            let duration = 'N/A';
            if (meeting.startTime && meeting.endTime) {
                const durationMs = meeting.endTime - meeting.startTime;
                const minutes = Math.floor(durationMs / (1000 * 60));
                if (minutes >= 60) {
                    const hours = Math.floor(minutes / 60);
                    const remainingMins = minutes % 60;
                    duration = remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
                } else {
                    duration = `${minutes}m`;
                }
            } else if (meeting.status === 'scheduled') {
                duration = 'Scheduled';
            } else if (meeting.status === 'active') {
                duration = 'In Progress';
            }

            return {
                meetingCode: meeting.meetingCode,
                title: meeting.title || 'Untitled Meeting',
                date: meeting.startTime,
                duration,
                status: meeting.status,
                participantCount: meeting.participantCount || 0
            };
        });

        console.log(`📋 Recent meetings for ${username}:`, formattedMeetings.length);

        return res.status(httpStatus.OK).json({
            success: true,
            meetings: formattedMeetings
        });

    } catch (error) {
        console.error('❌ Error getting recent meetings:', error);
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get recent meetings',
            error: error.message
        });
    }
};

export {
    startMeeting,
    validateMeeting,
    deactivateMeeting,
    getMeetingStats,
    scheduleMeeting,
    getRecentMeetings
};
