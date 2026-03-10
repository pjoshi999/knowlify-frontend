"use client";

/**
 * ChatMessage Component
 *
 * Displays a single message in the chat interface with appropriate styling
 * for user and assistant messages.
 *
 * Validates: Requirements 4.1
 */

import { Message } from "@/app/(protected)/upload/page";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-white text-black"
            : isSystem
              ? "bg-gray-800 text-white"
              : "bg-surface-secondary text-foreground"
        }`}
      >
        {/* Message Content */}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

        {/* Timestamp */}
        <p className={`text-xs mt-1 ${isUser ? "text-gray-400" : "text-foreground-secondary"}`}>
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
