"use client";

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useUpdateProgress } from "@/app/lib/hooks/use-progress";
import { formatTimestamp } from "@/app/lib/utils/video";
import { PlaybackSpeedControl } from "./video-controls/PlaybackSpeedControl";
import { ProgressBarWithThumbnails } from "./video-controls/ProgressBarWithThumbnails";

interface EnhancedVideoPlayerProps {
  src: string;
  enrollmentId: string;
  lessonId: string;
  courseId: string;
  lastPosition?: number;
  duration?: number;
  onComplete?: () => void;
  onProgress?: (position: number) => void;
  className?: string;
  viewMode?: "normal" | "theater" | "fullscreen";
  onViewModeChange?: (mode: "normal" | "theater" | "fullscreen") => void;
  nextLesson?: { id: string; title: string; thumbnail?: string };
}

export interface EnhancedVideoPlayerRef {
  videoElement: HTMLVideoElement | null;
}

export const EnhancedVideoPlayer = forwardRef<EnhancedVideoPlayerRef, EnhancedVideoPlayerProps>(
  function EnhancedVideoPlayer(
    {
      src,
      enrollmentId,
      lessonId,
      courseId,
      lastPosition = 0,
      duration: _duration,
      onComplete,
      onProgress,
      className = "",
      viewMode = "normal",
      onViewModeChange,
      nextLesson,
    },
    ref
  ) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isReady, setIsReady] = useState(false);
    const [hasResumed, setHasResumed] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showNextLessonPreview, setShowNextLessonPreview] = useState(false);
    const [videoError, setVideoError] = useState<string | null>(null);

    const lastSavedPosition = useRef(0);
    const saveIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const { mutate: updateProgress } = useUpdateProgress();

    // Expose video element to parent
    useImperativeHandle(ref, () => ({
      videoElement: videoRef.current,
    }));

    // Load playback speed from localStorage
    useEffect(() => {
      const savedSpeed = localStorage.getItem(`playbackSpeed_${courseId}`);
      if (savedSpeed) {
        const speed = parseFloat(savedSpeed);
        setPlaybackSpeed(speed);
        if (videoRef.current) {
          videoRef.current.playbackRate = speed;
        }
      }
    }, [courseId]);

    // Resume from last position
    useEffect(() => {
      if (isReady && !hasResumed && lastPosition > 0 && videoRef.current) {
        videoRef.current.currentTime = lastPosition;
        setHasResumed(true);
      }
    }, [isReady, hasResumed, lastPosition]);

    // Save progress periodically
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !enrollmentId || !lessonId) return;

      const saveProgress = () => {
        const position = Math.floor(video.currentTime);

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

      saveIntervalRef.current = setInterval(saveProgress, 30000);

      return () => {
        if (saveIntervalRef.current) {
          clearInterval(saveIntervalRef.current);
        }
      };
    }, [enrollmentId, lessonId, updateProgress, onProgress]);

    // Update current time
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      return () => video.removeEventListener("timeupdate", handleTimeUpdate);
    }, []);

    // Handle video end
    const handleEnded = () => {
      const video = videoRef.current;
      if (!video) return;

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
      const video = videoRef.current;
      if (!video) return;

      setIsReady(true);
      setVideoDuration(video.duration);
      video.playbackRate = playbackSpeed;
    };

    // Save progress before unload
    useEffect(() => {
      const handleBeforeUnload = () => {
        const video = videoRef.current;
        if (video && enrollmentId && lessonId) {
          const position = Math.floor(video.currentTime);
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

    // Auto-hide controls
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      setShowControls(true);

      if (isPlaying) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
    };

    useEffect(() => {
      return () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    }, []);

    // Playback controls
    const togglePlay = () => {
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        video.play();
        setIsPlaying(true);
      } else {
        video.pause();
        setIsPlaying(false);
      }
    };

    const handleSkip = (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    };

    const handleSeek = (time: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.currentTime = time;
    };

    const handleSpeedChange = (speed: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.playbackRate = speed;
      setPlaybackSpeed(speed);
      localStorage.setItem(`playbackSpeed_${courseId}`, speed.toString());
    };

    const handleVolumeChange = (newVolume: number) => {
      const video = videoRef.current;
      if (!video) return;

      video.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
      const video = videoRef.current;
      if (!video) return;

      if (isMuted) {
        video.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        video.volume = 0;
        setIsMuted(true);
      }
    };

    // Theater mode toggle
    const toggleTheaterMode = () => {
      if (viewMode === "theater") {
        onViewModeChange?.("normal");
      } else {
        onViewModeChange?.("theater");
      }
    };

    // Fullscreen handling
    const toggleFullscreen = async () => {
      const container = containerRef.current;
      if (!container) return;

      try {
        if (!document.fullscreenElement) {
          await container.requestFullscreen();
          setIsFullscreen(true);
          onViewModeChange?.("fullscreen");
        } else {
          await document.exitFullscreen();
          setIsFullscreen(false);
          onViewModeChange?.("normal");
        }
      } catch (error) {
        console.error("Fullscreen error:", error);
      }
    };

    // Listen for fullscreen changes
    useEffect(() => {
      const handleFullscreenChange = () => {
        const isCurrentlyFullscreen = !!document.fullscreenElement;
        setIsFullscreen(isCurrentlyFullscreen);
        if (!isCurrentlyFullscreen) {
          onViewModeChange?.("normal");
        }
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, [onViewModeChange]);

    // Show next lesson preview during last 30 seconds in fullscreen
    useEffect(() => {
      if (isFullscreen && nextLesson && videoDuration > 0) {
        const timeRemaining = videoDuration - currentTime;
        setShowNextLessonPreview(timeRemaining <= 30 && timeRemaining > 0);
      } else {
        setShowNextLessonPreview(false);
      }
    }, [isFullscreen, currentTime, videoDuration, nextLesson]);

    return (
      <div
        ref={containerRef}
        className={`relative bg-black group ${className}`}
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          onClick={togglePlay}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            const error = e.currentTarget.error;
            let errorMessage = "Unknown error";

            if (error) {
              switch (error.code) {
                case error.MEDIA_ERR_ABORTED:
                  errorMessage = "Video loading aborted";
                  break;
                case error.MEDIA_ERR_NETWORK:
                  errorMessage = "Network error - Check CloudFront CORS settings";
                  break;
                case error.MEDIA_ERR_DECODE:
                  errorMessage = "Video decoding error - File may be corrupted";
                  break;
                case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                  errorMessage = "Video format not supported by your browser";
                  break;
              }
            }

            console.error("[Video Player] Error loading video:", {
              src,
              error: errorMessage,
              errorCode: error?.code,
              networkState: e.currentTarget.networkState,
              readyState: e.currentTarget.readyState,
              message: error?.message,
            });

            setVideoError(errorMessage);
          }}
          className="w-full h-full object-contain"
          preload="metadata"
          crossOrigin="anonymous"
          playsInline
          controlsList="nodownload"
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Video Error Overlay */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-50">
            <div className="text-center px-4 sm:px-6 max-w-md">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                Unable to Load Video
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 mb-4">{videoError}</p>
              <button
                onClick={() => {
                  setVideoError(null);
                  if (videoRef.current) {
                    videoRef.current.load();
                  }
                }}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Resume indicator */}
        {lastPosition > 0 && !hasResumed && (
          <div className="absolute bottom-16 sm:bottom-20 left-2 sm:left-4 bg-black/80 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm">
            Resume from {formatTimestamp(lastPosition)}
          </div>
        )}

        {/* Next lesson preview in fullscreen */}
        {showNextLessonPreview && nextLesson && (
          <div className="absolute bottom-20 sm:bottom-24 right-2 sm:right-4 bg-black/90 text-white p-3 sm:p-4 rounded-md max-w-xs">
            <p className="text-xs text-gray-400 mb-2">Up Next</p>
            <p className="text-xs sm:text-sm font-medium">{nextLesson.title}</p>
          </div>
        )}

        {/* Custom controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent pt-20 transition-opacity duration-300 ${
            showControls ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="px-4 sm:px-6 pb-4 sm:pb-5">
            {/* Progress bar */}
            <div className="mb-3">
              <ProgressBarWithThumbnails
                currentTime={currentTime}
                duration={videoDuration}
                onSeek={handleSeek}
              />
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="p-2 text-white hover:bg-white/10 rounded-md transition-all hover:scale-105"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Skip backward - Desktop only */}
                <button
                  onClick={() => handleSkip(-10)}
                  className="hidden md:flex p-2 text-white hover:bg-white/10 rounded-md transition-all hover:scale-105"
                  aria-label="Skip backward 10 seconds"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8zm-1.1 11h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16zm4.28-1.76c0 .32-.03.6-.1.82s-.17.42-.29.57-.28.26-.45.33-.37.1-.59.10-.41-.03-.59-.1-.33-.18-.46-.33-.23-.34-.3-.57-.11-.5-.11-.82v-.74c0-.32.03-.6.1-.82s.17-.42.29-.57.28-.26.45-.33.37-.1.59-.1.41.03.59.1.33.18.46.33.23.34.3.57.11.5.11.82v.74zm-.85-.86c0-.19-.01-.35-.04-.48s-.07-.23-.12-.31-.11-.14-.19-.17-.16-.05-.25-.05-.18.02-.25.05-.14.09-.19.17-.09.18-.12.31-.04.29-.04.48v.97c0 .19.01.35.04.48s.07.24.12.32.11.14.19.17.16.05.25.05.18-.02.25-.05.14-.09.19-.17.09-.19.11-.32.04-.29.04-.48v-.97z" />
                  </svg>
                </button>

                {/* Skip forward - Desktop only */}
                <button
                  onClick={() => handleSkip(10)}
                  className="hidden md:flex p-2 text-white hover:bg-white/10 rounded-md transition-all hover:scale-105"
                  aria-label="Skip forward 10 seconds"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8zm1.1 11h.85v-3.26l1.01.31v-.69l-1.77-.63h-.09V16zm-4.28-1.76c0 .32.03.6.1.82s.17.42.29.57.28.26.45.33.37.1.59.1.41-.03.59-.1.33-.18.46-.33.23-.34.3-.57.11-.5.11-.82v-.74c0-.32-.03-.6-.1-.82s-.17-.42-.29-.57-.28-.26-.45-.33-.37-.1-.59-.1-.41.03-.59.1-.33.18-.46.33-.23.34-.3.57-.11.5-.11.82v.74zm.85-.86c0-.19.01-.35.04-.48s.07-.23.12-.31.11-.14.19-.17.16-.05.25-.05.18.02.25.05.14.09.19.17.09.18.12.31.04.29.04.48v.97c0 .19-.01.35-.04.48s-.07.24-.12.32-.11.14-.19.17-.16.05-.25.05-.18-.02-.25-.05-.14-.09-.19-.17-.09-.19-.11-.32-.04-.29-.04-.48v-.97z" />
                  </svg>
                </button>

                {/* Volume - Desktop only */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-2 text-white hover:bg-white/10 rounded-md transition-all hover:scale-105"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                      </svg>
                    ) : volume > 0.5 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                      </svg>
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-white/30 rounded-md appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                  />
                </div>

                {/* Timestamp */}
                <div className="text-white text-sm font-medium whitespace-nowrap">
                  {formatTimestamp(currentTime)} / {formatTimestamp(videoDuration)}
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                {/* Playback speed */}
                <PlaybackSpeedControl
                  currentSpeed={playbackSpeed}
                  onSpeedChange={handleSpeedChange}
                />

                {/* Theater mode toggle - Desktop only */}
                <button
                  onClick={toggleTheaterMode}
                  className="hidden lg:flex p-2 text-white hover:bg-white/10 rounded-md transition-all hover:scale-105"
                  aria-label={viewMode === "theater" ? "Exit theater mode" : "Theater mode"}
                >
                  {viewMode === "theater" ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
                    </svg>
                  )}
                </button>

                {/* Fullscreen button */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:bg-white/10 rounded-md transition-all hover:scale-105"
                  aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
