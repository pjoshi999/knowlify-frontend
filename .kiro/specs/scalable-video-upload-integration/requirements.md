# Requirements Document: Scalable Video Upload Integration

## Introduction

This document specifies the requirements for integrating a scalable video upload system into the Knowlify frontend application. The system will enable instructors to upload large video files (up to 50GB) with multipart chunked uploads, resumable capabilities, progress tracking, and direct-to-S3 uploads to eliminate backend bottlenecks. The integration will replace or enhance the current course upload workflow to support individual video uploads with enterprise-grade reliability and performance.

## Glossary

- **Upload_Session**: A stateful representation of a video upload process, valid for 24 hours, tracking upload progress and metadata
- **Chunk**: A 100MB segment of a video file uploaded independently to enable parallel and resumable uploads
- **Pre_Signed_URL**: A time-limited S3 URL that allows direct client-to-S3 uploads without backend proxying
- **ETag**: An S3-generated identifier for an uploaded chunk used to verify successful upload
- **Checksum**: A SHA-256 hash calculated for file integrity verification
- **Video_Upload_Manager**: The main orchestrator component managing the complete upload workflow
- **Progress_Tracker**: Component responsible for tracking and displaying real-time upload progress
- **Session_Manager**: Component managing upload session lifecycle and state persistence
- **Chunk_Uploader**: Component handling individual chunk upload operations
- **Backend_API**: The video upload API endpoints at `/api/v1/video-uploads`
- **JWT_Token**: JSON Web Token used for authenticating API requests
- **Queue_Manager**: System component that manages upload queuing when system capacity is reached
- **Rate_Limiter**: System component enforcing tier-based upload quotas and concurrent upload limits

## Requirements

### Requirement 1: File Checksum Calculation

**User Story:** As an instructor, I want my video files to be verified for integrity, so that I can ensure the uploaded content matches the original file.

#### Acceptance Criteria

1. WHEN a video file is selected for upload, THE Video_Upload_Manager SHALL calculate the SHA-256 checksum of the entire file
2. THE Video_Upload_Manager SHALL use the browser's native Web Crypto API for checksum calculation
3. THE Video_Upload_Manager SHALL calculate checksums for individual chunks before reporting completion to Backend_API
4. THE Video_Upload_Manager SHALL include the file checksum in the upload initiation request
5. THE Video_Upload_Manager SHALL include chunk checksums when reporting chunk completion to Backend_API

### Requirement 2: Upload Session Initiation

**User Story:** As an instructor, I want to initiate a video upload session, so that the system can prepare for receiving my video file.

#### Acceptance Criteria

1. WHEN an instructor selects a video file, THE Video_Upload_Manager SHALL send a POST request to Backend_API at `/api/v1/video-uploads/initiate`
2. THE Video_Upload_Manager SHALL include instructorId, courseId, fileName, fileSize, mimeType, and checksum in the initiation request
3. THE Video_Upload_Manager SHALL include the JWT_Token in the Authorization header
4. WHEN Backend_API returns status 201, THE Video_Upload_Manager SHALL extract sessionId, uploadUrl, chunkSize, totalChunks, and uploadId from the response
5. WHEN Backend_API returns status 202, THE Video_Upload_Manager SHALL recognize the upload as queued and extract queuePosition and estimatedStartTime
6. WHEN Backend_API returns status 429, THE Video_Upload_Manager SHALL handle rate limiting by displaying the retry time to the user
7. WHEN Backend_API returns status 400, THE Video_Upload_Manager SHALL display validation errors to the user

### Requirement 3: Direct-to-S3 Chunk Upload

**User Story:** As an instructor, I want my video chunks uploaded directly to S3, so that uploads are fast and don't overload the backend servers.

#### Acceptance Criteria

1. WHEN an Upload_Session is ready, THE Chunk_Uploader SHALL split the video file into chunks of the size specified by Backend_API
2. THE Chunk_Uploader SHALL upload each chunk directly to S3 using the Pre_Signed_URL via HTTP PUT request
3. THE Chunk_Uploader SHALL set the Content-Type header to the video MIME type
4. THE Chunk_Uploader SHALL extract the ETag from the S3 response headers
5. WHEN S3 returns status 403, THE Chunk_Uploader SHALL request a refreshed Pre_Signed_URL from Backend_API
6. THE Chunk_Uploader SHALL retry failed chunk uploads up to 3 times with exponential backoff

