import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Calendar, Clock, Loader2, Check, Users, Mail } from 'lucide-react';
import axios from 'axios';
import server from '../environment';

/**
 * ScheduleMeetingModal - Modal for scheduling future meetings
 */
const ScheduleMeetingModal = ({ isOpen, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [dateTime, setDateTime] = useState('');
    const [participantsInput, setParticipantsInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [emailsSent, setEmailsSent] = useState(0);

    // Get minimum datetime (now + 5 minutes)
    const getMinDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        return now.toISOString().slice(0, 16);
    };

    // Parse comma-separated emails into array
    const parseEmails = (input) => {
        if (!input.trim()) return [];
        return input
            .split(',')
            .map(email => email.trim().toLowerCase())
            .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Authentication required');
            }

            const participants = parseEmails(participantsInput);

            const response = await axios.post(
                `${server}/api/v1/meetings/schedule`,
                { 
                    title: title || 'Scheduled Meeting', 
                    startTime: dateTime,
                    participants 
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setEmailsSent(participants.length);
                setSuccess(true);
                setTimeout(() => {
                    onSuccess?.(response.data.meeting);
                    handleClose();
                }, 2000);
            }
        } catch (err) {
            console.error('Schedule error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to schedule meeting');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setTitle('');
        setDateTime('');
        setParticipantsInput('');
        setError('');
        setSuccess(false);
        setEmailsSent(0);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md bg-slate-900 border-slate-700 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <Calendar className="h-5 w-5 text-blue-400" />
                        Schedule a Meeting
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Set a date, time, and invite participants
                    </DialogDescription>
                </DialogHeader>

                {success ? (
                    <div className="py-8 text-center">
                        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                            <Check className="h-8 w-8 text-green-400" />
                        </div>
                        <p className="text-lg font-medium text-white">Meeting Scheduled!</p>
                        <p className="text-slate-400 text-sm mt-1">
                            {emailsSent > 0 
                                ? `📧 Invite sent to ${emailsSent} participant${emailsSent > 1 ? 's' : ''}`
                                : 'Your meeting has been created successfully'
                            }
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">
                                Meeting Title (optional)
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Team Standup"
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Date & Time *
                            </label>
                            <input
                                type="datetime-local"
                                value={dateTime}
                                onChange={(e) => setDateTime(e.target.value)}
                                min={getMinDateTime()}
                                required
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Invite Participants (optional)
                            </label>
                            <textarea
                                value={participantsInput}
                                onChange={(e) => setParticipantsInput(e.target.value)}
                                placeholder="Enter emails separated by commas&#10;e.g., john@email.com, jane@email.com"
                                rows={2}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                disabled={isLoading}
                            />
                            {participantsInput && (
                                <p className="text-xs text-slate-500">
                                    📧 {parseEmails(participantsInput).length} valid email(s) will receive an invite
                                </p>
                            )}
                        </div>

                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!dateTime || isLoading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Scheduling...
                                    </>
                                ) : (
                                    <>
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Schedule & Send Invites
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ScheduleMeetingModal;
