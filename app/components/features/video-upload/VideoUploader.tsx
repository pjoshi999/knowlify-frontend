"use client";

import { useState, useCallback } from "react";
import { useVideoUpload } from "@/app/lib/hooks/use-video-upload";
import { DropZone } from "./DropZone";
import { ProgressTracker } from "./ProgressTracker";
import { formatFileSize } from "@/app/lib/utils/upload-progress";

interface VideoUploaderProps {
  courseId?: string; // Optional - can be associated with course later
  instructorId: string;
  onUploadComplete?: (sessionId: string) => void;
  onUploadError?: (error: Error) => void;
  maxFileSize?: number; // Default: 50GB
  acceptedFormats?: string[]; // Default: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
}

/**
 * VideoUploader component - Main interface for video uploads
 * Integrates DropZone, ProgressTracker, and useVideoUpload hook
 */
export function VideoUploader({
  courseId,
  instructorId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 50 * 1024 * 1024 * 1024, // 50GB
  acceptedFormats = ["video/mp4", "video/quicktime", "video/x-msvideo"],
}: VideoUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { uploading, progress, error, analysisProgress, analysisStatus, upload, cancel } =
    useVideoUpload({
      instructorId,
      courseId,
      onUploadComplete: (completedSessionId) => {
        setShowSuccess(true);
        if (onUploadComplete) {
          onUploadComplete(completedSessionId);
        }
      },
    });

  /**
   * Handle file selection from DropZone
   */
  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length > 0) {
      setSelectedFile(files[0] || null);
      setShowSuccess(false);
    }
  }, []);

  /**
   * Handle upload start
   */
  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      await upload(selectedFile);
      // Success handling is now done in the onUploadComplete callback
    } catch (err) {
      if (onUploadError) {
        onUploadError(err as Error);
      }
    }
  }, [selectedFile, upload, onUploadError]);

  /**
   * Handle upload cancellation
   */
  const handleCancel = useCallback(async () => {
    try {
      await cancel();
      setSelectedFile(null);
      setShowSuccess(false);
    } catch (err) {
      console.error("Failed to cancel upload:", err);
    }
  }, [cancel]);

  /**
   * Handle file removal
   */
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setShowSuccess(false);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Video</h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload your course video. Supported formats: MP4, MOV, AVI. Maximum size: 50GB.
        </p>
      </div>

      {/* Drop zone (only show if not uploading and no file selected) */}
      {!uploading && !selectedFile && (
        <DropZone
          onFilesSelected={handleFilesSelected}
          accept={acceptedFormats.join(",")}
          maxSize={maxFileSize}
          disabled={uploading}
        />
      )}

      {/* Selected file info */}
      {selectedFile && !uploading && !showSuccess && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* File icon */}
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                />
              </svg>

              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>

            <button
              onClick={handleRemoveFile}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Remove selected file"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Upload button */}
          <div className="mt-4">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full px-6 py-3 text-white bg-blue-600 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start Upload
            </button>
          </div>
        </div>
      )}

      {/* Progress tracker */}
      {uploading && progress && (
        <ProgressTracker
          progress={progress}
          onCancel={handleCancel}
          analysisProgress={analysisProgress}
          analysisStatus={analysisStatus}
        />
      )}

      {/* Error message */}
      {error && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3">
            {/* Error icon */}
            <svg
              className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Upload Error</h3>
              <p className="mt-1 text-sm text-red-700">{error.message}</p>
              {error.details !== undefined && error.details !== null && (
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {String(
                    typeof error.details === "string"
                      ? error.details
                      : JSON.stringify(error.details as Record<string, unknown>, null, 2)
                  )}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {showSuccess && !uploading && !error && (
        <div
          className="p-4 bg-green-50 border border-green-200 rounded-lg"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {/* Success icon */}
            <svg
              className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-800">Upload Complete!</h3>
              <p className="mt-1 text-sm text-green-700">
                Your video has been uploaded successfully and is being processed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
