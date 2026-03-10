"use client";

import { useState, useRef, useEffect } from "react";

interface PlaybackSpeedControlProps {
  currentSpeed: number;
  onSpeedChange: (speed: number) => void;
  className?: string;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export function PlaybackSpeedControl({
  currentSpeed,
  onSpeedChange,
  className = "",
}: PlaybackSpeedControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSpeedSelect = (speed: number) => {
    onSpeedChange(speed);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-white hover:bg-white/10 rounded-md transition-all hover:scale-105 text-sm font-medium min-w-[60px] justify-center"
        aria-label="Playback speed"
      >
        <span>{currentSpeed}x</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 backdrop-blur-sm rounded-md shadow-2xl overflow-hidden min-w-[100px] border border-white/70">
          <div className="py-1">
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedSelect(speed)}
                className={`w-full text-center px-4 py-2.5 text-sm transition-colors ${
                  speed === currentSpeed
                    ? "bg-white/20 text-white font-semibold"
                    : "text-gray-300 hover:bg-white/10 font-medium"
                }`}
              >
                {speed === 1 ? "Normal" : `${speed}x`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
