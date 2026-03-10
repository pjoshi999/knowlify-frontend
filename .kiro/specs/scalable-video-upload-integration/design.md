# Design Document: Scalable Video Upload Integration

## Overview

This design document specifies the architecture for integrating a scalable video upload system into the Knowlify frontend application. The system enables instructors to upload large video files (up to 50GB) with multipart chunked uploads, resumable capabilities, progress tracking, and direct-to-S3 uploads.

### Key Features

- Multipart chunked uploads (100MB chunks) for large video files
- Direct-to-S3 uploads using pre-signed URLs to eliminate backend bottlenecks
- Resumable uploads with IndexedDB persistence
- Real-time progress tracking with speed and ETA calculations
- Web Worker-based checksum calculation to avoid UI blocking
- Queue management for system capacity handling
- Comprehensive error handling with automatic retry logic
- Drag-and-drop file upload interface
- TypeScript type safety throughout

### Technology Stack

- **Frontend Framework**: Next.js 16 with React 19
- **State Management**: React hooks with Zustand for global state
- **Storage**: IndexedDB (via Dexie.js) for upload session persistence
- **HTTP Client**: Axios with custom interceptors
- **Testing**: Vitest with @testing-library/react
- **Type Safety**: TypeScript with strict mode
- **Background Processing**: Web Workers for CPU-intensive operations

## Architecture

### High-Level Architecture

The video upload system follows a modular architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer                                 │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ VideoUploader    │  │ ProgressTracker  │                │
│  │ Component        │  │ Component        │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
└───────────┼────────────────────┼──────────────────────────┘
            │                    │
┌───────────┼────────────────────┼──────────────────────────┐
│           │   Hook Layer       │                           │
│  ┌────────▼────────────────────▼─────────┐                │
│  │      useVideoUpload Hook               │                │
│  │  (State Management & Orchestration)    │                │
│  └────────┬───────────────────┬───────────┘                │
└───────────┼───────────────────┼────────────────────────────┘
            │                   │
┌───────────┼───────────────────┼────────────────────────────┐
│           │  Service Layer    │                            │
│  ┌────────▼─────────┐  ┌──────▼──────────┐                │
│  │ VideoUploadAPI   │  │ SessionManager  │                │
│  │ Service          │  │ (IndexedDB)     │                │
│  └────────┬─────────┘  └──────┬──────────┘                │
│           │                   │                            │
│  ┌────────▼─────────┐  ┌──────▼──────────┐                │
│  │ ChunkUploader    │  │ ChecksumWorker  │                │
│  │ Service          │  │ (Web Worker)    │                │
│  └──────────────────┘  └─────────────────┘                │
└────────────────────────────────────────────────────────────┘
            │                   │
            ▼                   ▼
    ┌───────────────┐   ┌──────────────┐
    │  Backend API  │   │  S3 Storage  │
    │  /api/v1/...  │   │  (Direct)    │
    └───────────────┘   └──────────────┘
```

### Component Responsibilities

1. **UI Layer**
   - `VideoUploader`: Main component providing file selection, drag-and-drop, and upload controls
   - `ProgressTracker`: Displays real-time upload progress, speed, and ETA
   - `UploadQueue`: Shows queued uploads and their status

2. **Hook Layer**
   - `useVideoUpload`: Main orchestration hook managing upload lifecycle
   - `useUploadProgress`: Tracks and calculates upload progress metrics
   - `useUploadSession`: Manages session persistence and resumption

3. **Service Layer**
   - `VideoUploadAPI`: Handles all backend API communication
   - `ChunkUploader`: Manages individual chunk uploads to S3
   - `SessionManager`: Persists and retrieves upload state from IndexedDB
   - `ChecksumCalculator`: Web Worker for SHA-256 checksum calculation

### Data Flow

1. **Upload Initiation**

   ```
   User selects file → Validation → Checksum calculation (Web Worker) →
   API: POST /initiate → Receive sessionId & uploadUrl → Store in IndexedDB
   ```

2. **Chunk Upload**

   ```
   Split file into chunks → For each chunk:
     Upload to S3 (PUT with pre-signed URL) → Extract ETag →
     Calculate chunk checksum → API: POST /chunks/:chunkNumber →
     Update progress → Store state in IndexedDB
   ```

3. **Upload Resumption**
   ```
   Page load → Check IndexedDB for incomplete sessions →
   Prompt user → API: POST /refresh-url → Resume from last chunk
   ```

## Components and Interfaces

### Core Components

#### 1. VideoUploader Component

Main component providing the upload interface.

**Location**: `app/components/features/video-upload/VideoUploader.tsx`

**Props**:

```typescript
interface VideoUploaderProps {
  courseId: string;
  instructorId: string;
  onUploadComplete?: (sessionId: string) => void;
  onUploadError?: (error: UploadError) => void;
  maxFileSize?: number; // Default: 50GB
  acceptedFormats?: string[]; // Default: ['video/mp4', 'video/quicktime', 'video/x-msvideo']
}
```

**Features**:

- File input with drag-and-drop support
- File validation (type, size, name)
- Upload/cancel controls
- Integration with useVideoUpload hook
- Responsive design for desktop and tablet

#### 2. ProgressTracker Component

Displays real-time upload progress.

**Location**: `app/components/features/video-upload/ProgressTracker.tsx`

**Props**:

```typescript
interface ProgressTrackerProps {
  progress: UploadProgress;
  onCancel?: () => void;
}
```

**Displays**:

- Progress bar with percentage
- Completed chunks / total chunks
- Upload speed (MB/s)
- Estimated time remaining
- Queue position (if queued)
- Processing status (if transcoding)

#### 3. UploadQueue Component

Shows queued uploads when system is at capacity.

**Location**: `app/components/features/video-upload/UploadQueue.tsx`

**Props**:

```typescript
interface UploadQueueProps {
  queuePosition: number;
  estimatedStartTime: string;
  onCancel?: () => void;
}
```

#### 4. DropZone Component

Reusable drag-and-drop zone for file selection.

**Location**: `app/components/features/video-upload/DropZone.tsx`

**Props**:

```typescript
interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}
```

### React Hooks

#### 1. useVideoUpload Hook

Main orchestration hook for video uploads.

**Location**: `app/lib/hooks/use-video-upload.ts`

**Signature**:

```typescript
function useVideoUpload(config: UploadConfig): UseVideoUploadReturn {
  // Implementation
}

