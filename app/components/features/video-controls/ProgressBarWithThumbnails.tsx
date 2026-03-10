"use client";

import { useState, useRef, MouseEvent } from "react";
import { formatTimestamp } from "@/app/lib/utils/video";

interface ProgressBarWithThumbnailsProps {
  currentTime: number;
  duration: number;
  buffered?: number;
  onSeek: (time: number) => void;
  thumbnailSprite?: string;
  thumbnailInterval?: number;
  className?: string;
}

export function ProgressBarWithThumbnails({
  currentTime,
  duration,
  buffered = 0,
  onSeek,
  thumbnailSprite: _thumbnailSprite,
  thumbnailInterval: _thumbnailInterval = 10,
  className = "",
}: ProgressBarWithThumbnailsProps) {
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    setHoverTime(time);
    setHoverPosition(percentage * 100);
  };

  const handleMouseLeave = () => {
    setHoverTime(null);
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const time = percentage * duration;

    onSeek(time);
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className={`relative ${className}`}>
      {/* Thumbnail preview */}
      {hoverTime !== null && (
        <div
          className="absolute bottom-full mb-3 transform -translate-x-1/2 pointer-events-none z-10"
          style={{ left: `${hoverPosition}%` }}
        >
          <div className="bg-black/98 backdrop-blur-sm rounded-lg shadow-2xl overflow-hidden border border-white/10">
            <div className="px-3 py-2 text-white text-sm font-medium text-center">
              {formatTimestamp(hoverTime)}
            </div>
          </div>
          {/* Arrow pointer */}
          <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-black/98 mx-auto"></div>
        </div>
      )}

      {/* Progress bar container */}
      <div
        ref={progressBarRef}
        className="relative h-1.5 bg-white/30 rounded-full cursor-pointer group hover:h-2 transition-all"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Buffered progress */}
        {bufferedPercentage > 0 && (
          <div
            className="absolute inset-y-0 left-0 bg-white/50 rounded-full"
            style={{ width: `${bufferedPercentage}%` }}
          />
        )}

        {/* Current progress */}
        <div
          className="absolute inset-y-0 left-0 bg-red-600 rounded-full transition-all duration-150"
          style={{ width: `${progressPercentage}%` }}
        />

        {/* Hover indicator */}
        {hoverTime !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/70 rounded-full"
            style={{ left: `${hoverPosition}%` }}
          />
        )}

        {/* Scrubber handle - visible when progress > 0 */}
        {progressPercentage > 0 && (
          <div
            className="absolute top-1/2 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all group-hover:w-3.5 group-hover:h-3.5"
            style={{ left: `${progressPercentage}%` }}
          />
        )}
      </div>
    </div>
  );
}
