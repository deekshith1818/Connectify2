import { Schema } from 'mongoose';
import mongoose from 'mongoose';

const meetingSchema = new Schema({
    meetingCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    hostId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false  // Make optional for backward compatibility
    },
    // Keep old field for backward compatibility with existing data
    user_id: {
        type: String,
        required: false
    },
    // Meeting title/subject
    title: {
        type: String,
        default: 'Untitled Meeting'
    },
    // Scheduling fields
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date,
        default: null
    },
    // Meeting status
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed'],
        default: 'active'
    },
    // Participant tracking
    participantCount: {
        type: Number,
        default: 0
    },
    // Email participants for notifications
    participants: [{
        type: String  // Array of email addresses
    }],
    // Flag to prevent duplicate reminder emails
    reminderSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Also support old 'date' field name
    date: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

// Compound indexes for faster lookups
meetingSchema.index({ meetingCode: 1, isActive: 1 });
meetingSchema.index({ hostId: 1, startTime: -1 });
meetingSchema.index({ hostId: 1, status: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);
export { Meeting };