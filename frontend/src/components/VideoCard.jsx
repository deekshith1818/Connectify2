import React, { useRef, useEffect, useState } from 'react';
import { Pin, PinOff, Mic, MicOff, Video, VideoOff, Maximize2 } from 'lucide-react';
import { cn } from '../lib/utils';

/**
 * VideoCard - Reusable video tile component with pin controls
 */
const VideoCard = ({
    stream,
    peerId,
    isLocal = false,
    isPinned = false,
    onPinToggle,
    displayName,
    isMainStage = false,
    className
}) => {
    const videoRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [hasVideo, setHasVideo] = useState(true);

    // Attach stream to video element
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
            
            // Check if video track is enabled
            const videoTrack = stream.getVideoTracks()[0];
            setHasVideo(videoTrack?.enabled ?? false);
            
            // Listen for track changes
            const handleTrackChange = () => {
                const vTrack = stream.getVideoTracks()[0];
                setHasVideo(vTrack?.enabled ?? false);
            };
            
            stream.addEventListener('addtrack', handleTrackChange);
            stream.addEventListener('removetrack', handleTrackChange);
            
            return () => {
                stream.removeEventListener('addtrack', handleTrackChange);
                stream.removeEventListener('removetrack', handleTrackChange);
            };
        }
    }, [stream]);

    const handlePinClick = (e) => {
        e.stopPropagation();
        if (onPinToggle) {
            onPinToggle(isPinned ? null : peerId);
        }
    };

    const name = displayName || (isLocal ? 'You' : `User ${peerId?.slice(-4) || ''}`);
    const initials = name.charAt(0).toUpperCase();

    return (
        <div
            className={cn(
                "relative bg-slate-800 rounded-xl overflow-hidden transition-all duration-300",
                isMainStage ? "aspect-video" : "aspect-video",
                isPinned && !isMainStage && "ring-2 ring-blue-500",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Video Element */}
            {stream && hasVideo ? (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className={cn(
                        "w-full h-full",
                        isMainStage ? "object-contain bg-black" : "object-cover",
                        isLocal && "transform -scale-x-100"
                    )}
                />
            ) : (
                /* Avatar Fallback when no video */
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                    <div className={cn(
                        "rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold",
                        isMainStage ? "h-32 w-32 text-5xl" : "h-16 w-16 text-2xl"
                    )}>
                        {initials}
                    </div>
                </div>
            )}

            {/* Hidden video for audio (when video is off but audio is on) */}
            {stream && !hasVideo && (
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isLocal}
                    className="hidden"
                />
            )}

            {/* Pin Button Overlay */}
            <div className={cn(
                "absolute top-2 right-2 transition-opacity duration-200",
                isHovered || isPinned ? "opacity-100" : "opacity-0"
            )}>
                <button
                    onClick={handlePinClick}
                    className={cn(
                        "p-2 rounded-lg backdrop-blur-sm transition-all",
                        isPinned 
                            ? "bg-blue-500 text-white" 
                            : "bg-black/50 text-white hover:bg-black/70"
                    )}
                    title={isPinned ? "Unpin" : "Pin to main view"}
                >
                    {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>
            </div>

            {/* Expand Button (only on hover for non-pinned) */}
            {!isPinned && isHovered && !isLocal && (
                <div className="absolute top-2 left-2">
                    <button
                        onClick={handlePinClick}
                        className="p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-all"
                        title="Expand to main view"
                    >
                        <Maximize2 size={16} />
                    </button>
                </div>
            )}

            {/* Name Tag */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "px-2 py-1 rounded-lg backdrop-blur-sm text-white text-sm font-medium",
                        "bg-black/50"
                    )}>
                        {name}
                        {isLocal && " (You)"}
                    </span>
                </div>
                
                {/* Status indicators */}
                {isPinned && (
                    <span className="px-2 py-1 rounded-lg bg-blue-500/80 text-white text-xs font-medium backdrop-blur-sm">
                        Pinned
                    </span>
                )}
            </div>

            {/* Speaking indicator ring */}
            {/* This could be enhanced with actual audio level detection */}
        </div>
    );
};

export default VideoCard;