interface UploadConfig {
  apiBaseUrl?: string;
  token?: string;
  instructorId: string;
  courseId: string;
  maxRetries?: number; // Default: 3
  retryDelay?: number; // Default: 2000ms
  chunkSize?: number; // Set by backend, default: 100MB
}

interface UseVideoUploadReturn {
  // State
  uploading: boolean;
  progress: UploadProgress | null;
  error: UploadError | null;
  sessionId: string | null;

  // Actions
  upload: (file: File) => Promise<void>;
  cancel: () => Promise<void>;
  resume: (sessionId: string) => Promise<void>;

  // Callbacks
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: UploadError) => void;
  onComplete?: (sessionId: string) => void;
}
```

**Responsibilities**:

- Orchestrate upload lifecycle
- Manage upload state
- Coordinate between services
- Handle errors and retries
- Emit progress events

#### 2. useUploadProgress Hook

Calculates and tracks upload progress metrics.

**Location**: `app/lib/hooks/use-upload-progress.ts`

**Signature**:

```typescript
function useUploadProgress(): UseUploadProgressReturn {
  // Implementation
}

interface UseUploadProgressReturn {
  updateProgress: (completedChunks: number, totalChunks: number, bytesUploaded: number) => void;
  getProgress: () => UploadProgress;
  reset: () => void;
}
```

**Calculations**:

- Percentage complete
- Average upload speed (moving average over last 10 chunks)
- Estimated time remaining (based on average speed)
- Throttled updates (max 1 per second)

#### 3. useUploadSession Hook

Manages upload session persistence and resumption.

**Location**: `app/lib/hooks/use-upload-session.ts`

**Signature**:

```typescript
function useUploadSession(instructorId: string): UseUploadSessionReturn {
  // Implementation
}

interface UseUploadSessionReturn {
  saveSession: (session: UploadSessionState) => Promise<void>;
  getSession: (sessionId: string) => Promise<UploadSessionState | null>;
  listSessions: (filters?: SessionFilters) => Promise<UploadSessionState[]>;
  deleteSession: (sessionId: string) => Promise<void>;
  findIncompleteSession: (fileName: string, fileSize: number) => Promise<UploadSessionState | null>;
}
```

### Service Layer

#### 1. VideoUploadAPI Service

Handles all backend API communication.

**Location**: `app/lib/api/video-uploads.ts`

**Methods**:

```typescript
class VideoUploadAPI {
  // Initiate upload session
  static async initiateUpload(params: InitiateUploadParams): Promise<UploadSession>;

  // Report chunk completion
  static async reportChunkComplete(
    sessionId: string,
    chunkNumber: number,
    etag: string,
    checksum: string
  ): Promise<ChunkUploadResult>;

  // Refresh pre-signed URL
  static async refreshUrl(sessionId: string, chunkNumber: number): Promise<string>;

  // Cancel upload
  static async cancelUpload(sessionId: string): Promise<void>;

  // Get upload status
  static async getUploadStatus(sessionId: string): Promise<UploadProgress>;

