"use client";

/**
 * UploadProgressTracker Component
 *
 * Beautiful, elegant progress tracker for video uploads and AI analysis
 * Design: Black, dark gray, and white color scheme
 * Style: Modern, minimal, ChatGPT-inspired
 *
 * Features:
 * - Dual progress tracking (upload + AI analysis)
 * - Smooth animations with Framer Motion
 * - Real-time status updates
 * - Responsive design for all screens
 */

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Loader2, Upload, Sparkles, AlertCircle } from "lucide-react";

export interface VideoProgress {
  id: string;
  fileName: string;
  uploadProgress: number; // 0-100
  uploadStatus: "pending" | "uploading" | "completed" | "failed";
  aiAnalysisStatus: "pending" | "analyzing" | "completed" | "failed";
  aiProgress?: number; // 0-100 (optional)
}

export interface UploadProgressTrackerProps {
  videos: VideoProgress[];
  overallUploadProgress: number; // 0-100
  overallAIProgress: number; // 0-100
  isComplete: boolean;
}

export function UploadProgressTracker({
  videos,
  overallUploadProgress,
  overallAIProgress,
  isComplete,
}: UploadProgressTrackerProps) {
  const completedUploads = videos.filter((v) => v.uploadStatus === "completed").length;
  const completedAnalysis = videos.filter((v) => v.aiAnalysisStatus === "completed").length;
  const totalVideos = videos.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto"
    >
      {/* Overall Progress Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">Course Upload Progress</h3>
          {isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 text-green-400"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Complete</span>
            </motion.div>
          )}
        </div>

        {/* Upload Progress Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">Video Upload</span>
            </div>
            <span className="text-sm text-zinc-400">
              {completedUploads}/{totalVideos} videos
            </span>
          </div>

          {/* Upload Progress Bar */}
          <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-zinc-400 to-zinc-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallUploadProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 text-right">
            <span className="text-xs text-zinc-500">{Math.round(overallUploadProgress)}%</span>
          </div>
        </div>

        {/* AI Analysis Progress Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-300">AI Analysis</span>
            </div>
            <span className="text-sm text-zinc-400">
              {completedAnalysis}/{totalVideos} analyzed
            </span>
          </div>

          {/* AI Progress Bar */}
          <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-white to-zinc-200 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallAIProgress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 text-right">
            <span className="text-xs text-zinc-500">{Math.round(overallAIProgress)}%</span>
          </div>
        </div>
      </div>

      {/* Individual Video Progress */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                {/* Video Info */}
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm text-white truncate font-medium">{video.fileName}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {/* Upload Status */}
                    <div className="flex items-center gap-1.5">
                      {video.uploadStatus === "uploading" && (
                        <>
                          <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />
                          <span className="text-xs text-zinc-400">
                            Uploading {video.uploadProgress}%
                          </span>
                        </>
                      )}
                      {video.uploadStatus === "completed" && (
                        <>
                          <CheckCircle className="w-3 h-3 text-zinc-400" />
                          <span className="text-xs text-zinc-400">Uploaded</span>
                        </>
                      )}
                      {video.uploadStatus === "failed" && (
                        <>
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-400">Failed</span>
                        </>
                      )}
                      {video.uploadStatus === "pending" && (
                        <span className="text-xs text-zinc-500">Pending</span>
                      )}
                    </div>

                    {/* AI Analysis Status */}
                    <div className="flex items-center gap-1.5">
                      {video.aiAnalysisStatus === "analyzing" && (
                        <>
                          <Sparkles className="w-3 h-3 text-white animate-pulse" />
                          <span className="text-xs text-zinc-300">Analyzing...</span>
                        </>
                      )}
                      {video.aiAnalysisStatus === "completed" && (
                        <>
                          <Sparkles className="w-3 h-3 text-white" />
                          <span className="text-xs text-zinc-300">Analyzed</span>
                        </>
                      )}
                      {video.aiAnalysisStatus === "failed" && (
                        <>
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-400">Analysis failed</span>
                        </>
                      )}
                      {video.aiAnalysisStatus === "pending" && (
                        <span className="text-xs text-zinc-500">Waiting</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Icon */}
                <div className="flex-shrink-0">
                  {video.uploadStatus === "completed" && video.aiAnalysisStatus === "completed" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                    </motion.div>
                  )}
                  {(video.uploadStatus === "uploading" ||
                    video.aiAnalysisStatus === "analyzing") && (
                    <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                  )}
                  {(video.uploadStatus === "failed" || video.aiAnalysisStatus === "failed") && (
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>

              {/* Mini Progress Bar for Active Upload */}
              {video.uploadStatus === "uploading" && (
                <div className="mt-3 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-zinc-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${video.uploadProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Completion Message */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mt-6 bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-center"
          >
            <CheckCircle className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-sm text-white font-medium">All videos uploaded and analyzed!</p>
            <p className="text-xs text-zinc-400 mt-1">You can now organize them into modules</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
