import { Schema } from 'mongoose';
import mongoose from 'mongoose';

const meetingSchema = new Schema({
    meetingCode: {
        type: String,
        required: true,
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

// Compound index for faster lookups
meetingSchema.index({ meetingCode: 1, isActive: 1 });

const Meeting = mongoose.model("Meeting", meetingSchema);
export { Meeting };