### Requirement 4: Chunk Completion Reporting

**User Story:** As an instructor, I want the system to track which chunks have been uploaded, so that uploads can resume if interrupted.

#### Acceptance Criteria

1. WHEN a chunk upload to S3 completes successfully, THE Chunk_Uploader SHALL calculate the chunk's SHA-256 checksum
2. THE Chunk_Uploader SHALL send a POST request to Backend_API at `/api/v1/video-uploads/:sessionId/chunks/:chunkNumber`
3. THE Chunk_Uploader SHALL include the ETag and checksum in the completion report
4. WHEN Backend_API acknowledges the chunk, THE Progress_Tracker SHALL update the progress display
5. WHEN Backend_API returns status 409, THE Chunk_Uploader SHALL skip the chunk as already uploaded

### Requirement 5: Real-Time Progress Tracking

**User Story:** As an instructor, I want to see real-time upload progress, so that I know how long the upload will take and can monitor its status.

#### Acceptance Criteria

1. THE Progress_Tracker SHALL display the percentage of upload completion
2. THE Progress_Tracker SHALL display the number of completed chunks and total chunks
3. THE Progress_Tracker SHALL calculate and display the average upload speed in MB/s
4. THE Progress_Tracker SHALL calculate and display the estimated time remaining
5. THE Progress_Tracker SHALL update the progress display after each chunk completion
6. WHEN the upload status is queued, THE Progress_Tracker SHALL display the queue position and estimated start time
7. WHEN the upload status is processing, THE Progress_Tracker SHALL display a message indicating video transcoding is in progress

### Requirement 6: Resumable Upload Support

**User Story:** As an instructor, I want to resume interrupted uploads, so that I don't have to restart large video uploads from the beginning.

#### Acceptance Criteria

1. THE Session_Manager SHALL persist upload state to browser IndexedDB after each chunk completion
2. THE Session_Manager SHALL store sessionId, completedChunks array, totalChunks, and fileName in IndexedDB
3. WHEN the page is refreshed during an upload, THE Session_Manager SHALL check for existing upload sessions
4. WHEN an incomplete upload session is found for the same file, THE Session_Manager SHALL prompt the user to resume or start fresh
5. WHEN resuming, THE Video_Upload_Manager SHALL request a new Pre_Signed_URL for the next incomplete chunk
6. THE Video_Upload_Manager SHALL continue uploading from the first incomplete chunk
7. WHEN an upload completes successfully, THE Session_Manager SHALL remove the session state from IndexedDB

### Requirement 7: Upload Cancellation

**User Story:** As an instructor, I want to cancel an in-progress upload, so that I can stop uploads I no longer need.

#### Acceptance Criteria

1. THE Video_Upload_Manager SHALL provide a cancel button during active uploads
2. WHEN the cancel button is clicked, THE Video_Upload_Manager SHALL send a DELETE request to Backend_API at `/api/v1/video-uploads/:sessionId`
3. THE Video_Upload_Manager SHALL stop all in-progress chunk uploads
4. THE Session_Manager SHALL remove the upload state from IndexedDB
5. THE Video_Upload_Manager SHALL display a confirmation message that the upload was cancelled

### Requirement 8: Queue Management

**User Story:** As an instructor, I want to be notified when the system is busy, so that I understand why my upload is waiting and when it will start.

#### Acceptance Criteria

1. WHEN Backend_API returns status 202 during initiation, THE Queue_Manager SHALL recognize the upload as queued
2. THE Queue_Manager SHALL display the queue position to the user
3. THE Queue_Manager SHALL display the estimated start time
4. THE Queue_Manager SHALL poll Backend_API every 30 seconds for queue status updates
5. WHEN the upload moves from queued to uploading status, THE Queue_Manager SHALL begin chunk uploads
6. THE Queue_Manager SHALL allow users to cancel queued uploads

### Requirement 9: Error Handling and Retry Logic

**User Story:** As an instructor, I want the system to automatically retry failed uploads, so that temporary network issues don't cause my upload to fail.

#### Acceptance Criteria

