"use client";

/**
 * TypingIndicator Component
 *
 * Animated indicator showing that the AI assistant is typing a response.
 *
 * Validates: Requirements 4.1
 */

export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-surface-secondary rounded-lg px-4 py-3">
        <div className="flex items-center gap-1">
          <div
            className="w-2 h-2 bg-foreground-secondary rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <div
            className="w-2 h-2 bg-foreground-secondary rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <div
            className="w-2 h-2 bg-foreground-secondary rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
