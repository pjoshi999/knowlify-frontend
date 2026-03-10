"use client";

/**
 * Video Player Component
 *
 * Advanced video player with:
 * - Automatic progress tracking
 * - Resume from last position
 * - Completion detection
 * - Responsive design
 */

import { useEffect, useRef, useState } from "react";
import { useUpdateProgress } from "@/app/lib/hooks/use-progress";

interface VideoPlayerProps {
  src: string;
  enrollmentId: string;
  lessonId: string;
  lastPosition?: number;
  duration?: number;
  onComplete?: () => void;
  onProgress?: (position: number) => void;
  className?: string;
}

export function VideoPlayer({
  src,
  enrollmentId,
  lessonId,
  lastPosition = 0,
  duration: _duration,
  onComplete,
  onProgress,
  className = "",
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasResumed, setHasResumed] = useState(false);
  const lastSavedPosition = useRef(0);
  const saveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { mutate: updateProgress } = useUpdateProgress();

  // Resume from last position
  useEffect(() => {
    if (isReady && !hasResumed && lastPosition > 0 && videoRef.current) {
      videoRef.current.currentTime = lastPosition;
    }
  }, [isReady, hasResumed, lastPosition]);

  // Mark as resumed after seeking
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isReady && !hasResumed && lastPosition > 0) {
      timeoutId = setTimeout(() => {
        setHasResumed(true);
      }, 100);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isReady, hasResumed, lastPosition]);

  // Save progress periodically
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !enrollmentId || !lessonId) return;

    const saveProgress = () => {
      const position = Math.floor(video.currentTime);

      // Only save if position changed significantly (5 seconds)
      if (Math.abs(position - lastSavedPosition.current) >= 5) {
        lastSavedPosition.current = position;

        updateProgress({
          enrollmentId,
          data: {
            sectionId: lessonId,
            completed: false,
            timeSpent: position,
          },
        });

        onProgress?.(position);
      }
    };

    // Save every 10 seconds
    saveIntervalRef.current = setInterval(saveProgress, 10000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [enrollmentId, lessonId, updateProgress, onProgress]);

  // Handle video end
  const handleEnded = () => {
    const video = videoRef.current;
    if (!video) return;

    // Mark as completed
    updateProgress({
      enrollmentId,
      data: {
        sectionId: lessonId,
        completed: true,
        timeSpent: Math.floor(video.duration),
      },
    });

    onComplete?.();
  };

  // Handle video loaded
  const handleLoadedMetadata = () => {
    setIsReady(true);
  };

  // Save progress before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      const video = videoRef.current;
      if (video && enrollmentId && lessonId) {
        const position = Math.floor(video.currentTime);

        // Use sendBeacon for reliable tracking on page unload
        const data = JSON.stringify({
          sectionId: lessonId,
          completed: false,
          timeSpent: position,
        });

        navigator.sendBeacon(`/api/enrollments/${enrollmentId}/progress`, data);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enrollmentId, lessonId]);

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={src}
        controls
        controlsList="nodownload"
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="w-full h-full"
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>

      {/* Resume indicator */}
      {lastPosition > 0 && !hasResumed && (
        <div className="absolute bottom-20 left-4 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
          Resume from {formatTime(lastPosition)}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
