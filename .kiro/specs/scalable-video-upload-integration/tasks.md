# Implementation Plan: Scalable Video Upload Integration

## Overview

This implementation plan creates a complete video upload system for the Knowlify frontend application, enabling instructors to upload large video files (up to 50GB) with multipart chunked uploads, resumable capabilities, progress tracking, and direct-to-S3 uploads. The system integrates with the existing Next.js/React/TypeScript application and replaces the current ZIP-based upload workflow with individual video uploads.

## Tasks

- [x] 1. Set up project structure and type definitions
  - Create directory structure for video upload feature
  - Define all TypeScript interfaces and types in `app/lib/types/video-upload.ts`
  - Export type definitions for use across the application
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ] 2. Implement utility functions
  - [x] 2.1 Create file validation utilities
    - Implement `validateFileType`, `validateFileSize`, `validateFileName`, and `validateVideoFile` functions in `app/lib/utils/video-upload-validators.ts`
    - Support validation for video/mp4, video/quicktime, and video/x-msvideo MIME types
    - Enforce 1KB to 50GB file size limits
    - Validate file names contain only alphanumeric characters, hyphens, underscores, and dots
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 2.3 Create progress calculation utilities
    - Implement `calculatePercentage`, `calculateSpeed`, `calculateETA`, `formatTimeRemaining`, and `formatFileSize` functions in `app/lib/utils/upload-progress.ts`
    - Use moving average for speed calculation (last 10 chunks)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 3. Implement Web Worker for checksum calculation
  - [x] 3.1 Create checksum Web Worker
    - Implement Web Worker in `app/lib/workers/checksum-worker.ts`
    - Use browser's native Web Crypto API for SHA-256 calculation
    - Handle message passing for file and chunk checksum calculation
    - Implement error handling within worker
    - _Requirements: 1.1, 1.2, 1.3, 14.2_

  - [x] 3.2 Create ChecksumCalculator service wrapper
    - Implement `ChecksumCalculator` class in `app/lib/services/checksum-calculator.ts`
    - Provide `calculate` method that wraps worker communication
    - Handle worker lifecycle (creation and termination)
    - _Requirements: 1.1, 1.2, 1.3_

- [ ] 4. Implement IndexedDB session manager
  - [x] 4.1 Set up Dexie.js database schema
    - Install Dexie.js dependency
    - Create `UploadDatabase` class extending Dexie in `app/lib/services/session-manager.ts`
    - Define sessions table with indexes on sessionId, instructorId, fileName, status, createdAt, updatedAt
    - _Requirements: 6.1, 6.2_

  - [x] 4.2 Implement SessionManager service
    - Implement `saveSession`, `getSession`, `listSessions`, `deleteSession`, `findIncompleteSession`, and `cleanupOldSessions` methods
    - Support filtering by status and pagination
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 19.1, 19.2, 19.3, 19.4_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement backend API client
  - [x] 6.1 Create VideoUploadAPI service
    - Implement `initiateUpload`, `reportChunkComplete`, `refreshUrl`, `cancelUpload`, `getUploadStatus`, and `listSessions` methods in `app/lib/api/video-uploads.ts`
    - Use Axios for HTTP requests with custom interceptors
    - Include JWT token in Authorization header for all requests
    - Handle response status codes (200, 201, 202, 400, 401, 403, 409, 429, 500)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 4.2, 4.3, 4.4, 4.5, 7.2, 11.1, 18.2, 18.3, 19.2, 19.3, 19.4_

- [ ] 7. Implement chunk uploader service
  - [x] 7.1 Create ChunkUploader service
    - Implement `uploadChunk`, `uploadChunkWithRetry`, `splitFile`, and `readChunk` methods in `app/lib/services/chunk-uploader.ts`
    - Upload chunks directly to S3 using pre-signed URLs via HTTP PUT
    - Extract ETag from S3 response headers
    - Implement exponential backoff retry logic (2s, 4s, 8s) with max 3 retries
    - Handle 403 errors by requesting refreshed pre-signed URL
    - Read chunks on-demand to minimize memory usage
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 9.1, 9.2, 9.4, 14.1, 14.3, 14.4, 18.1, 18.4_

