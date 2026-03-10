import { useState, useCallback, useRef, useEffect } from "react";
import type { UploadConfig, UploadProgress, UploadError } from "../types/video-upload";
import { VideoUploadAPI } from "../api/video-uploads";
import { ChunkUploader } from "../services/chunk-uploader";
import { getChecksumCalculator } from "../services/checksum-calculator";
import { validateVideoFile, sanitizeFileName } from "../utils/video-upload-validators";
import { useUploadProgress } from "./use-upload-progress";
import { useUploadSession } from "./use-upload-session";
import { apiClient } from "../api";
import { unwrapApiData } from "../api/client";

type BackendAnalysisStatus =
  | "not_started"
  | "queued"
  | "downloading"
  | "transcribing"
  | "analyzing"
  | "completed"
  | "failed";

interface AnalysisProgressResponse {
  progress: {
    sessionId: string;
    progress: number;
    status: BackendAnalysisStatus;
    message: string;
    result?: {
      title: string;
      description: string;
      topics: string[];
      difficulty: "beginner" | "intermediate" | "advanced";
      duration?: number;
    };
    error?: string;
  };
}

interface UseVideoUploadReturn {
  uploading: boolean;
  progress: UploadProgress | null;
  error: UploadError | null;
  sessionId: string | null;
  analysisProgress: number; // 0-100
  analysisStatus: "not_started" | "processing" | "completed" | "failed";
  analysisResult: {
    title: string;
    description: string;
    topics: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    duration?: number;
  } | null;
  upload: (file: File) => Promise<void>;
  cancel: () => Promise<void>;
  resume: (sessionId: string, file: File) => Promise<void>;
}

/**
 * Main hook for video upload orchestration
 * Handles the complete upload lifecycle including validation, checksum calculation,
 * session management, chunk uploads, progress tracking, and error handling
 */
