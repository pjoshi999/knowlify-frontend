"use client";

import type { UploadProgress } from "@/app/lib/types/video-upload";
import { formatTimeRemaining } from "@/app/lib/utils/upload-progress";

interface ProgressTrackerProps {
  progress: UploadProgress;
  onCancel?: () => void;
  analysisProgress?: number; // 0-100
  analysisStatus?: "not_started" | "processing" | "completed" | "failed";
}

/**
 * ProgressTracker component for displaying real-time upload progress
 * Shows progress bar, statistics, and status messages
 */
export function ProgressTracker({
  progress,
  onCancel,
  analysisProgress = 0,
  analysisStatus = "not_started",
}: ProgressTrackerProps) {
  const {
    status,
    completedChunks,
    totalChunks,
    percentComplete,
    averageSpeed,
    estimatedTimeRemaining,
    queuePosition,
    estimatedStartTime,
  } = progress;

  /**
   * Render queued status
   */
  if (status === "queued") {
    return (
      <div className="w-full p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-800">Upload Queued</h3>
          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-yellow-700 bg-white border border-yellow-300 rounded-md hover:bg-yellow-50 transition-colors"
              aria-label="Cancel queued upload"
            >
              Cancel
            </button>
          )}
        </div>

        <div className="space-y-2 text-sm text-yellow-700">
          <p>
            <span className="font-medium">Position in queue:</span> {queuePosition}
          </p>
          {estimatedStartTime && (
            <p>
              <span className="font-medium">Estimated start:</span>{" "}
              {new Date(estimatedStartTime).toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* ARIA live region for screen readers */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          Upload queued. Position {queuePosition} in queue.
        </div>
      </div>
    );
  }

  /**
   * Render processing status
   */
  if (status === "processing") {
    return (
      <div className="w-full p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          {/* Spinner */}
          <svg
            className="animate-spin h-5 w-5 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-800">
              {analysisStatus === "completed" ? "Analysis Complete!" : "Processing Video"}
            </h3>
            <p className="text-sm text-blue-600 mt-1">
              {analysisStatus === "completed"
                ? "Your video has been analyzed successfully."
                : "Analyzing video content with AI. This may take a few minutes."}
            </p>
          </div>
        </div>

        {/* Analysis progress bar */}
        {analysisStatus === "processing" && (
          <div className="mb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                {analysisProgress.toFixed(0)}% Complete
              </span>
            </div>

            <div
              className="w-full h-2 bg-blue-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={analysisProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Analysis progress"
            >
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* ARIA live region */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {analysisStatus === "completed"
            ? "Video analysis complete."
            : `Video analysis in progress. ${analysisProgress.toFixed(0)}% complete.`}
        </div>
      </div>
    );
  }

  /**
   * Render uploading status
   */
  return (
    <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Uploading Video</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors"
            aria-label="Cancel upload"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {percentComplete.toFixed(1)}% Complete
          </span>
          <span className="text-sm text-gray-500">
            {completedChunks} / {totalChunks} chunks
          </span>
        </div>

        <div
          className="w-full h-3 bg-gray-200 rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
        >
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Upload statistics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Upload Speed</p>
          <p className="font-medium text-gray-900">{averageSpeed.toFixed(2)} MB/s</p>
        </div>

        <div>
          <p className="text-gray-500">Time Remaining</p>
          <p className="font-medium text-gray-900">{formatTimeRemaining(estimatedTimeRemaining)}</p>
        </div>
      </div>

      {/* ARIA live region for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Upload progress: {percentComplete.toFixed(1)}% complete. {completedChunks} of {totalChunks}{" "}
        chunks uploaded. Upload speed: {averageSpeed.toFixed(2)} megabytes per second. Estimated
        time remaining: {formatTimeRemaining(estimatedTimeRemaining)}.
      </div>
    </div>
  );
}
