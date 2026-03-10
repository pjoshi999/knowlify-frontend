import { useState, useCallback, useRef, useEffect } from "react";
import type { UploadProgress } from "../types/video-upload";
import {
  calculatePercentage,
  calculateSpeed,
  calculateETA,
  bytesToMBps,
} from "../utils/upload-progress";

interface UseUploadProgressReturn {
  progress: UploadProgress | null;
  updateProgress: (completedChunks: number, totalChunks: number, bytesUploaded: number) => void;
  reset: () => void;
}

/**
 * Hook for tracking and calculating upload progress
 * Handles percentage calculation, speed tracking, and ETA estimation
 */
export function useUploadProgress(sessionId?: string): UseUploadProgressReturn {
  const [progress, setProgress] = useState<UploadProgress | null>(null);

  // Track speed history for moving average (last 10 measurements)
  const speedHistory = useRef<number[]>([]);
  const startTime = useRef<number>(0);
  const lastUpdateTime = useRef<number>(0);
  const totalBytesUploaded = useRef<number>(0);

  // Initialize refs on mount
  useEffect(() => {
    if (startTime.current === 0) {
      startTime.current = Date.now();
      lastUpdateTime.current = Date.now();
    }
  }, []);

  /**
   * Update progress with throttling (max once per second)
   */
  const updateProgress = useCallback(
    (completedChunks: number, totalChunks: number, bytesUploaded: number) => {
      const now = Date.now();

      // Throttle updates to once per second
      if (now - lastUpdateTime.current < 1000 && completedChunks < totalChunks) {
        return;
      }

      lastUpdateTime.current = now;
      totalBytesUploaded.current += bytesUploaded;

      // Calculate percentage
      const percentComplete = calculatePercentage(completedChunks, totalChunks);

      // Calculate speed (bytes per second)
      const timeElapsed = (now - startTime.current) / 1000; // Convert to seconds
      const averageSpeedBps = calculateSpeed(
        totalBytesUploaded.current,
        timeElapsed,
        speedHistory.current
      );

      // Update speed history
      speedHistory.current.push(averageSpeedBps);
      if (speedHistory.current.length > 10) {
        speedHistory.current.shift();
      }

      // Calculate ETA
      const remainingChunks = totalChunks - completedChunks;
      const avgBytesPerChunk = totalBytesUploaded.current / completedChunks;
      const remainingBytes = remainingChunks * avgBytesPerChunk;
      const estimatedTimeRemaining = calculateETA(remainingBytes, averageSpeedBps);

      // Convert speed to MB/s for display
      const averageSpeed = bytesToMBps(averageSpeedBps);

      setProgress({
        sessionId: sessionId || "",
        status: completedChunks === totalChunks ? "processing" : "uploading",
        completedChunks,
        totalChunks,
        percentComplete,
        averageSpeed,
        estimatedTimeRemaining,
      });
    },
    [sessionId]
  );

  /**
   * Reset progress tracking
   */
  const reset = useCallback(() => {
    setProgress(null);
    speedHistory.current = [];
    startTime.current = Date.now();
    lastUpdateTime.current = Date.now();
    totalBytesUploaded.current = 0;
  }, []);

  return {
    progress,
    updateProgress,
    reset,
  };
}