export function useVideoUpload(config: UploadConfig): UseVideoUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<UploadError | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisStatus, setAnalysisStatus] = useState<
    "not_started" | "processing" | "completed" | "failed"
  >("not_started");
  const [analysisResult, setAnalysisResult] = useState<{
    title: string;
    description: string;
    topics: string[];
    difficulty: "beginner" | "intermediate" | "advanced";
    duration?: number;
  } | null>(null);

  const {
    progress,
    updateProgress,
    reset: resetProgress,
  } = useUploadProgress(sessionId || undefined);
  const { saveSession, deleteSession, findIncompleteSession, getSession } = useUploadSession();

  const abortController = useRef<AbortController | null>(null);
  const currentFile = useRef<File | null>(null);
  const pollingInterval = useRef<NodeJS.Timeout | null>(null);
  const hasCalledUploadComplete = useRef(false);
  const tokenRef = useRef(config.token);
  const onUploadCompleteRef = useRef(config.onUploadComplete);

  useEffect(() => {
    tokenRef.current = config.token;
    onUploadCompleteRef.current = config.onUploadComplete;
  }, [config.token, config.onUploadComplete]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, []);

  /**
   * Poll for analysis progress when status is "processing"
   */
  useEffect(() => {
    const shouldStopPolling =
      analysisStatus === "completed" || analysisStatus === "failed" || analysisProgress === 100;
    if (shouldStopPolling) {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      return;
    }

    const shouldPoll =
      Boolean(sessionId) && (progress?.status === "processing" || analysisStatus === "processing");

    if (!shouldPoll || !sessionId) {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
      return;
    }

    if (pollingInterval.current) {
      return;
    }

    setAnalysisStatus("processing");

    const pollAnalysisProgress = async () => {
      try {
        const response = await apiClient.get(`/video-uploads/${sessionId}/analysis-progress`, {
          headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
        });

        const payload = unwrapApiData<AnalysisProgressResponse>(response.data);
        const analysisData = payload.progress;
        if (!analysisData) {
          return;
        }

        setAnalysisProgress(analysisData.progress || 0);
        if (analysisData.result) {
          setAnalysisResult(analysisData.result);
        }

        if (analysisData.status === "completed" || analysisData.progress === 100) {
          setAnalysisStatus("completed");
          setUploading(false);

          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }

          if (!hasCalledUploadComplete.current && onUploadCompleteRef.current) {
            hasCalledUploadComplete.current = true;
            onUploadCompleteRef.current(sessionId);
          }

          return;
        } else if (analysisData.status === "failed") {
          setAnalysisStatus("failed");
          setUploading(false);
          setError({
            error: "ANALYSIS_FAILED",
            message: analysisData.error || "Video analysis failed",
          });

          if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = null;
          }
        } else {
          setAnalysisStatus("processing");
        }
      } catch (err) {
        console.error("Failed to poll analysis progress:", err);
      }
    };

    // Poll immediately
    pollAnalysisProgress();

    // Then poll every 2 seconds
    pollingInterval.current = setInterval(pollAnalysisProgress, 2000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
        pollingInterval.current = null;
      }
    };
  }, [sessionId, progress?.status, analysisStatus, analysisProgress]);

  /**
   * Upload a video file
   */
  const upload = useCallback(
    async (file: File): Promise<void> => {
      try {
        setUploading(true);
        setError(null);
        setAnalysisProgress(0);
        setAnalysisStatus("not_started");
        setAnalysisResult(null);
        hasCalledUploadComplete.current = false;
        resetProgress();
        currentFile.current = file;

        // Sanitize filename
        const sanitizedFileName = sanitizeFileName(file.name);
        console.log("[Upload] Original filename:", file.name, "Sanitized:", sanitizedFileName);

        // Create a new File object with sanitized name
        const sanitizedFile = new File([file], sanitizedFileName, { type: file.type });

        // Step 1: Validate file
        const validation = validateVideoFile(sanitizedFile);
        if (!validation.valid) {
          throw {
            error: "VALIDATION_ERROR",
            message: validation.errors[0],
            details: { errors: validation.errors },
          };
        }

        // Step 2: Check for incomplete session
        const incompleteSession = await findIncompleteSession(
          config.instructorId,
          sanitizedFile.name,
          sanitizedFile.size
        );

        if (incompleteSession) {
          const shouldResume = window.confirm(
            `Found incomplete upload for ${sanitizedFile.name}. Resume?`
          );
          if (shouldResume) {
            await resume(incompleteSession.sessionId, sanitizedFile);
            return;
          } else {
            // Delete old session and start fresh
            await deleteSession(incompleteSession.sessionId);
          }
        }

        // Step 3: Calculate file checksum
        const checksumCalculator = getChecksumCalculator();
        const checksum = await checksumCalculator.calculate(sanitizedFile);

        // Step 4: Initiate upload session
        const session = await VideoUploadAPI.initiateUpload({
          instructorId: config.instructorId,
          courseId: config.courseId,
          fileName: sanitizedFile.name,
          fileSize: sanitizedFile.size,
          mimeType: sanitizedFile.type,
          checksum,
        });

        setSessionId(session.sessionId);

        // Handle queued uploads
        if (session.status === "queued") {
          // Save session state
          await saveSession({
            sessionId: session.sessionId,
            instructorId: config.instructorId,
            courseId: config.courseId,
            fileName: sanitizedFile.name,
            fileSize: sanitizedFile.size,
            mimeType: sanitizedFile.type,
            checksum,
            chunkSize: session.chunkSize,
            totalChunks: session.totalChunks,
            completedChunks: [],
            uploadId: session.uploadId,
            status: "queued",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });

          // TODO: Implement queue polling
          console.log("Upload queued. Position:", session.queuePosition);
          return;
        }

        // Step 5: Upload chunks sequentially
        await uploadChunks(
          sanitizedFile,
          session.sessionId,
          session.uploadUrl,
          session.chunkSize,
          session.totalChunks,
          checksum
        );

        // Step 6: Clean up session
        await deleteSession(session.sessionId);
      } catch (err: any) {
        console.error("[Upload Hook Error]", err);

        // Extract user-friendly error message
        let userMessage = "Upload failed";
        let errorCode = err?.error || "UPLOAD_ERROR";

        // Handle axios errors with backend response
        if (err?.response?.data) {
          const backendError = err.response.data;
          errorCode = backendError.error?.code || errorCode;

          // Map error codes to user-friendly messages
          switch (errorCode) {
            case "RATE_LIMIT_EXCEEDED":
              const retryAfterSeconds = backendError.error?.details?.retryAfter;
              userMessage =
                backendError.error?.message ||
                "You have too many uploads in progress. Please wait for some to complete before starting new ones.";
              if (typeof retryAfterSeconds === "number" && retryAfterSeconds > 0) {
                userMessage = `${userMessage} Try again in ${retryAfterSeconds} minutes.`;
              }
              break;
            case "VALIDATION_ERROR":
              userMessage =
                backendError.error?.message || "Invalid file. Please check the file type and size.";
              break;
            case "QUOTA_EXCEEDED":
              userMessage =
                backendError.error?.message ||
                "You've reached your daily upload limit. Please try again tomorrow.";
              break;
            case "SESSION_NOT_FOUND":
              userMessage = "Upload session expired. Please try uploading again.";
              break;
            case "STORAGE_ERROR":
              userMessage = "Storage error. Please try again.";
              break;
            case "DATABASE_ERROR":
              const dbDetails = backendError.error?.details?.originalError;
              userMessage = dbDetails
                ? `Server error: ${dbDetails}`
                : "Server error. Please try again in a few moments.";
              break;
            case "CHUNK_ALREADY_UPLOADED":
              userMessage =
                backendError.error?.message ||
                "This chunk was already uploaded. The upload may have been interrupted.";
              break;
            default:
              userMessage = backendError.error?.message || err?.message || "Upload failed";
          }
        } else if (err?.message) {
          userMessage = err.message;
        }

        const uploadError: UploadError = {
          error: errorCode,
          message: userMessage,
          details: err?.details || err?.response?.data?.error?.details,
        };

        console.error("[Upload Error Details]", {
          errorCode,
          userMessage,
          originalError: err,
          details: uploadError.details,
        });

        setError(uploadError);
        setUploading(false);
        throw uploadError;
      }
    },
    [config, findIncompleteSession, deleteSession, saveSession, resetProgress]
  );

  /**
   * Upload chunks sequentially
   */
  const uploadChunks = async (
    file: File,
    sessionId: string,
    initialUploadUrl: string,
    chunkSize: number,
    totalChunks: number,
    fileChecksum: string
  ): Promise<void> => {
    const checksumCalculator = getChecksumCalculator();

    for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
      // Check if upload was cancelled
      if (abortController.current?.signal.aborted) {
        throw new Error("Upload cancelled");
      }

      // Read chunk on-demand
      const boundaries = ChunkUploader.getChunkBoundaries(chunkNumber, chunkSize, file.size);
      const chunk = ChunkUploader.readChunk(file, boundaries.start, boundaries.end);

      // Upload chunk to S3
      let etag: string;
      const uploadUrl =
        chunkNumber === 1
          ? initialUploadUrl
          : await VideoUploadAPI.refreshUrl(sessionId, chunkNumber);
      try {
        etag = await ChunkUploader.uploadChunkWithRetry(
          chunk,
          uploadUrl,
          file.type,
          config.maxRetries || 3
        );
      } catch (err: any) {
        // Handle URL expiration
        if (err?.message === "S3_URL_EXPIRED") {
          try {
            const newUrl = await VideoUploadAPI.refreshUrl(sessionId, chunkNumber);
            etag = await ChunkUploader.uploadChunkWithRetry(
              chunk,
              newUrl,
              file.type,
              config.maxRetries || 3
            );
          } catch (refreshError: any) {
            throw new Error(
              `Failed to refresh upload URL: ${refreshError?.message || "Unknown error"}`
            );
          }
        } else {
          throw new Error(
            `Failed to upload chunk ${chunkNumber}: ${err?.message || "Unknown error"}`
          );
        }
      }

      // Calculate chunk checksum
      const chunkChecksum = await checksumCalculator.calculate(chunk, chunkNumber);

      // Report chunk completion
      try {
        await VideoUploadAPI.reportChunkComplete(sessionId, chunkNumber, etag, chunkChecksum);
      } catch (reportError: any) {
        // Extract detailed error from backend response
        let errorMessage = "Failed to report chunk completion";

        if (reportError?.response?.data?.error) {
          const backendError = reportError.response.data.error;
          errorMessage = backendError.message || errorMessage;

          // Add more context for specific errors
          if (backendError.code === "DATABASE_ERROR") {
            errorMessage = `Database error: ${backendError.details?.originalError || backendError.message}`;
          } else if (backendError.code === "CHUNK_ALREADY_UPLOADED") {
            errorMessage = `Chunk ${chunkNumber} was already uploaded`;
          }
        } else if (reportError?.message) {
          errorMessage = reportError.message;
        }

        throw new Error(errorMessage);
      }

      // Update progress
      updateProgress(chunkNumber, totalChunks, boundaries.size);

      // Save session state
      await saveSession({
        sessionId,
        instructorId: config.instructorId,
        courseId: config.courseId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        checksum: fileChecksum,
        chunkSize,
        totalChunks,
        completedChunks: Array.from({ length: chunkNumber }, (_, i) => i + 1),
        uploadId: "",
        status: "uploading",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  /**
   * Resume an interrupted upload
   */
  const resume = useCallback(
    async (resumeSessionId: string, file: File): Promise<void> => {
      try {
        setUploading(true);
        setError(null);
        setAnalysisProgress(0);
        setAnalysisStatus("not_started");
        setAnalysisResult(null);
        hasCalledUploadComplete.current = false;
        setSessionId(resumeSessionId);
        currentFile.current = file;

        // Get session state
        const sessionState = await getSession(resumeSessionId);
        if (!sessionState) {
          throw new Error("Session not found");
        }

        // Resume from next incomplete chunk
        const nextChunk = sessionState.completedChunks.length + 1;
        const checksumCalculator = getChecksumCalculator();

        for (let chunkNumber = nextChunk; chunkNumber <= sessionState.totalChunks; chunkNumber++) {
          const boundaries = ChunkUploader.getChunkBoundaries(
            chunkNumber,
            sessionState.chunkSize,
            file.size
          );
          const chunk = ChunkUploader.readChunk(file, boundaries.start, boundaries.end);
          const uploadUrl = await VideoUploadAPI.refreshUrl(resumeSessionId, chunkNumber);

          // Upload chunk
          const etag = await ChunkUploader.uploadChunkWithRetry(
            chunk,
            uploadUrl,
            file.type,
            config.maxRetries || 3
          );

          // Calculate checksum
          const chunkChecksum = await checksumCalculator.calculate(chunk, chunkNumber);

          // Report completion
          await VideoUploadAPI.reportChunkComplete(
            resumeSessionId,
            chunkNumber,
            etag,
            chunkChecksum
          );

          // Update progress
          updateProgress(chunkNumber, sessionState.totalChunks, boundaries.size);

          // Update session state
          sessionState.completedChunks.push(chunkNumber);
          await saveSession(sessionState);
        }

        // Clean up
        await deleteSession(resumeSessionId);
      } catch (err) {
        const uploadError: UploadError = {
          error: "RESUME_ERROR",
          message: (err as Error).message || "Resume failed",
        };
        setError(uploadError);
        setUploading(false);
        throw uploadError;
      }
    },
    [config, updateProgress, saveSession, deleteSession, getSession]
  );

  /**
   * Cancel the current upload
   */
  const cancel = useCallback(async (): Promise<void> => {
    if (!sessionId) return;

    try {
      // Abort ongoing requests
      if (abortController.current) {
        abortController.current.abort();
      }

      // Cancel on backend
      await VideoUploadAPI.cancelUpload(sessionId);

      // Clean up session
      await deleteSession(sessionId);

      setUploading(false);
      setSessionId(null);
      resetProgress();
    } catch (err) {
      console.error("Failed to cancel upload:", err);
      throw err;
    }
  }, [sessionId, deleteSession, resetProgress]);

  return {
    uploading,
    progress,
    error,
    sessionId,
    analysisProgress,
    analysisStatus,
    analysisResult,
    upload,
    cancel,
    resume,
  };
}
