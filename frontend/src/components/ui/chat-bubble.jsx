import * as React from "react";
import { cn } from "../../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Button } from "./button";
import { MessageLoading } from "./message-loading";
import { Sparkles } from "lucide-react";

/**
 * ChatBubble - Container for chat message with avatar and content
 */
export function ChatBubble({
  variant = "received",
  layout = "default",
  isAi = false,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 mb-4",
        variant === "sent" && "flex-row-reverse",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * ChatBubbleMessage - The message content bubble
 * Supports AI-styled messages with gradient background
 */
export function ChatBubbleMessage({
  variant = "received",
  isLoading,
  isAi = false,
  className,
  children,
}) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 max-w-[80%]",
        isAi 
          ? "bg-gradient-to-r from-indigo-900 to-purple-900 text-white border border-indigo-500/30"
          : variant === "sent"
            ? "bg-primary text-primary-foreground"
            : "bg-muted",
        className
      )}
    >
      {isAi && (
        <div className="flex items-center gap-1.5 mb-2 text-xs text-indigo-300">
          <Sparkles size={12} className="text-purple-400" />
          <span className="font-medium">AI Assistant</span>
        </div>
      )}
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <MessageLoading />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * ChatBubbleAvatar - Avatar component for chat messages
 */
export function ChatBubbleAvatar({
  src,
  fallback = "AI",
  className,
}) {
  return (
    <Avatar className={cn("h-8 w-8 flex-shrink-0", className)}>
      {src && <AvatarImage src={src} />}
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}

/**
 * ChatBubbleAction - Action button for chat messages (copy, regenerate, etc.)
 */
export function ChatBubbleAction({
  icon,
  onClick,
  className,
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("h-6 w-6", className)}
      onClick={onClick}
    >
      {icon}
    </Button>
  );
}

/**
 * ChatBubbleActionWrapper - Container for action buttons
 */
export function ChatBubbleActionWrapper({
  className,
  children,
}) {
  return (
    <div className={cn("flex items-center gap-1 mt-2", className)}>
      {children}
    </div>
  );
}

/**
 * ChatBubbleTimestamp - Timestamp for messages
 */
export function ChatBubbleTimestamp({
  timestamp,
  className,
}) {
  return (
    <span className={cn("text-xs text-muted-foreground mt-1", className)}>
      {timestamp}
    </span>
  );
}
