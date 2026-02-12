import cron from 'node-cron';
import { Meeting } from '../models/meeting.model.js';
import { sendReminderEmail } from './emailService.js';

/**
 * Cron Job Service for Connectify
 * Handles scheduled tasks like meeting reminders
 */

/**
 * Start the meeting reminder cron job
 * Runs every minute and checks for meetings starting in 9-11 minutes
 */
export const startReminderCron = () => {
    console.log('🕐 Starting meeting reminder cron job...');

    // Run every minute: '* * * * *'
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();

            // Calculate the time window (9-11 minutes from now)
            const nineMinutesFromNow = new Date(now.getTime() + 9 * 60 * 1000);
            const elevenMinutesFromNow = new Date(now.getTime() + 11 * 60 * 1000);

            // Find meetings that:
            // 1. Start between 9-11 minutes from now
            // 2. Haven't had their reminder sent yet
            // 3. Are in 'scheduled' status
            const meetingsToRemind = await Meeting.find({
                startTime: {
                    $gte: nineMinutesFromNow,
                    $lte: elevenMinutesFromNow
                },
                reminderSent: false,
                status: 'scheduled'
            });

            if (meetingsToRemind.length > 0) {
                console.log(`📬 Found ${meetingsToRemind.length} meeting(s) needing reminders`);

                for (const meeting of meetingsToRemind) {
                    console.log(`📧 Sending reminder for meeting: ${meeting.meetingCode}`);

                    // Send reminder email
                    const result = await sendReminderEmail(meeting);

                    if (result.success) {
                        // Mark reminder as sent to prevent duplicates
                        await Meeting.findByIdAndUpdate(meeting._id, {
                            reminderSent: true
                        });
                        console.log(`✅ Reminder sent and marked for meeting: ${meeting.meetingCode}`);
                    } else {
                        console.error(`❌ Failed to send reminder for meeting: ${meeting.meetingCode}`);
                    }
                }
            }
            // Silent when no meetings to remind (runs every minute)

        } catch (error) {
            console.error('❌ Cron job error:', error.message);
        }
    });

    console.log('✅ Meeting reminder cron job started (runs every minute)');
};

export default { startReminderCron };