1. WHEN a chunk upload fails, THE Chunk_Uploader SHALL retry up to 3 times with exponential backoff delays
2. WHEN a Pre_Signed_URL expires (403 error), THE Chunk_Uploader SHALL request a new URL from Backend_API
3. WHEN Backend_API returns a rate limit error (429), THE Video_Upload_Manager SHALL wait for the specified retryAfter duration
4. WHEN a network error occurs, THE Chunk_Uploader SHALL retry with delays of 2s, 4s, and 8s
5. WHEN all retries are exhausted, THE Video_Upload_Manager SHALL display a detailed error message to the user
6. THE Video_Upload_Manager SHALL log all errors to the browser console for debugging

### Requirement 10: File Validation

**User Story:** As an instructor, I want to be notified immediately if my video file is invalid, so that I don't waste time uploading unsupported files.

#### Acceptance Criteria

1. WHEN a file is selected, THE Video_Upload_Manager SHALL validate the file type is video/mp4, video/quicktime, or video/x-msvideo
2. THE Video_Upload_Manager SHALL validate the file size is between 1KB and 50GB
3. THE Video_Upload_Manager SHALL validate the file name contains only alphanumeric characters, hyphens, underscores, and dots
4. WHEN validation fails, THE Video_Upload_Manager SHALL display specific error messages for each validation failure
5. THE Video_Upload_Manager SHALL prevent upload initiation when validation fails

### Requirement 11: Authentication and Security

**User Story:** As an instructor, I want my uploads to be secure, so that only I can upload videos to my courses.

#### Acceptance Criteria

1. THE Video_Upload_Manager SHALL include the JWT_Token in the Authorization header for all Backend_API requests
2. THE Video_Upload_Manager SHALL check token expiration before initiating uploads
3. WHEN the JWT_Token is expired, THE Video_Upload_Manager SHALL request a token refresh
4. THE Video_Upload_Manager SHALL only use HTTPS connections for all API requests
5. THE Video_Upload_Manager SHALL validate that Pre_Signed_URLs use HTTPS protocol

### Requirement 12: User Interface Components

**User Story:** As an instructor, I want an intuitive upload interface, so that I can easily upload videos without confusion.

#### Acceptance Criteria

1. THE Video_Upload_Manager SHALL provide a file input element accepting video file types
2. THE Video_Upload_Manager SHALL display the selected file name and size before upload
3. THE Video_Upload_Manager SHALL provide an "Upload" button to start the upload
4. THE Video_Upload_Manager SHALL disable the file input and upload button during active uploads
5. THE Video_Upload_Manager SHALL display a progress bar showing upload completion percentage
6. THE Video_Upload_Manager SHALL display upload statistics including speed and time remaining
7. THE Video_Upload_Manager SHALL display success messages when uploads complete
8. THE Video_Upload_Manager SHALL display error messages with actionable information when uploads fail

### Requirement 13: Integration with Existing Upload Flow

**User Story:** As an instructor, I want video uploads integrated into the course creation workflow, so that I can upload videos as part of creating my course.

#### Acceptance Criteria

1. THE Video_Upload_Manager SHALL be accessible from the course upload page at `/app/(protected)/upload/page.tsx`
2. THE Video_Upload_Manager SHALL accept courseId and instructorId as configuration parameters
3. WHEN a video upload completes, THE Video_Upload_Manager SHALL emit an event with the sessionId
4. THE Video_Upload_Manager SHALL integrate with the existing course metadata form
5. THE Video_Upload_Manager SHALL support uploading multiple videos for a single course

### Requirement 14: Performance Optimization

**User Story:** As an instructor, I want fast video uploads, so that I can publish my courses quickly.

#### Acceptance Criteria

1. THE Chunk_Uploader SHALL upload chunks sequentially to avoid overwhelming the network
2. THE Video_Upload_Manager SHALL use Web Workers for checksum calculation to avoid blocking the UI
3. THE Video_Upload_Manager SHALL read file chunks on-demand to minimize memory usage for large files
4. THE Video_Upload_Manager SHALL release chunk data from memory after successful upload
5. THE Progress_Tracker SHALL throttle progress updates to maximum once per second to avoid excessive re-renders

### Requirement 15: Accessibility and Responsiveness

**User Story:** As an instructor, I want the upload interface to work on all devices, so that I can upload videos from my desktop or tablet.

