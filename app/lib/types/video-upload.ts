// Type definitions for the scalable video upload system

// Upload status enum
export type UploadStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

// Upload session from backend
export interface UploadSession {
  sessionId: string;
  uploadUrl: string;
  expiresAt: string;
  chunkSize: number;
  totalChunks: number;
  uploadId: string;
  status: UploadStatus;
  queuePosition?: number;
  estimatedStartTime?: string;
}

// Upload progress
export interface UploadProgress {
  sessionId: string;
  status: UploadStatus;
  completedChunks: number;
  totalChunks: number;
  percentComplete: number;
  averageSpeed: number; // MB/s
  estimatedTimeRemaining: number; // seconds
  queuePosition?: number;
  estimatedStartTime?: string;
}

// Chunk upload result
export interface ChunkUploadResult {
  acknowledged: boolean;
  progress: UploadProgress;
}

// Upload error
export interface UploadError {
  error: string;
  message: string;
  details?: unknown;
}

// Upload configuration
export interface UploadConfig {
  apiBaseUrl?: string;
  token?: string;
  instructorId: string;
  courseId?: string; // Optional - can be associated with course later
  maxRetries?: number;
  retryDelay?: number;
  chunkSize?: number;
  onUploadComplete?: (sessionId: string) => void;
}

// Session state (persisted in IndexedDB)
export interface UploadSessionState {
  sessionId: string;
  instructorId: string;
  courseId?: string; // Optional - can be associated with course later
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
  chunkSize: number;
  totalChunks: number;
  completedChunks: number[];
  uploadId: string;
  status: UploadStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
}

// Initiate upload parameters
export interface InitiateUploadParams {
  instructorId: string;
  courseId?: string; // Optional - can be associated with course later
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string;
}

// Session filters
export interface SessionFilters {
  status?: UploadStatus;
  page?: number;
  limit?: number;
}

// Validation options
export interface ValidationOptions {
  maxSize?: number;
  acceptedTypes?: string[];
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Checksum request (for Web Worker)
export interface ChecksumRequest {
  type: "calculate";
  data: ArrayBuffer;
  chunkNumber?: number;
}

// Checksum response (from Web Worker)
export interface ChecksumResponse {
  type: "result" | "error";
  checksum?: string;
  chunkNumber?: number;
  error?: string;
}
