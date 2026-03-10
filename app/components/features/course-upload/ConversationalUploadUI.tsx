"use client";

/**
 * ConversationalUploadUI Component
 *
 * ChatGPT-style conversational interface for course creation
 * Design: Elegant black/gray/white with smooth animations
 *
 * Features:
 * - Message-based interaction flow
 * - Smooth Framer Motion animations
 * - Progress tracking for uploads and AI analysis
 * - Responsive design for all screen sizes
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Sparkles } from "lucide-react";
import { UploadProgressTracker, VideoProgress } from "./UploadProgressTracker";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    uploadProgress?: VideoProgress[];
    overallUploadProgress?: number;
    overallAIProgress?: number;
    isComplete?: boolean;
  };
}

export interface ConversationalUploadUIProps {
  instructorId: string;
  onCourseCreated: (courseId: string) => void;
}

export function ConversationalUploadUI({
  instructorId,
  onCourseCreated,
}: ConversationalUploadUIProps) {
  // TODO: Implement upload logic using instructorId and onCourseCreated
  console.log("ConversationalUploadUI initialized", { instructorId, onCourseCreated });

  const [messages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Welcome! I'll help you create your course. You can upload videos individually or drag an entire folder. I'll analyze the content and help you organize everything.",
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-zinc-800 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Course Creator</h1>
              <p className="text-xs text-zinc-400">AI-powered course upload assistant</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <MessageBubble key={message.id} message={message} index={index} />
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area - Placeholder for now */}
      <div className="flex-shrink-0 border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
              <p className="text-sm text-zinc-500">Upload interface will appear here...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Message Bubble Component
function MessageBubble({ message, index }: { message: Message; index: number }) {
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      className="flex gap-4"
    >
      {/* Avatar */}
      {!isSystem && (
        <div className="flex-shrink-0">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isAssistant
                ? "bg-gradient-to-br from-zinc-700 to-zinc-800"
                : "bg-gradient-to-br from-zinc-600 to-zinc-700"
            }`}
          >
            {isAssistant ? (
              <Bot className="w-4 h-4 text-white" />
            ) : (
              <User className="w-4 h-4 text-white" />
            )}
          </div>
        </div>
      )}

      {/* Message Content */}
      <div className={`flex-1 ${isSystem ? "ml-12" : ""}`}>
        {/* Role Label */}
        {!isSystem && (
          <div className="mb-1">
            <span className="text-xs font-medium text-zinc-400">
              {isAssistant ? "Assistant" : "You"}
            </span>
          </div>
        )}

        {/* Message Text */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isSystem
              ? "bg-zinc-900 border border-zinc-800"
              : isAssistant
                ? "bg-zinc-900 border border-zinc-800"
                : "bg-zinc-800 border border-zinc-700"
          }`}
        >
          <p className="text-sm text-zinc-100 leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Progress Tracker (if metadata exists) */}
          {message.metadata?.uploadProgress && (
            <div className="mt-4">
              <UploadProgressTracker
                videos={message.metadata.uploadProgress}
                overallUploadProgress={message.metadata.overallUploadProgress || 0}
                overallAIProgress={message.metadata.overallAIProgress || 0}
                isComplete={message.metadata.isComplete || false}
              />
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-1 ml-1">
          <span className="text-xs text-zinc-600">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