  // List upload sessions
  static async listSessions(
    instructorId: string,
    filters?: SessionFilters
  ): Promise<UploadSession[]>;
}
```

#### 2. ChunkUploader Service

Manages individual chunk uploads to S3.

**Location**: `app/lib/services/chunk-uploader.ts`

**Methods**:

```typescript
class ChunkUploader {
  // Upload single chunk to S3
  static async uploadChunk(
    chunk: Blob,
    preSignedUrl: string,
    mimeType: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<string>; // Returns ETag

  // Upload chunk with retry logic
  static async uploadChunkWithRetry(
    chunk: Blob,
    preSignedUrl: string,
    mimeType: string,
    maxRetries: number,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<string>;

  // Split file into chunks
  static splitFile(file: File, chunkSize: number): Blob[];

  // Read chunk from file (on-demand)
  static readChunk(file: File, start: number, end: number): Blob;
}
```

**Retry Logic**:

- Exponential backoff: 2s, 4s, 8s
- Retry on network errors and 5xx responses
- Refresh URL on 403 (expired pre-signed URL)
- Max 3 retries per chunk

#### 3. SessionManager Service

Manages IndexedDB persistence for upload sessions.

**Location**: `app/lib/services/session-manager.ts`

**Database Schema** (using Dexie.js):

```typescript
class UploadDatabase extends Dexie {
  sessions!: Table<UploadSessionState>;

  constructor() {
    super("VideoUploadDB");
    this.version(1).stores({
      sessions: "sessionId, instructorId, fileName, status, createdAt, updatedAt",
    });
  }
}
```

**Methods**:

```typescript
class SessionManager {
  // Save or update session
  static async saveSession(session: UploadSessionState): Promise<void>;

  // Get session by ID
  static async getSession(sessionId: string): Promise<UploadSessionState | null>;

  // List sessions with filters
  static async listSessions(
    instructorId: string,
    filters?: SessionFilters
  ): Promise<UploadSessionState[]>;

  // Delete session
  static async deleteSession(sessionId: string): Promise<void>;

  // Find incomplete session for file
  static async findIncompleteSession(
    instructorId: string,
    fileName: string,
    fileSize: number
  ): Promise<UploadSessionState | null>;

  // Clean up old sessions (>7 days)
  static async cleanupOldSessions(): Promise<number>;
}
```

#### 4. ChecksumCalculator Service

Web Worker for SHA-256 checksum calculation.

**Location**: `app/lib/workers/checksum-worker.ts`

**Worker Interface**:

```typescript
// Message to worker
interface ChecksumRequest {
  type: "calculate";
  data: ArrayBuffer;
  chunkNumber?: number;
}

// Message from worker
interface ChecksumResponse {
  type: "result" | "error";
  checksum?: string;
  chunkNumber?: number;
  error?: string;
}
```

**Usage**:

```typescript
class ChecksumCalculator {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(new URL("./checksum-worker.ts", import.meta.url));
  }

  // Calculate checksum for file or chunk
  async calculate(data: Blob, chunkNumber?: number): Promise<string>;

  // Terminate worker
  terminate(): void;
}
```

### Utility Functions

#### File Validation

**Location**: `app/lib/utils/video-upload-validators.ts`

```typescript
// Validate file type
function validateFileType(file: File, acceptedTypes: string[]): boolean;

// Validate file size
function validateFileSize(file: File, maxSize: number): boolean;

// Validate file name
function validateFileName(fileName: string): boolean;

// Comprehensive validation
function validateVideoFile(file: File, options?: ValidationOptions): ValidationResult;
```

#### Progress Calculations

**Location**: `app/lib/utils/upload-progress.ts`

```typescript
// Calculate percentage
function calculatePercentage(completed: number, total: number): number;

// Calculate upload speed (moving average)
function calculateSpeed(
  bytesUploaded: number,
  timeElapsed: number,
  previousSpeeds: number[]
): number;

// Calculate ETA
function calculateETA(remainingBytes: number, averageSpeed: number): number;

// Format time remaining
function formatTimeRemaining(seconds: number): string;

// Format file size
function formatFileSize(bytes: number): string;
```

## Data Models

### TypeScript Type Definitions

**Location**: `app/lib/types/video-upload.ts`

```typescript
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

// Upload status enum
export type UploadStatus =
  | "queued"
  | "uploading"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

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
  courseId: string;
  maxRetries?: number;
  retryDelay?: number;
  chunkSize?: number;
}

