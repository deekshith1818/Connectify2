import Brevo from '@getbrevo/brevo';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email Service for Connectify
 * Uses Brevo SDK for reliable email sending
 * 
 * Required environment variables:
 * - BREVO_API_KEY (your Brevo API key from API Keys tab)
 * - SENDER_EMAIL (verified sender email in Brevo)
 * - SENDER_NAME (display name, e.g., "Connectify")
 * - FRONTEND_URL
 */

// Log configuration status on startup
console.log('📧 Email Service Configuration:');
console.log('   BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   SENDER_EMAIL:', process.env.SENDER_EMAIL || '❌ Missing');

// Frontend URL for meeting links
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://connectify2-web.vercel.app';

// Initialize Brevo API
let apiInstance = null;

const initBrevoApi = () => {
    if (!process.env.BREVO_API_KEY) {
        console.warn('⚠️ Brevo API key not configured. Emails will be logged but not sent.');
        return null;
    }

    const api = new Brevo.TransactionalEmailsApi();
    api.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
    return api;
};

apiInstance = initBrevoApi();

/**
 * Generate HTML email content for meeting invite
 */
const generateInviteHtml = (meeting, host = null) => {
    const meetingDate = new Date(meeting.startTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    // Host info section
    const hostName = host?.name || 'A Connectify user';
    const hostEmail = host?.email || host?.username || '';
    const hostInfoHtml = hostEmail
        ? `<p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">INVITED BY</p>
           <p style="margin: 0 0 16px; color: #22c55e; font-size: 16px;">👤 ${hostName} <span style="color: #94a3b8;">(${hostEmail})</span></p>`
        : `<p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">INVITED BY</p>
           <p style="margin: 0 0 16px; color: #22c55e; font-size: 16px;">👤 ${hostName}</p>`;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f1f5f9;">
    <table width="100%" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px;">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">📹 Connectify</h1>
                            <p style="margin: 10px 0 0; color: #bfdbfe; font-size: 14px;">Video Conferencing Made Simple</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">You're Invited! 🎉</h2>
                            <p style="margin: 0 0 30px; color: #94a3b8; font-size: 16px;"><strong style="color: #60a5fa;">${hostName}</strong> has invited you to join a video meeting.</p>
                            <table width="100%" style="background-color: #334155; border-radius: 12px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        ${hostInfoHtml}
                                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">MEETING TITLE</p>
                                        <p style="margin: 0 0 16px; color: #ffffff; font-size: 18px; font-weight: 600;">${meeting.title || 'Connectify Meeting'}</p>
                                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">DATE & TIME</p>
                                        <p style="margin: 0 0 16px; color: #60a5fa; font-size: 16px;">📅 ${meetingDate}</p>
                                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">MEETING CODE</p>
                                        <p style="margin: 0; color: #f59e0b; font-size: 20px; font-weight: bold;">${meeting.meetingCode}</p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="${FRONTEND_URL}/${meeting.meetingCode}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 18px; font-weight: 600;">🚀 Join Meeting</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

/**
 * Generate HTML email content for meeting reminder
 */
const generateReminderHtml = (meeting) => {
    const meetingDate = new Date(meeting.startTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f1f5f9;">
    <table width="100%" style="background-color: #f1f5f9; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 16px;">
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 16px 16px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">⏰ Meeting Reminder</h1>
                            <p style="margin: 10px 0 0; color: #fef3c7; font-size: 14px;">Starts in 10 minutes!</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">Don't Miss It! 🔔</h2>
                            <table width="100%" style="background-color: #334155; border-radius: 12px; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 24px;">
                                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">MEETING TITLE</p>
                                        <p style="margin: 0 0 16px; color: #ffffff; font-size: 18px; font-weight: 600;">${meeting.title || 'Connectify Meeting'}</p>
                                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">STARTING AT</p>
                                        <p style="margin: 0 0 16px; color: #f59e0b; font-size: 16px;">⏰ ${meetingDate}</p>
                                        <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">MEETING CODE</p>
                                        <p style="margin: 0; color: #f59e0b; font-size: 20px; font-weight: bold;">${meeting.meetingCode}</p>
                                    </td>
                                </tr>
                            </table>
                            <table width="100%">
                                <tr>
                                    <td align="center">
                                        <a href="${FRONTEND_URL}/${meeting.meetingCode}" style="display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-size: 18px; font-weight: 600;">🚀 Join Now</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
};

/**
 * Send meeting invite email to all participants using Brevo SDK
 * @param {Object} meeting - Meeting details
 * @param {Object} host - Host user info { name, email, username }
 */
export const sendInviteEmail = async (meeting, host = null) => {
    if (!meeting.participants || meeting.participants.length === 0) {
        console.log('📧 No participants to send invite to');
        return { success: true, message: 'No participants' };
    }

    console.log('📧 Preparing email with:');
    console.log('   Meeting Code:', meeting.meetingCode);
    console.log('   Title:', meeting.title);
    console.log('   Host:', host?.name || 'Unknown');
    console.log('   Participants:', meeting.participants);

    if (!apiInstance) {
        console.log('📧 [MOCK] Would send invite email to:', meeting.participants);
        console.log('📧 [MOCK] Meeting:', meeting.title, '| Code:', meeting.meetingCode);
        console.log('📧 [MOCK] Invited by:', host?.name || 'Unknown');
        return { success: true, message: 'Email logged (Brevo API not configured)' };
    }

    try {
        const sendSmtpEmail = new Brevo.SendSmtpEmail();

        const hostName = host?.name || 'A Connectify user';
        sendSmtpEmail.subject = `📹 ${hostName} invited you to: ${meeting.title || 'Connectify Meeting'}`;
        sendSmtpEmail.htmlContent = generateInviteHtml(meeting, host);
        sendSmtpEmail.sender = {
            name: process.env.SENDER_NAME || 'Connectify',
            email: process.env.SENDER_EMAIL
        };
        sendSmtpEmail.to = meeting.participants.map(email => ({ email }));

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Invite email sent! Code: ${meeting.meetingCode} | MessageId:`, data.body?.messageId || 'Success');

        return { success: true, messageId: data.body?.messageId };
    } catch (error) {
        console.error('❌ Error sending invite email:', error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send meeting reminder email to all participants using Brevo SDK
 */
export const sendReminderEmail = async (meeting) => {
    if (!meeting.participants || meeting.participants.length === 0) {
        console.log('📧 No participants to send reminder to');
        return { success: true, message: 'No participants' };
    }

    if (!apiInstance) {
        console.log('📧 [MOCK] Would send reminder email to:', meeting.participants);
        return { success: true, message: 'Email logged (Brevo API not configured)' };
    }

    try {
        const sendSmtpEmail = new Brevo.SendSmtpEmail();

        sendSmtpEmail.subject = `⏰ Reminder: ${meeting.title || 'Your Meeting'} starts in 10 minutes!`;
        sendSmtpEmail.htmlContent = generateReminderHtml(meeting);
        sendSmtpEmail.sender = {
            name: process.env.SENDER_NAME || 'Connectify',
            email: process.env.SENDER_EMAIL
        };
        sendSmtpEmail.to = meeting.participants.map(email => ({ email }));

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Reminder email sent to ${meeting.participants.length} participant(s):`, data.body?.messageId || 'Success');

        return { success: true, messageId: data.body?.messageId };
    } catch (error) {
        console.error('❌ Error sending reminder email:', error.message);
        return { success: false, error: error.message };
    }
};

export default { sendInviteEmail, sendReminderEmail };