- [ ] 8. Implement React hooks
  - [x] 8.1 Create useUploadProgress hook
    - Implement `useUploadProgress` hook in `app/lib/hooks/use-upload-progress.ts`
    - Provide `updateProgress`, `getProgress`, and `reset` methods
    - Calculate percentage, average speed (moving average), and ETA
    - Throttle updates to maximum once per second
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 14.5_

  - [x] 8.4 Create useUploadSession hook
    - Implement `useUploadSession` hook in `app/lib/hooks/use-upload-session.ts`
    - Provide `saveSession`, `getSession`, `listSessions`, `deleteSession`, and `findIncompleteSession` methods
    - Integrate with SessionManager service

  - [x] 8.5 Create useVideoUpload hook
    - Implement `useVideoUpload` hook in `app/lib/hooks/use-video-upload.ts`
    - Orchestrate complete upload lifecycle: validation, checksum calculation, initiation, chunk uploads, progress tracking, error handling
    - Provide `upload`, `cancel`, and `resume` methods
    - Manage upload state (uploading, progress, error, sessionId)
    - Emit callbacks for onProgress, onError, and onComplete events
    - Handle all error scenarios with appropriate retry logic
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.4, 2.5, 2.6, 2.7, 3.1, 4.1, 4.4, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 10.4, 10.5, 11.2, 11.3, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 18.1, 18.2, 18.4_

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement UI components
  - [x] 10.1 Create DropZone component
    - Implement drag-and-drop zone in `app/components/features/video-upload/DropZone.tsx`
    - Highlight drop zone on drag over
    - Validate file type on drop
    - Support both drag-and-drop and traditional file input
    - Display error messages for invalid files
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6_

  - [x] 10.4 Create ProgressTracker component
    - Implement progress display in `app/components/features/video-upload/ProgressTracker.tsx`
    - Display progress bar with percentage
    - Display completed chunks / total chunks
    - Display upload speed (MB/s) and estimated time remaining
    - Display queue position and estimated start time when queued
    - Display processing status when transcoding
    - Include ARIA live region for screen reader accessibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 15.4, 15.5_

  - [x] 10.6 Create UploadQueue component
    - Implement queue display in `app/components/features/video-upload/UploadQueue.tsx`
    - Display queue position and estimated start time
    - Provide cancel button for queued uploads
    - _Requirements: 8.1, 8.2, 8.3, 8.6_

  - [x] 10.8 Create VideoUploader component
    - Implement main upload interface in `app/components/features/video-upload/VideoUploader.tsx`
    - Accept courseId and instructorId as props
    - Integrate DropZone component for file selection
    - Integrate ProgressTracker component for progress display
    - Display selected file name and size before upload
    - Provide Upload and Cancel buttons
    - Disable file input and upload button during active uploads
    - Display success messages on completion
    - Display error messages with actionable information
    - Emit onUploadComplete and onUploadError events
    - Support responsive design for desktop and tablet
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 13.2, 15.1, 15.2, 15.3, 15.4_

- [x] 11. Integrate with existing upload page
  - [x] 11.1 Modify upload page to support video uploads
    - Update `app/(protected)/upload/page.tsx` to integrate VideoUploader component
    - Add option to switch between ZIP upload and individual video upload modes
    - Pass courseId and instructorId to VideoUploader component
    - Handle upload completion events to update course metadata form
    - Support uploading multiple videos for a single course
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Write integration tests for complete workflows

- [ ] 14. Final checkpoint - Ensure all tests pass and documentation is complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
- The implementation uses TypeScript with strict mode for type safety
- Web Workers are used for CPU-intensive checksum calculations to avoid UI blocking
- IndexedDB (via Dexie.js) is used for upload session persistence
- Axios is used for HTTP requests with custom interceptors
- All components follow accessibility best practices (ARIA labels, keyboard navigation)
- Responsive design supports desktop (1920x1080+) and tablet (768x1024+) screens
