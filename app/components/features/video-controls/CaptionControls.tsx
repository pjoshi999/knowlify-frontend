"use client";

import { useState, useRef, useEffect } from "react";

interface CaptionTrack {
  language: string;
  label: string;
  src: string;
}

interface CaptionControlsProps {
  videoElement: HTMLVideoElement | null;
  tracks?: CaptionTrack[];
  className?: string;
}

export function CaptionControls({
  videoElement,
  tracks = [],
  className = "",
}: CaptionControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCaptionIndex, setActiveCaptionIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Handle caption track selection
  const handleCaptionToggle = (index: number) => {
    if (!videoElement) return;

    const textTracks = videoElement.textTracks;

    // Disable all tracks first
    for (let i = 0; i < textTracks.length; i++) {
      const track = textTracks[i];
      if (track && track.mode !== "hidden") {
        // Create a new track element to avoid mutating the original
        const trackElement = videoElement.querySelector(
          `track[kind="${track.kind}"][srclang="${track.language}"]`
        );
        if (trackElement) {
          trackElement.setAttribute("default", "");
        }
      }
    }

    if (index === -1) {
      // Turn off captions
      setActiveCaptionIndex(-1);
    } else if (index >= 0 && index < textTracks.length) {
      // Enable selected track
      const selectedTrack = textTracks[index];
      if (selectedTrack) {
        const trackElement = videoElement.querySelector(
          `track[kind="${selectedTrack.kind}"][srclang="${selectedTrack.language}"]`
        );
        if (trackElement) {
          trackElement.setAttribute("default", "true");
        }
      }
      setActiveCaptionIndex(index);
    }

    setIsOpen(false);
  };

  const hasCaptions = tracks.length > 0;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white hover:bg-white/20 rounded transition-colors"
        aria-label="Caption settings"
        disabled={!hasCaptions}
        title={hasCaptions ? "Caption settings" : "No captions available"}
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          {activeCaptionIndex >= 0 ? (
            // Captions ON icon
            <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z" />
          ) : (
            // Captions OFF icon
            <path d="M19 4H5c-1.11 0-2 .9-2 2v12c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1c0 .55-.45 1-1 1H7c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1c0 .55-.45 1-1 1h-3c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1h3c.55 0 1 .45 1 1v1z" />
          )}
        </svg>
      </button>

      {isOpen && hasCaptions && (
        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg shadow-lg py-2 min-w-[200px] z-50">
          <div className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase">Captions</div>

          <button
            onClick={() => handleCaptionToggle(-1)}
            className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
              activeCaptionIndex === -1 ? "text-primary bg-white/5" : "text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Off</span>
              {activeCaptionIndex === -1 && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
          </button>

          {tracks.map((track, index) => (
            <button
              key={index}
              onClick={() => handleCaptionToggle(index)}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${
                activeCaptionIndex === index ? "text-primary bg-white/5" : "text-white"
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{track.label}</span>
                {activeCaptionIndex === index && (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
