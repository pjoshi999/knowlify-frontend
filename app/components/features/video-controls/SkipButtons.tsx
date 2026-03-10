"use client";

import { useState } from "react";

interface SkipButtonsProps {
  onSkip: (seconds: number) => void;
  className?: string;
}

export function SkipButtons({ onSkip, className = "" }: SkipButtonsProps) {
  const [showFeedback, setShowFeedback] = useState<"forward" | "backward" | null>(null);

  const handleSkip = (seconds: number) => {
    onSkip(seconds);
    setShowFeedback(seconds > 0 ? "forward" : "backward");

    setTimeout(() => {
      setShowFeedback(null);
    }, 500);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => handleSkip(-10)}
        className="relative p-2 text-white hover:bg-white/20 rounded transition-colors group"
        aria-label="Rewind 10 seconds"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
          10
        </span>
        {showFeedback === "backward" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></div>
          </div>
        )}
      </button>

      <button
        onClick={() => handleSkip(10)}
        className="relative p-2 text-white hover:bg-white/20 rounded transition-colors group"
        aria-label="Forward 10 seconds"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
          10
        </span>
        {showFeedback === "forward" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></div>
          </div>
        )}
      </button>
    </div>
  );
}
