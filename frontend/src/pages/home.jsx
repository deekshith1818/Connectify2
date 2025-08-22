import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { AuthContext } from '../contexts/AuthContext';
import { 
  Video, 
  Users, 
  History as HistoryIcon, 
  LogOut, 
  Settings, 
  Plus,
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react';

function HomeComponent() {
    const navigate = useNavigate();
    const [meetingCode, setMeetingCode] = useState("");
    const { addToUserHistory, userData } = useContext(AuthContext);

    const handleJoinVideoCall = async () => {
        if (meetingCode.trim()) {
            await addToUserHistory(meetingCode);
            navigate(`/${meetingCode}`);
        }
    };

    const handleCreateMeeting = () => {
        const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setMeetingCode(randomCode);
    };

    const stats = [
        {
            title: "Total Meetings",
            value: "24",
            icon: Video,
            description: "This month"
        },
        {
            title: "Participants",
            value: "156",
            icon: Users,
            description: "Total joined"
        },
        {
            title: "Meeting Time",
            value: "12.5h",
            icon: Clock,
            description: "This month"
        }
    ];

    const recentMeetings = [
        { code: "ABC123", date: "2024-01-15", duration: "45 min" },
        { code: "XYZ789", date: "2024-01-14", duration: "1h 20 min" },
        { code: "DEF456", date: "2024-01-13", duration: "30 min" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Video className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Connectify</h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/history")}
                                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            >
                                <HistoryIcon className="mr-2 h-4 w-4" />
                                History
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                            
                            <Button
                                variant="outline"
                                onClick={() => {
                                    localStorage.removeItem("token");
                                    navigate("/auth");
                                }}
                                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

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
                    {stats.map((stat, index) => (
                        <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                            {stat.title}
                                        </p>
                                        <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                            {stat.value}
                                        </p>
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Meeting Code
                                </label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={meetingCode}
                                        onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                                        placeholder="Enter meeting code"
                                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Button
                                        onClick={handleCreateMeeting}
                                        variant="outline"
                                        className="px-4"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="flex space-x-3">
                                <Button
                                    onClick={handleJoinVideoCall}
                                    disabled={!meetingCode.trim()}
                                    className="flex-1"
                                >
                                    <Video className="mr-2 h-4 w-4" />
                                    Join Meeting
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    onClick={() => navigate("/43423")}
                                    className="flex-1"
                                >
                                    <Users className="mr-2 h-4 w-4" />
                                    Join as Guest
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
                                {recentMeetings.map((meeting, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                        onClick={() => {
                                            setMeetingCode(meeting.code);
                                            navigate(`/${meeting.code}`);
                                        }}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                                <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900 dark:text-white">
                                                    {meeting.code}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(meeting.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                {meeting.duration}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                Duration
                                            </p>
                                        </div>
                                    </div>
                                ))}
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
                                    onClick={handleCreateMeeting}
                                >
                                    <Plus className="h-6 w-6" />
                                    <span className="text-sm">New Meeting</span>
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
                                    onClick={() => navigate("/43423")}
                                >
                                    <Users className="h-6 w-6" />
                                    <span className="text-sm">Join as Guest</span>
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
        </div>
    );
}

export default withAuth(HomeComponent);