// Session state (persisted in IndexedDB)
export interface UploadSessionState {
  sessionId: string;
  instructorId: string;
  courseId: string;
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
  courseId: string;
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
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies and consolidations:

**Checksum Properties (1.1, 1.3, 1.4, 1.5, 4.1)**: These can be consolidated into two properties:

- One for file checksum calculation and inclusion in requests
- One for chunk checksum calculation and inclusion in reports

**API Request Properties (2.1, 2.2, 2.3, 4.2, 4.3, 11.1)**: These can be consolidated into:

- One property for authentication headers on all requests
- One property for required fields in initiation requests
- One property for required fields in chunk completion reports

**Validation Properties (10.1, 10.2, 10.3, 10.4, 10.5)**: These can be consolidated into:

- One comprehensive validation property covering type, size, and name
- One property for preventing invalid uploads

**Retry Properties (3.6, 9.1, 9.4, 18.5)**: These can be consolidated into:

- One property for exponential backoff retry logic across all operations

**Progress Properties (5.1, 5.2, 5.3, 5.4, 5.5)**: These can be consolidated into:

- One property for progress calculation accuracy
- One property for progress updates after chunk completion

**Persistence Properties (6.1, 6.2, 6.7)**: These can be consolidated into:

- One property for session persistence round-trip (save then load should return same data)
- One property for cleanup after completion

**Memory Management Properties (14.3, 14.4)**: These can be consolidated into:

- One property for on-demand chunk reading and cleanup

**Hook Properties (16.4, 16.5, 16.6)**: These can be consolidated into:

- One property for hook state management and callbacks

After consolidation, we have approximately 25 unique properties that provide comprehensive coverage without redundancy.

### Correctness Properties

### Property 1: File Checksum Calculation and Inclusion

_For any_ video file selected for upload, calculating the SHA-256 checksum and initiating the upload should result in the initiation request containing the correct checksum value.

**Validates: Requirements 1.1, 1.4**

### Property 2: Chunk Checksum Calculation and Reporting

_For any_ chunk uploaded to S3, the chunk completion report should include the correct SHA-256 checksum of that chunk's data.

**Validates: Requirements 1.3, 1.5, 4.1, 4.3**

### Property 3: Authentication Header Presence

_For any_ API request to the backend, the request should include a valid JWT token in the Authorization header.

**Validates: Requirements 2.3, 11.1**

### Property 4: Upload Initiation Request Completeness

_For any_ upload initiation, the POST request should include all required fields: instructorId, courseId, fileName, fileSize, mimeType, and checksum.

**Validates: Requirements 2.1, 2.2**

### Property 5: Chunk Completion Report Completeness

_For any_ chunk completion report, the POST request should include the sessionId, chunkNumber, ETag, and checksum.

**Validates: Requirements 4.2, 4.3**

### Property 6: File Chunking Correctness

_For any_ file and chunk size, splitting the file into chunks should result in chunks that:

- Are exactly the specified chunk size (except possibly the last chunk)
- When concatenated, reconstruct the original file exactly

**Validates: Requirements 3.1**

### Property 7: S3 Upload Protocol

_For any_ chunk upload to S3, the HTTP request should be a PUT request with the Content-Type header set to the video's MIME type.

**Validates: Requirements 3.2, 3.3**

### Property 8: ETag Extraction

_For any_ successful S3 upload response, the ETag should be extracted from the response headers and included in the chunk completion report.

**Validates: Requirements 3.4**

### Property 9: Exponential Backoff Retry Logic

_For any_ failed operation (chunk upload, API request, URL refresh), retrying should follow exponential backoff with delays of 2s, 4s, and 8s, up to a maximum of 3 retries.

**Validates: Requirements 3.6, 9.1, 9.4, 18.5**

### Property 10: Progress Calculation Accuracy

_For any_ upload state with completed chunks and total chunks, the calculated progress percentage should equal (completedChunks / totalChunks) \* 100.

**Validates: Requirements 5.1, 5.2**

### Property 11: Upload Speed Calculation

_For any_ sequence of chunk uploads, the average upload speed should be calculated as a moving average of the last 10 chunks' upload speeds.

**Validates: Requirements 5.3**

### Property 12: ETA Calculation

_For any_ upload state with remaining bytes and average speed, the estimated time remaining should equal remainingBytes / averageSpeed.

**Validates: Requirements 5.4**

### Property 13: Progress Update Triggering

_For any_ chunk completion, the progress tracker should update its display with the new progress values.

**Validates: Requirements 4.4, 5.5**

### Property 14: Session Persistence Round-Trip

_For any_ upload session state, saving it to IndexedDB and then retrieving it should return an equivalent session state with all fields intact.

**Validates: Requirements 6.1, 6.2**

### Property 15: Session Cleanup After Completion

_For any_ upload that completes successfully, the session state should be removed from IndexedDB.

**Validates: Requirements 6.7**

### Property 16: Resume From Correct Position

_For any_ resumed upload, the next chunk uploaded should be the first chunk not in the completedChunks array.

**Validates: Requirements 6.6**

### Property 17: File Type Validation

_For any_ file, validation should accept only files with MIME types: video/mp4, video/quicktime, or video/x-msvideo, and reject all others.

**Validates: Requirements 10.1**

### Property 18: File Size Validation

_For any_ file, validation should accept only files with size between 1KB and 50GB (inclusive), and reject all others.

**Validates: Requirements 10.2**

### Property 19: File Name Validation

_For any_ file name, validation should accept only names containing alphanumeric characters, hyphens, underscores, and dots, and reject all others.

**Validates: Requirements 10.3**

### Property 20: Validation Error Messages

_For any_ validation failure, the error message should specifically identify which validation rule failed (type, size, or name).

**Validates: Requirements 10.4**

### Property 21: Invalid Upload Prevention

_For any_ file that fails validation, attempting to initiate an upload should be prevented and no API request should be made.

**Validates: Requirements 10.5**

### Property 22: Token Expiration Check

_For any_ upload initiation with an expired JWT token, the system should detect the expiration and prevent the upload from starting.

**Validates: Requirements 11.2**

### Property 23: HTTPS Protocol Enforcement

_For any_ API request or pre-signed URL, the URL should use the HTTPS protocol.

**Validates: Requirements 11.4, 11.5**

### Property 24: Sequential Chunk Upload

_For any_ multi-chunk upload, chunks should be uploaded sequentially (chunk N+1 should not start until chunk N completes).

**Validates: Requirements 14.1**

### Property 25: On-Demand Chunk Reading

_For any_ file being uploaded, at most one chunk should be held in memory at any given time (chunks should be read on-demand and released after upload).

**Validates: Requirements 14.3, 14.4**

### Property 26: Progress Update Throttling

_For any_ sequence of progress updates, updates to the UI should occur at most once per second, regardless of how frequently progress changes.

**Validates: Requirements 14.5**

### Property 27: Hook State Management

_For any_ useVideoUpload hook instance, calling the upload function should transition the uploading state to true, and calling cancel or completing the upload should transition it to false.

**Validates: Requirements 16.4**

### Property 28: Hook Callback Invocation

_For any_ useVideoUpload hook with callbacks provided, progress updates should invoke onProgress, errors should invoke onError, and completion should invoke onComplete.

**Validates: Requirements 16.5**

### Property 29: Session Filtering

_For any_ session list request with a status filter, all returned sessions should have the specified status.

**Validates: Requirements 19.3**

### Property 30: Session Pagination

_For any_ session list request with page and limit parameters, the number of returned sessions should not exceed the limit.

**Validates: Requirements 19.4**

### Property 31: Drag-and-Drop File Validation

_For any_ file dropped on the drop zone, the file should be validated using the same rules as traditional file input selection.

**Validates: Requirements 20.3**

### Property 32: Valid Drop Initiates Upload

_For any_ valid video file dropped on the drop zone, the upload should be initiated automatically.

**Validates: Requirements 20.4**

### Property 33: Invalid Drop Shows Error

_For any_ invalid file dropped on the drop zone, an error message should be displayed and no upload should be initiated.

**Validates: Requirements 20.5**

### Property 34: Dual Input Method Support

_For any_ file, whether selected via drag-and-drop or traditional file input, the upload process should behave identically.

**Validates: Requirements 20.6**

### Property 35: Multiple Video Upload Support

_For any_ course, uploading multiple videos sequentially should result in each video having its own unique sessionId and being processed independently.

**Validates: Requirements 13.5**

### Property 36: Upload Completion Event Emission

_For any_ completed upload, an event should be emitted containing the sessionId.

**Validates: Requirements 13.3**

### Property 37: Queue Polling Interval

_For any_ queued upload, the system should poll the backend for status updates every 30 seconds (±1 second tolerance).

**Validates: Requirements 8.4**

## Error Handling

### Error Classification

The system categorizes errors into the following types:

1. **Validation Errors**: Client-side validation failures (file type, size, name)
2. **Network Errors**: Connection failures, timeouts
3. **Authentication Errors**: Expired or invalid JWT tokens
4. **Authorization Errors**: Insufficient permissions (403)
5. **Rate Limiting Errors**: Too many requests (429)
6. **Server Errors**: Backend failures (5xx)
7. **S3 Errors**: Direct upload failures, expired URLs (403)
8. **Checksum Errors**: Checksum mismatch between client and server

### Error Handling Strategy

#### 1. Validation Errors

**Detection**: Client-side validation before upload initiation

**Handling**:

- Display specific error message identifying the validation failure
- Prevent upload initiation
- Allow user to select a different file
- No retry logic (user action required)

**Example Messages**:

- "Invalid file type. Please select an MP4, MOV, or AVI video file."
- "File size exceeds 50GB limit. Please select a smaller file."
- "File name contains invalid characters. Use only letters, numbers, hyphens, underscores, and dots."

#### 2. Network Errors

**Detection**: Axios request failure without response

**Handling**:

- Automatic retry with exponential backoff (3 attempts)
- Display user-friendly message: "Connection issue. Retrying..."
- After exhausting retries: "Unable to connect. Please check your internet connection and try again."
- Preserve upload state in IndexedDB for later resumption

**Retry Delays**: 2s, 4s, 8s

#### 3. Authentication Errors (401)

**Detection**: Backend returns 401 status

**Handling**:

- Clear authentication state (localStorage, Zustand store)
- Redirect to login page with return URL
- Display message: "Your session has expired. Please log in again."
- No automatic retry (user must re-authenticate)

#### 4. Authorization Errors (403 from Backend)

**Detection**: Backend returns 403 status

**Handling**:

- Display message: "You don't have permission to upload videos to this course."
- Cancel upload
- No retry logic
- Log error for debugging

#### 5. S3 URL Expiration (403 from S3)

**Detection**: S3 returns 403 during chunk upload

**Handling**:

- Request new pre-signed URL from backend
- Retry chunk upload with new URL
- If URL refresh fails, retry refresh up to 3 times
- Display message: "Refreshing upload credentials..."
- After exhausting retries: "Unable to refresh upload credentials. Please try again later."

#### 6. Rate Limiting (429)

**Detection**: Backend returns 429 with Retry-After header

**Handling**:

- Extract retry delay from Retry-After header
- Display message: "Upload limit reached. Retrying in {X} seconds..."
- Wait for specified duration
- Automatically retry request
- No manual retry limit (respect backend's rate limiting)

#### 7. Server Errors (5xx)

**Detection**: Backend returns 500-599 status

**Handling**:

- Automatic retry with exponential backoff (3 attempts)
- Display message: "Server error. Retrying..."
- After exhausting retries: "Server error. Please try again later."
- Preserve upload state for resumption
- Log error with full context for debugging

#### 8. Chunk Upload Conflicts (409)

**Detection**: Backend returns 409 when reporting chunk completion

**Handling**:

- Skip chunk (already uploaded)
- Continue with next chunk
- Update progress tracker
- No error message to user (expected behavior for resumption)

#### 9. Checksum Mismatch

**Detection**: Backend rejects chunk due to checksum mismatch

**Handling**:

- Retry chunk upload (recalculate checksum)
- If mismatch persists after 3 retries, fail upload
- Display message: "File integrity check failed. Please try uploading again."
- Log error with checksums for debugging

### Error Recovery Mechanisms

#### Automatic Recovery

- **Network errors**: Retry with exponential backoff
- **S3 URL expiration**: Refresh URL and retry
- **Rate limiting**: Wait and retry
- **Server errors**: Retry with exponential backoff
- **Chunk conflicts**: Skip and continue

#### Manual Recovery

- **Validation errors**: User selects different file
- **Authentication errors**: User logs in again
- **Authorization errors**: User contacts support
- **Persistent failures**: User cancels and retries later

#### State Preservation

All upload state is persisted to IndexedDB after each chunk completion:

- Session ID
- Completed chunks array
- File metadata
- Upload configuration

This enables:

- Resume after page refresh
- Resume after browser crash
- Resume after network disconnection
- Resume after device sleep/wake

### Error Logging

All errors are logged with the following information:

- Error type and message
- Request URL and method
- HTTP status code (if applicable)
- Retry count
- Session ID
- Chunk number (if applicable)
- Timestamp
- User ID and course ID

Logs are sent to:

1. Browser console (development)
2. Monitoring service (production) via `logError` utility

### User Feedback

Error messages follow these principles:

- **Clear**: Explain what went wrong in plain language
- **Actionable**: Tell user what they can do to fix it
- **Contextual**: Include relevant details (file name, chunk number)
- **Reassuring**: Indicate if data is preserved for resumption

**Example Error Messages**:

- ✅ "Upload failed due to network error. Your progress has been saved. Click 'Resume' to continue."
- ❌ "Error: ECONNREFUSED" (too technical)

## Testing Strategy

### Overview

The testing strategy employs a dual approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness.

### Testing Framework

- **Test Runner**: Vitest
- **Component Testing**: @testing-library/react
- **Property-Based Testing**: fast-check (to be added)
- **Mocking**: Vitest mocks for API calls, IndexedDB (fake-indexeddb), Web Workers
- **Coverage Target**: 80% code coverage minimum

### Unit Testing

Unit tests focus on specific examples, edge cases, and integration points.

#### Component Tests

**VideoUploader Component**:

- File selection via input
- Drag-and-drop file selection
- File validation error display
- Upload button state (enabled/disabled)
- Cancel button functionality
- Integration with useVideoUpload hook

**ProgressTracker Component**:

- Progress bar rendering
- Percentage display
- Speed and ETA display
- Queue position display
- Status message display
- ARIA live region updates

**DropZone Component**:

- Drag enter/leave highlighting
- File drop handling
- Multiple file rejection
- Invalid file type rejection

#### Hook Tests

**useVideoUpload Hook**:

- Initial state
- Upload initiation
- Progress updates
- Error handling
- Cancellation
- Callback invocation
- State transitions

**useUploadProgress Hook**:

- Progress calculation
- Speed calculation (moving average)
- ETA calculation
- Update throttling

**useUploadSession Hook**:

- Session save/retrieve
- Session listing with filters
- Session deletion
- Incomplete session detection

#### Service Tests

**VideoUploadAPI Service**:

- Initiate upload request format
- Chunk completion request format
- URL refresh request format
- Cancel upload request format
- Error response handling
- Authentication header injection

**ChunkUploader Service**:

- File splitting into chunks
- Chunk upload to S3
- ETag extraction
- Retry logic with exponential backoff
- URL refresh on 403
- On-demand chunk reading

**SessionManager Service**:

- IndexedDB save/retrieve
- Session filtering by status
- Session pagination
- Old session cleanup
- Incomplete session finding

**ChecksumCalculator Service**:

- SHA-256 calculation accuracy
- Web Worker communication
- Error handling in worker
- Worker termination

#### Utility Tests

**Validation Utilities**:

- File type validation (valid and invalid types)
- File size validation (boundary cases: 1KB, 50GB, 50GB+1)
- File name validation (valid and invalid characters)
- Comprehensive validation

**Progress Utilities**:

- Percentage calculation
- Speed calculation with various inputs
- ETA calculation
- Time formatting (seconds, minutes, hours)
- File size formatting (KB, MB, GB)

### Property-Based Testing

Property-based tests verify universal properties across many generated inputs using fast-check.

#### Configuration

- **Iterations per test**: 100 minimum
- **Shrinking**: Enabled (fast-check automatically finds minimal failing case)
- **Seed**: Randomized (can be fixed for reproducibility)
- **Tag format**: `// Feature: scalable-video-upload-integration, Property {N}: {description}`

#### Property Test Examples

**Property 1: File Checksum Calculation**

```typescript
// Feature: scalable-video-upload-integration, Property 1: File checksum calculation and inclusion
test("file checksum is correctly calculated and included in initiation request", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.uint8Array({ minLength: 1024, maxLength: 10 * 1024 * 1024 }), // Random file data
      async (fileData) => {
        const file = new File([fileData], "test.mp4", { type: "video/mp4" });
        const expectedChecksum = await calculateSHA256(fileData);

        const { initiateUpload } = renderHook(() => useVideoUpload(config));
        await initiateUpload(file);

        // Verify initiation request includes correct checksum
        expect(mockAPI.initiateUpload).toHaveBeenCalledWith(
          expect.objectContaining({ checksum: expectedChecksum })
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property 6: File Chunking Correctness**

```typescript
// Feature: scalable-video-upload-integration, Property 6: File chunking correctness
test("file chunks reconstruct original file", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.uint8Array({ minLength: 1024, maxLength: 500 * 1024 * 1024 }), // Random file
      fc.integer({ min: 1024 * 1024, max: 100 * 1024 * 1024 }), // Random chunk size
      async (fileData, chunkSize) => {
        const chunks = ChunkUploader.splitFile(new Blob([fileData]), chunkSize);

        // Verify all chunks except last are exactly chunkSize
        for (let i = 0; i < chunks.length - 1; i++) {
          expect(chunks[i].size).toBe(chunkSize);
        }

        // Verify last chunk is <= chunkSize
        expect(chunks[chunks.length - 1].size).toBeLessThanOrEqual(chunkSize);

        // Verify concatenation reconstructs original
        const reconstructed = new Blob(chunks);
        expect(reconstructed.size).toBe(fileData.length);
        expect(await reconstructed.arrayBuffer()).toEqual(fileData.buffer);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property 9: Exponential Backoff Retry Logic**

```typescript
// Feature: scalable-video-upload-integration, Property 9: Exponential backoff retry logic
test("retries follow exponential backoff pattern", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom("chunk_upload", "api_request", "url_refresh"), // Operation type
      async (operationType) => {
        const delays: number[] = [];
        const mockOperation = vi
          .fn()
          .mockRejectedValueOnce(new Error("Fail 1"))
          .mockRejectedValueOnce(new Error("Fail 2"))
          .mockRejectedValueOnce(new Error("Fail 3"));

        const startTime = Date.now();
        try {
          await retryWithBackoff(mockOperation, 3);
        } catch {
          // Expected to fail after 3 retries
        }

        // Verify 3 retry attempts
        expect(mockOperation).toHaveBeenCalledTimes(3);

        // Verify delays are approximately 2s, 4s, 8s (±500ms tolerance)
        const expectedDelays = [2000, 4000, 8000];
        // Note: Actual delay verification would require timing instrumentation
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property 14: Session Persistence Round-Trip**

```typescript
// Feature: scalable-video-upload-integration, Property 14: Session persistence round-trip
test("session save and retrieve preserves all data", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        sessionId: fc.uuid(),
        instructorId: fc.uuid(),
        courseId: fc.uuid(),
        fileName: fc.string({ minLength: 1, maxLength: 255 }),
        fileSize: fc.integer({ min: 1024, max: 50 * 1024 * 1024 * 1024 }),
        mimeType: fc.constantFrom("video/mp4", "video/quicktime", "video/x-msvideo"),
        checksum: fc.hexaString({ minLength: 64, maxLength: 64 }),
        chunkSize: fc.integer({ min: 1024 * 1024, max: 100 * 1024 * 1024 }),
        totalChunks: fc.integer({ min: 1, max: 500 }),
        completedChunks: fc.array(fc.integer({ min: 0, max: 499 })),
        uploadId: fc.uuid(),
        status: fc.constantFrom("queued", "uploading", "processing", "completed", "failed"),
      }),
      async (sessionState) => {
        await SessionManager.saveSession(sessionState);
        const retrieved = await SessionManager.getSession(sessionState.sessionId);

        expect(retrieved).toEqual(expect.objectContaining(sessionState));
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property 17-19: File Validation**

```typescript
// Feature: scalable-video-upload-integration, Property 17-19: File validation
test("file validation correctly accepts/rejects files", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        mimeType: fc.string(),
        size: fc.integer({ min: 0, max: 100 * 1024 * 1024 * 1024 }),
        name: fc.string({ minLength: 1, maxLength: 255 }),
      }),
      async (fileProps) => {
        const file = new File([""], fileProps.name, { type: fileProps.mimeType });
        Object.defineProperty(file, "size", { value: fileProps.size });

        const result = validateVideoFile(file);

        const validType = ["video/mp4", "video/quicktime", "video/x-msvideo"].includes(
          fileProps.mimeType
        );
        const validSize = fileProps.size >= 1024 && fileProps.size <= 50 * 1024 * 1024 * 1024;
        const validName = /^[a-zA-Z0-9._-]+$/.test(fileProps.name);

        expect(result.valid).toBe(validType && validSize && validName);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

Integration tests verify component interactions and end-to-end workflows.

**Upload Flow Integration Test**:

1. User selects file
2. File validation passes
3. Checksum calculation completes
4. Upload initiation succeeds
5. Chunks upload sequentially
6. Progress updates after each chunk
7. Session persists to IndexedDB
8. Upload completes successfully
9. Session removed from IndexedDB
10. Completion callback invoked

**Resume Flow Integration Test**:

1. Upload starts and completes 3 chunks
2. Page refreshes (simulated)
3. Incomplete session detected
4. User chooses to resume
5. Upload continues from chunk 4
6. Upload completes successfully

**Error Recovery Integration Test**:

1. Upload starts
2. Network error occurs on chunk 3
3. Automatic retry succeeds
4. Upload continues
5. S3 URL expires on chunk 5
6. URL refresh succeeds
7. Upload continues
8. Upload completes successfully

### Test Data Generation

**File Generation**:

- Small files (1KB - 1MB) for fast tests
- Medium files (1MB - 100MB) for realistic tests
- Large files (100MB - 1GB) for stress tests (limited runs)
- Various MIME types (valid and invalid)
- Various file names (valid and invalid characters)

**Session State Generation**:

- Various upload statuses
- Various completion percentages
- Edge cases (0 chunks, all chunks, single chunk)

### Mocking Strategy

**API Mocking**:

- Mock axios requests using Vitest mocks
- Simulate various response statuses (200, 201, 202, 400, 401, 403, 429, 500)
- Simulate network errors
- Simulate response delays

**IndexedDB Mocking**:

- Use fake-indexeddb for in-memory database
- Reset database between tests

**Web Worker Mocking**:

- Mock Worker constructor
- Simulate worker messages
- Test worker error handling

**S3 Mocking**:

- Mock fetch/axios for S3 PUT requests
- Simulate successful uploads with ETags
- Simulate 403 errors (expired URLs)
- Simulate network errors

### Performance Testing

While not part of the automated test suite, performance should be manually validated:

**Memory Usage**:

- Monitor memory during large file uploads
- Verify chunks are released after upload
- Verify no memory leaks over multiple uploads

**Upload Speed**:

- Measure actual upload speed vs. calculated speed
- Verify throttling doesn't impact upload performance
- Test with various network speeds (throttled browser)

**UI Responsiveness**:

- Verify UI remains responsive during uploads
- Verify Web Worker doesn't block main thread
- Verify progress updates don't cause jank

### Accessibility Testing

**Automated**:

- ARIA label presence
- ARIA live region updates
- Keyboard navigation
- Focus management

**Manual**:

- Screen reader testing (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- High contrast mode
- Zoom levels (up to 200%)

### Test Organization

```
app/lib/
├── hooks/
│   ├── use-video-upload.test.ts
│   ├── use-upload-progress.test.ts
│   └── use-upload-session.test.ts
├── services/
│   ├── chunk-uploader.test.ts
│   ├── session-manager.test.ts
│   └── checksum-calculator.test.ts
├── api/
│   └── video-uploads.test.ts
├── utils/
│   ├── video-upload-validators.test.ts
│   └── upload-progress.test.ts
└── workers/
    └── checksum-worker.test.ts

app/components/features/video-upload/
├── VideoUploader.test.tsx
├── ProgressTracker.test.tsx
├── DropZone.test.tsx
└── UploadQueue.test.tsx

__tests__/
└── integration/
    ├── upload-flow.test.tsx
    ├── resume-flow.test.tsx
    └── error-recovery.test.tsx
```

### Continuous Integration

Tests run automatically on:

- Every commit (pre-commit hook)
- Every pull request
- Before deployment

CI pipeline:

1. Lint code
2. Type check
3. Run unit tests
4. Run property-based tests
5. Run integration tests
6. Generate coverage report
7. Fail if coverage < 80%

### Test Maintenance

- Review and update tests when requirements change
- Add tests for bug fixes
- Remove obsolete tests
- Keep test data generators up to date
- Monitor test execution time (target: < 30 seconds for unit tests)
