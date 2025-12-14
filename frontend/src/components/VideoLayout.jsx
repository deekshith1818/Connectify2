import React from 'react';
import { Grid3X3, LayoutTemplate, Users } from 'lucide-react';
import VideoCard from './VideoCard';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

/**
 * VideoLayout - Handles Grid View and Speaker View layouts
 * 
 * Grid View: All participants in equal-sized tiles
 * Speaker View: One pinned user takes main stage, others in sidebar
 */
const VideoLayout = ({
    localStream,
    localVideoRef,
    peers = [],
    pinnedId,
    setPinnedId,
    username = 'You',
    className
}) => {
    const allParticipants = [
        { peerId: 'local', stream: localStream, isLocal: true, displayName: username },
        ...peers.map(p => ({
            peerId: p.socketId || p.peerId,
            stream: p.stream,
            isLocal: false,
            displayName: p.displayName || `User ${(p.socketId || p.peerId)?.slice(-4) || ''}`
        }))
    ];

    const pinnedParticipant = pinnedId 
        ? allParticipants.find(p => p.peerId === pinnedId)
        : null;

    const sidebarParticipants = pinnedId
        ? allParticipants.filter(p => p.peerId !== pinnedId)
        : [];

    const isGridView = !pinnedId;
    const participantCount = allParticipants.length;

    // Determine grid columns based on participant count
    const getGridClass = () => {
        if (participantCount === 1) return 'grid-cols-1';
        if (participantCount === 2) return 'grid-cols-1 md:grid-cols-2';
        if (participantCount <= 4) return 'grid-cols-2';
        if (participantCount <= 6) return 'grid-cols-2 lg:grid-cols-3';
        if (participantCount <= 9) return 'grid-cols-3';
        return 'grid-cols-3 lg:grid-cols-4';
    };

    return (
        <div className={cn("relative h-full w-full", className)}>
            {/* View Toggle Button */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <Button
                    variant={isGridView ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPinnedId(null)}
                    className="gap-2"
                >
                    <Grid3X3 size={16} />
                    <span className="hidden sm:inline">Grid</span>
                </Button>
                {allParticipants.length > 1 && (
                    <Button
                        variant={!isGridView ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            // Pin the first remote participant if none pinned
                            if (!pinnedId) {
                                const firstRemote = allParticipants.find(p => !p.isLocal);
                                if (firstRemote) setPinnedId(firstRemote.peerId);
                            }
                        }}
                        className="gap-2"
                    >
                        <LayoutTemplate size={16} />
                        <span className="hidden sm:inline">Speaker</span>
                    </Button>
                )}
                <div className="ml-2 px-3 py-1 bg-slate-800/80 backdrop-blur-sm rounded-lg text-white text-sm flex items-center gap-2">
                    <Users size={14} />
                    <span>{participantCount}</span>
                </div>
            </div>

            {/* GRID VIEW */}
            {isGridView && (
                <div className={cn(
                    "h-full w-full p-4 pt-16 grid gap-4 auto-rows-fr",
                    getGridClass()
                )}>
                    {allParticipants.map((participant) => (
                        <VideoCard
                            key={participant.peerId}
                            stream={participant.stream}
                            peerId={participant.peerId}
                            isLocal={participant.isLocal}
                            isPinned={false}
                            onPinToggle={setPinnedId}
                            displayName={participant.displayName}
                            isMainStage={false}
                        />
                    ))}
                </div>
            )}

            {/* SPEAKER VIEW (Pinned Mode) */}
            {!isGridView && pinnedParticipant && (
                <div className="h-full w-full flex flex-col md:flex-row p-4 pt-16 gap-4">
                    {/* Main Stage - 80% */}
                    <div className="flex-1 min-h-0">
                        <VideoCard
                            stream={pinnedParticipant.stream}
                            peerId={pinnedParticipant.peerId}
                            isLocal={pinnedParticipant.isLocal}
                            isPinned={true}
                            onPinToggle={setPinnedId}
                            displayName={pinnedParticipant.displayName}
                            isMainStage={true}
                            className="h-full"
                        />
                    </div>

                    {/* Sidebar - Scrollable list of other participants */}
                    {sidebarParticipants.length > 0 && (
                        <div className={cn(
                            "flex gap-3 overflow-auto",
                            // Desktop: vertical sidebar on right
                            "md:flex-col md:w-64 md:h-full",
                            // Mobile: horizontal strip at bottom
                            "flex-row h-32 md:h-auto"
                        )}>
                            {sidebarParticipants.map((participant) => (
                                <div 
                                    key={participant.peerId}
                                    className={cn(
                                        "flex-shrink-0",
                                        // Desktop: full width, auto height
                                        "md:w-full md:h-auto",
                                        // Mobile: fixed width for horizontal scroll
                                        "w-48 h-full md:aspect-video"
                                    )}
                                >
                                    <VideoCard
                                        stream={participant.stream}
                                        peerId={participant.peerId}
                                        isLocal={participant.isLocal}
                                        isPinned={false}
                                        onPinToggle={setPinnedId}
                                        displayName={participant.displayName}
                                        isMainStage={false}
                                        className="h-full"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empty State - No participants */}
            {participantCount === 0 && (
                <div className="h-full w-full flex items-center justify-center">
                    <div className="text-center text-slate-400">
                        <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Waiting for participants...</p>
                        <p className="text-sm">Share the meeting link to invite others</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoLayout;
