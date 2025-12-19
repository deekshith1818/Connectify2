import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { NavBar } from '../components/ui/tubelight-navbar';
import { 
  Home, 
  History as HistoryIcon, 
  Video, 
  Calendar, 
  Clock, 
  Users,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Settings
} from 'lucide-react';

export default function History() {
    const { getHistoryOfUser } = useContext(AuthContext);
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const history = await getHistoryOfUser();
                console.log('📊 History received:', history);
                
                if (Array.isArray(history)) {
                    setMeetings(history);
                } else if (history && Array.isArray(history.data)) {
                    setMeetings(history.data);
                } else if (history && Array.isArray(history.meetings)) {
                    setMeetings(history.meetings);
                } else {
                    console.warn('⚠️ History is not an array:', history);
                    setMeetings([]);
                }
            } catch (err) {
                console.error('❌ Error fetching history:', err);
                setError('Failed to load meeting history');
                setMeetings([]);
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
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (err) {
            console.error('Error formatting date:', err);
            return 'Invalid Date';
        }
    };

    const filteredMeetings = meetings.filter(meeting =>
        meeting.meetingCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDate(meeting.date).toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: meetings.length,
        thisWeek: meetings.filter(m => {
            const meetingDate = new Date(m.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return meetingDate >= weekAgo;
        }).length,
        thisMonth: meetings.filter(m => {
            const meetingDate = new Date(m.date);
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return meetingDate >= monthAgo;
        }).length
    };

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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <NavBar items={navItems} onLogout={handleLogout} />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-slate-600 dark:text-slate-300">Loading meeting history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
            {/* Tubelight Navbar */}
            <NavBar items={navItems} onLogout={handleLogout} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
                            <HistoryIcon className="mr-3 h-8 w-8" />
                            Meeting History
                        </h1>
                        <p className="text-slate-600 dark:text-slate-300 mt-1">
                            Track your past meetings and activities
                        </p>
                    </div>
                    
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="text-slate-600 dark:text-slate-300"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        Total Meetings
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stats.total}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                                    <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        This Week
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stats.thisWeek}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                        This Month
                                    </p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {stats.thisMonth}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filter */}
                <Card className="border-0 shadow-lg mb-8">
                    <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search meetings by code or date..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <Button variant="outline" className="flex items-center">
                                <Filter className="mr-2 h-4 w-4" />
                                Filter
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Display */}
                {error && (
                    <Card className="border-0 shadow-lg mb-8 border-l-4 border-red-500">
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                                    <span className="text-red-600 dark:text-red-400 text-sm font-bold">!</span>
                                </div>
                                <div>
                                    <p className="font-medium text-red-900 dark:text-red-100">{error}</p>
                                    <p className="text-sm text-red-600 dark:text-red-400">Please try refreshing the page</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Meetings List */}
                {filteredMeetings.length > 0 ? (
                    <div className="grid gap-4">
                        {filteredMeetings.map((meeting, index) => (
                            <Card key={meeting.id || index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                                                <Video className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                        {meeting.meetingCode || 'N/A'}
                                                    </h3>
                                                    <Badge variant="outline" className="text-xs">
                                                        Meeting
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center">
                                                    <Calendar className="mr-1 h-3 w-3" />
                                                    {formatDate(meeting.date)}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-4">
                                            <div className="text-right">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {meeting.duration || 'N/A'}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    Duration
                                                </p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => navigate(`/${meeting.meetingCode}`)}
                                                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                                            >
                                                <Video className="mr-2 h-4 w-4" />
                                                Rejoin
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <HistoryIcon className="h-8 w-8 text-slate-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                                {searchTerm ? 'No meetings found' : 'No meeting history'}
                            </h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6">
                                {searchTerm 
                                    ? 'Try adjusting your search terms or filters.'
                                    : 'Your past meetings will appear here once you start using Connectify.'
                                }
                            </p>
                            {!searchTerm && (
                                <Button onClick={() => navigate("/home")}>
                                    <Video className="mr-2 h-4 w-4" />
                                    Start Your First Meeting
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}