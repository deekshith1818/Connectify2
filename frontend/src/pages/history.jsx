import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import Box from '@mui/material/Box';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton, Alert, CircularProgress } from '@mui/material';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]); // Always initialize as array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const routeTo = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const history = await getHistoryOfUser();
                console.log('📊 History received:', history);
                
                // Make sure we always set an array
                if (Array.isArray(history)) {
                    setMeetings(history);
                } else if (history && Array.isArray(history.data)) {
                    setMeetings(history.data);
                } else if (history && Array.isArray(history.meetings)) {
                    setMeetings(history.meetings);
                } else {
                    console.warn('⚠️ History is not an array:', history);
                    setMeetings([]); // Fallback to empty array
                }
            } catch (err) {
                console.error('❌ Error fetching history:', err);
                setError('Failed to load meeting history');
                setMeetings([]); // Ensure meetings is always an array
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [getHistoryOfUser]);

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (err) {
            console.error('Error formatting date:', err);
            return 'Invalid Date';
        }
    }

    if (loading) {
        return (
            <Box display="flex" flexDirection="column" alignItems="center" p={3}>
                <IconButton onClick={() => routeTo("/home")}>
                    <HomeIcon />
                </IconButton>
                <CircularProgress sx={{ mt: 2 }} />
                <Typography sx={{ mt: 2 }}>Loading meeting history...</Typography>
            </Box>
        );
    }

    return (
        <div>
            <IconButton onClick={() => routeTo("/home")}>
                <HomeIcon />
            </IconButton>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {/* Safe check: meetings is guaranteed to be an array */}
            {meetings.length > 0 ? (
                meetings.map((meeting, index) => (
                    <Card key={meeting.id || index} variant="outlined" sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                                Code: {meeting.meetingCode || 'N/A'}
                            </Typography>
                            <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                Date: {formatDate(meeting.date || meeting.createdAt)}
                            </Typography>
                            {meeting.duration && (
                                <Typography sx={{ mb: 1.5 }} color="text.secondary">
                                    Duration: {meeting.duration}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Box textAlign="center" p={3}>
                    <Typography variant="h6" color="text.secondary">
                        No meeting history found
                    </Typography>
                    <Typography color="text.secondary">
                        Your past meetings will appear here
                    </Typography>
                </Box>
            )}
        </div>
    );
}