#### Acceptance Criteria

1. THE Video_Upload_Manager SHALL render correctly on desktop screens (1920x1080 and above)
2. THE Video_Upload_Manager SHALL render correctly on tablet screens (768x1024 and above)
3. THE Video_Upload_Manager SHALL provide keyboard navigation for all interactive elements
4. THE Video_Upload_Manager SHALL include ARIA labels for screen reader accessibility
5. THE Progress_Tracker SHALL announce progress updates to screen readers

### Requirement 16: Video Upload Hook

**User Story:** As a developer, I want a reusable React hook for video uploads, so that I can easily integrate video uploads in multiple components.

#### Acceptance Criteria

1. THE system SHALL provide a useVideoUpload React hook
2. THE useVideoUpload hook SHALL accept configuration including apiBaseUrl, token, instructorId, and courseId
3. THE useVideoUpload hook SHALL return upload, cancel, uploading, progress, error, and sessionId
4. THE useVideoUpload hook SHALL manage upload state internally
5. THE useVideoUpload hook SHALL provide callbacks for onProgress, onError, and onComplete events
6. THE useVideoUpload hook SHALL handle all API communication with Backend_API

### Requirement 17: TypeScript Type Definitions

**User Story:** As a developer, I want complete TypeScript types for the upload system, so that I can use the API with type safety.

#### Acceptance Criteria

1. THE system SHALL define UploadSession interface with sessionId, uploadUrl, expiresAt, chunkSize, totalChunks, uploadId, status, queuePosition, and estimatedStartTime
2. THE system SHALL define UploadProgress interface with sessionId, status, completedChunks, totalChunks, percentComplete, averageSpeed, estimatedTimeRemaining, queuePosition, and estimatedStartTime
3. THE system SHALL define ChunkUploadResult interface with acknowledged and progress properties
4. THE system SHALL define UploadError interface with error, message, and details properties
5. THE system SHALL define UploadConfig interface with apiBaseUrl, token, instructorId, courseId, maxRetries, and retryDelay properties
6. THE system SHALL export all type definitions from a central types file

### Requirement 18: Pre-Signed URL Refresh

**User Story:** As an instructor, I want long uploads to continue without interruption, so that I don't have to restart uploads when URLs expire.

#### Acceptance Criteria

1. WHEN a Pre_Signed_URL expires during upload, THE Chunk_Uploader SHALL detect the 403 error from S3
2. THE Chunk_Uploader SHALL send a POST request to Backend_API at `/api/v1/video-uploads/:sessionId/refresh-url`
3. THE Chunk_Uploader SHALL include the chunkNumber in the refresh request
4. THE Chunk_Uploader SHALL retry the chunk upload with the new Pre_Signed_URL
5. THE Chunk_Uploader SHALL handle URL refresh failures by retrying the refresh request up to 3 times

### Requirement 19: Upload Session Listing

**User Story:** As an instructor, I want to see my previous upload sessions, so that I can track my upload history and resume incomplete uploads.

#### Acceptance Criteria

1. THE Session_Manager SHALL provide a method to list upload sessions for an instructor
2. THE Session_Manager SHALL send a GET request to Backend_API at `/api/v1/video-uploads?instructorId={id}`
3. THE Session_Manager SHALL support filtering by status (queued, uploading, processing, completed, failed)
4. THE Session_Manager SHALL support pagination with page and limit parameters
5. THE Session_Manager SHALL display session information including fileName, fileSize, status, and timestamps

### Requirement 20: Drag and Drop Upload

**User Story:** As an instructor, I want to drag and drop video files to upload, so that I can upload files more conveniently.

#### Acceptance Criteria

1. THE Video_Upload_Manager SHALL provide a drop zone element for drag and drop uploads
2. WHEN a file is dragged over the drop zone, THE Video_Upload_Manager SHALL highlight the drop zone
3. WHEN a file is dropped, THE Video_Upload_Manager SHALL validate the file type
4. WHEN a valid video file is dropped, THE Video_Upload_Manager SHALL initiate the upload
5. WHEN an invalid file is dropped, THE Video_Upload_Manager SHALL display an error message
6. THE Video_Upload_Manager SHALL support both drag-and-drop and traditional file input selection
