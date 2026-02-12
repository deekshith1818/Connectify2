import React, { useContext, useState, useEffect, useCallback } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AuthContext } from '../contexts/AuthContext';
import { NavBar } from '../components/ui/tubelight-navbar';
import ScheduleMeetingModal from '../components/ScheduleMeetingModal';
import axios from 'axios';
import server from '../environment';
import { 
  Video, 
  Users, 
  History as HistoryIcon, 
  LogOut, 
  Settings, 
  Plus,
  Clock,
  AlertCircle,
  Loader2,
  Home,
  Calendar,
  CalendarPlus
} from 'lucide-react';

// Skeleton component for loading states
const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-300 dark:bg-slate-700 rounded ${className}`} />
);

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { addToUserHistory, userData, startMeeting, validateMeeting } = useContext(AuthContext);

    // Dynamic state for stats and meetings
    const [stats, setStats] = useState(null);
    const [recentMeetings, setRecentMeetings] = useState([]);
    const [isLoadingStats, setIsLoadingStats] = useState(true);
    const [isLoadingMeetings, setIsLoadingMeetings] = useState(true);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // Fetch stats from API
    const fetchStats = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${server}/api/v1/meetings/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setStats(response.data.stats);
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setIsLoadingStats(false);
        }
    }, []);

    // Fetch recent meetings from API
    const fetchRecentMeetings = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await axios.get(`${server}/api/v1/meetings/recent`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setRecentMeetings(response.data.meetings);
            }
        } catch (err) {
            console.error('Error fetching recent meetings:', err);
        } finally {
            setIsLoadingMeetings(false);
        }
    }, []);

    // Fetch data on mount
    useEffect(() => {
        fetchStats();
        fetchRecentMeetings();
    }, [fetchStats, fetchRecentMeetings]);

    // Join an existing meeting with validation
    const handleJoinVideoCall = async () => {
        if (!meetingCode.trim()) return;
        
        setError("");
        setIsLoading(true);
        
        try {
            // Validate meeting code first
            await validateMeeting(meetingCode);
            // If valid, add to history and navigate
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode.toUpperCase()}`);
        } catch (err) {
            console.error("Join meeting error:", err);
            setError(err.message || "Invalid or expired meeting code");
        } finally {
            setIsLoading(false);
        }
    };

    // Start a new meeting (Host creates room in DB)
    const handleStartMeeting = async () => {
        setError("");
        setIsLoading(true);
        
        try {
            // Create meeting in DB and get code
            const newCode = await startMeeting();
            // Add to history and navigate
            await addToUserHistory(newCode);
            navigate(`/${newCode}`);
        } catch (err) {
            console.error("Start meeting error:", err);
            setError(err.message || "Failed to create meeting");
        } finally {
            setIsLoading(false);
        }
    };

    // Handle successful scheduling
    const handleScheduleSuccess = (meeting) => {
        fetchRecentMeetings(); // Refresh the recent meetings list
        setIsScheduleModalOpen(false);
    };

    // Stats cards data with dynamic values
    const statsData = [
        {
            title: "Total Meetings",
            value: isLoadingStats ? null : (stats?.totalMeetings ?? 0),
            icon: Video,
            description: "This month"
        },
        {
            title: "Participants",
            value: isLoadingStats ? null : (stats?.totalParticipants ?? 0),
            icon: Users,
            description: "Total joined"
        },
        {
            title: "Meeting Time",
            value: isLoadingStats ? null : `${stats?.totalHours ?? 0}h`,
            icon: Clock,
            description: "This month"
        }
    ];

    // Navigation items for Tubelight Navbar
    const navItems = [
        { name: 'Home', url: '/home', icon: Home },
        { name: 'History', url: '/history', icon: HistoryIcon },
        { name: 'Settings', url: '/settings', icon: Settings },
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/auth");
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    // Get status badge color
    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400';
            case 'active': return 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400';
            case 'completed': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
            default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            {/* Tubelight Navbar */}
            <NavBar items={navItems} onLogout={handleLogout} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Welcome back, {userData?.name || 'User'}! 👋
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">
                        Ready to connect with your team? Join or create a new meeting.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {statsData.map((stat, index) => (
                        <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {stat.title}
                                        </p>
                                        {stat.value === null ? (
                                            <Skeleton className="h-8 w-16 mt-1" />
                                        ) : (
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                                {stat.value}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {stat.description}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                                        <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Join/Create Meeting */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Video className="mr-2 h-5 w-5" />
                                Start a Meeting
                            </CardTitle>
                            <CardDescription>
                                Join an existing meeting or create a new one
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Error Message */}
                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Meeting Code
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={meetingCode}
                                        onChange={(e) => {
                                            setMeetingCode(e.target.value.toUpperCase());
                                            setError(""); // Clear error on input change
                                        }}
                                        placeholder="Enter meeting code"
                                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            
                            <div className="flex space-x-3">
                                <Button
                                    onClick={handleJoinVideoCall}
                                    disabled={!meetingCode.trim() || isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Video className="mr-2 h-4 w-4" />
                                    )}
                                    Join Meeting
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    onClick={handleStartMeeting}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    {isLoading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Start Instant Meeting
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Meetings */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <HistoryIcon className="mr-2 h-5 w-5" />
                                Recent Meetings
                            </CardTitle>
                            <CardDescription>
                                Your recent meeting activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {isLoadingMeetings ? (
                                    // Loading skeletons
                                    [...Array(3)].map((_, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                                            <div className="flex items-center space-x-3">
                                                <Skeleton className="w-8 h-8 rounded-lg" />
                                                <div>
                                                    <Skeleton className="h-4 w-20 mb-1" />
                                                    <Skeleton className="h-3 w-16" />
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Skeleton className="h-4 w-12 mb-1" />
                                                <Skeleton className="h-3 w-16" />
                                            </div>
                                        </div>
                                    ))
                                ) : recentMeetings.length > 0 ? (
                                    recentMeetings.map((meeting, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                            onClick={() => {
                                                if (meeting.status === 'scheduled') {
                                                    // For scheduled meetings, copy the code
                                                    setMeetingCode(meeting.meetingCode);
                                                } else {
                                                    setMeetingCode(meeting.meetingCode);
                                                }
                                            }}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    meeting.status === 'scheduled' 
                                                        ? 'bg-blue-100 dark:bg-blue-900' 
                                                        : 'bg-blue-100 dark:bg-blue-900'
                                                }`}>
                                                    {meeting.status === 'scheduled' ? (
                                                        <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    ) : (
                                                        <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">
                                                        {meeting.title || meeting.meetingCode}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {formatDate(meeting.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {meeting.duration}
                                                </p>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(meeting.status)}`}>
                                                    {meeting.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                        <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No meetings yet</p>
                                        <p className="text-sm">Start your first meeting!</p>
                                    </div>
                                )}
                            </div>
                            
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/history")}
                                className="w-full mt-4"
                            >
                                View All History
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Common tasks and shortcuts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Button
                                    variant="outline"
                                    className="h-20 flex-col space-y-2"
                                    onClick={handleStartMeeting}
                                    disabled={isLoading}
                                >
                                    <Plus className="h-6 w-6" />
                                    <span className="text-sm">New Meeting</span>
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    className="h-20 flex-col space-y-2"
                                    onClick={() => setIsScheduleModalOpen(true)}
                                >
                                    <CalendarPlus className="h-6 w-6" />
                                    <span className="text-sm">Schedule Meeting</span>
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    className="h-20 flex-col space-y-2"
                                    onClick={() => navigate("/history")}
                                >
                                    <HistoryIcon className="h-6 w-6" />
                                    <span className="text-sm">View History</span>
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    className="h-20 flex-col space-y-2"
                                >
                                    <Settings className="h-6 w-6" />
                                    <span className="text-sm">Settings</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>

            {/* Schedule Meeting Modal */}
            <ScheduleMeetingModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSuccess={handleScheduleSuccess}
            />
        </div>
    );
}

export default withAuth(HomeComponent);