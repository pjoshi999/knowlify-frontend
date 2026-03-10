# Requirements Document: AI-Powered Course Creation System

## Introduction

This document specifies the requirements for an AI-powered course creation system that transforms the traditional form-based upload experience into an intelligent, conversational interface. The system enables instructors to upload entire course folders, automatically analyzes content structure using OpenAI's API, and organizes materials into structured modules and lessons. The system provides a ChatGPT-style interface with beautiful animations, comprehensive course management capabilities, and background AI processing for content analysis.

## Glossary

- **System**: The AI-powered course creation platform
- **Instructor**: A user with permission to create and manage courses
- **Student**: A user who enrolls in and views courses
- **Course**: A collection of educational content organized into modules and lessons
- **Module**: A logical grouping of related lessons within a course
- **Lesson**: An individual learning unit containing a video, PDF, or image
- **Upload_Session**: A temporary container for files during the upload and analysis process
- **AI_Analyzer**: The OpenAI-powered service that analyzes content and generates insights
- **Storage_Service**: AWS S3 service for file storage
- **Job_Queue**: Background processing system for AI analysis tasks
- **Conversational_UI**: ChatGPT-style interface for course creation
- **Module_Editor**: Interactive component for organizing course structure
- **Asset**: A file resource (video, PDF, image) associated with a lesson
- **Analysis_Job**: A background task for AI content analysis
- **Structured_Path**: Hierarchical S3 storage path format for course files

## Requirements

### Requirement 1: Folder-Based Course Upload

**User Story:** As an instructor, I want to upload an entire folder of course materials at once, so that I can quickly import all my content without uploading files individually.

#### Acceptance Criteria

1. WHEN an instructor drags a folder onto the upload zone, THE System SHALL accept the folder and preserve its nested structure
2. WHEN files are being uploaded, THE System SHALL display real-time progress showing file count and upload percentage
3. WHEN the upload completes, THE System SHALL create an Upload_Session with a unique identifier and 24-hour expiration
4. THE System SHALL validate that all uploaded files are supported types (MP4, MOV, AVI, PDF, JPG, PNG)
5. THE System SHALL reject uploads exceeding 10GB total size or 5GB per individual file
6. WHEN files are uploaded, THE Storage_Service SHALL store them in temporary storage with path format: temp-uploads/{instructorId}/{sessionId}/{uuid}.{ext}
7. THE System SHALL support parallel upload of up to 3 files concurrently for optimal performance

### Requirement 2: AI-Powered Structure Analysis

**User Story:** As an instructor, I want the system to automatically analyze my folder structure and suggest course organization, so that I don't have to manually organize everything from scratch.

#### Acceptance Criteria

1. WHEN an instructor requests structure analysis, THE AI_Analyzer SHALL examine the folder hierarchy and file names to detect module patterns
2. THE AI_Analyzer SHALL recognize common naming patterns including "module", "week", "section", "chapter", and "lesson" with numbers
3. WHEN analyzing folder structure, THE AI_Analyzer SHALL use GPT-4 to generate 3-8 logical module groupings
4. THE AI_Analyzer SHALL suggest descriptive module titles based on content analysis
5. THE AI_Analyzer SHALL suggest a course name, description, and category based on the uploaded content
6. WHEN analysis completes, THE System SHALL store the suggested structure in the Upload_Session
7. THE System SHALL assign all uploaded files to exactly one module in the suggested structure

### Requirement 3: Conversational Upload Interface

**User Story:** As an instructor, I want a ChatGPT-style conversational interface for course creation, so that the process feels guided and intuitive rather than overwhelming.

#### Acceptance Criteria

1. WHEN an instructor starts course creation, THE Conversational_UI SHALL display a welcome message explaining the process
2. THE Conversational_UI SHALL display messages with smooth entrance animations using Framer Motion
3. WHEN the system provides information, THE Conversational_UI SHALL display it as an assistant message with appropriate styling
4. WHEN the instructor takes an action, THE Conversational_UI SHALL display it as a user message
5. THE Conversational_UI SHALL show upload progress as an animated progress bar within a message
6. WHEN AI analysis is running, THE Conversational_UI SHALL display an animated loading indicator with status text
7. THE Conversational_UI SHALL maintain message history throughout the course creation session

### Requirement 4: Interactive Course Structure Editing

**User Story:** As an instructor, I want to review and edit the AI-suggested course structure before publishing, so that I can ensure the organization matches my teaching approach.

#### Acceptance Criteria

1. WHEN the AI suggests a course structure, THE Module_Editor SHALL display all modules and lessons in an expandable tree view
2. THE Module_Editor SHALL support drag-and-drop reordering of modules within the course
3. THE Module_Editor SHALL support drag-and-drop reordering of lessons within a module
4. WHEN an instructor clicks on a module or lesson title, THE Module_Editor SHALL enable inline editing of the title
5. THE Module_Editor SHALL support inline editing of module and lesson descriptions
6. THE Module_Editor SHALL display lesson type icons (video, PDF, image) next to each lesson
7. WHEN an instructor deletes a module, THE Module_Editor SHALL prompt for confirmation before deletion
8. THE Module_Editor SHALL support bulk selection and deletion of multiple items

### Requirement 5: Structured Course Creation

**User Story:** As an instructor, I want my course to be created with a clear module and lesson structure, so that students can navigate the content logically.

#### Acceptance Criteria

1. WHEN an instructor confirms the course structure, THE System SHALL create a course record with DRAFT status
2. THE System SHALL create module records with sequential order numbers starting from 1
3. THE System SHALL create lesson records within each module with sequential order numbers starting from 1
4. WHEN creating lessons, THE System SHALL create corresponding asset records for each file
5. THE Storage_Service SHALL move files from temporary storage to structured paths: courses/{courseId}/modules/{moduleId}/{type}/{lessonId}.{ext}
6. THE System SHALL ensure module order values are unique within each course
7. THE System SHALL ensure lesson order values are unique within each module
8. WHEN course creation completes, THE System SHALL delete temporary files from the Upload_Session

### Requirement 6: Background AI Content Analysis

**User Story:** As an instructor, I want the system to analyze my video and document content in the background, so that I can continue working while analysis completes.

#### Acceptance Criteria

1. WHEN a course is created with lessons, THE Job_Queue SHALL enqueue an Analysis_Job for each video and PDF lesson
2. WHEN processing a video Analysis_Job, THE AI_Analyzer SHALL use Whisper to generate a transcription if audio is present
3. WHEN processing a video Analysis_Job, THE AI_Analyzer SHALL use GPT-4 to generate a summary, topics, learning objectives, key points, and difficulty level
4. WHEN processing a PDF Analysis_Job, THE AI_Analyzer SHALL extract text and use GPT-4 to generate analysis
5. WHEN an Analysis_Job completes, THE System SHALL store results in the lesson_ai_analysis table
6. IF an Analysis_Job fails, THEN THE Job_Queue SHALL retry up to 3 times with exponential backoff delays
7. WHEN an Analysis_Job completes or fails, THE System SHALL send a real-time notification via WebSocket

### Requirement 7: Module Management Operations

**User Story:** As an instructor, I want to add, edit, reorder, and delete modules after course creation, so that I can refine my course structure over time.

#### Acceptance Criteria

1. WHEN an instructor creates a new module, THE System SHALL assign it the next sequential order number
2. WHEN an instructor updates a module title or description, THE System SHALL save the changes immediately
3. WHEN an instructor reorders modules, THE System SHALL update all affected module order values to maintain sequential numbering
4. WHEN an instructor deletes a module, THE System SHALL cascade delete all lessons within that module
5. WHEN a module is deleted, THE Storage_Service SHALL delete all associated asset files from S3
6. THE System SHALL prevent creating modules with duplicate order values within the same course
7. WHEN module operations complete, THE System SHALL update the course's updatedAt timestamp

### Requirement 8: Lesson Management Operations

**User Story:** As an instructor, I want to add, edit, reorder, and delete lessons within modules, so that I can manage individual learning units.

#### Acceptance Criteria

1. WHEN an instructor creates a new lesson, THE System SHALL assign it the next sequential order number within its module
2. WHEN an instructor updates a lesson title or description, THE System SHALL save the changes immediately
3. WHEN an instructor reorders lessons within a module, THE System SHALL update all affected lesson order values
4. WHEN an instructor moves a lesson to a different module, THE System SHALL update the lesson's moduleId and recalculate order values
5. WHEN an instructor deletes a lesson, THE System SHALL delete the associated asset record
6. WHEN a lesson is deleted, THE Storage_Service SHALL delete the associated file from S3
7. THE System SHALL prevent creating lessons with duplicate order values within the same module

### Requirement 9: AI Analysis Display

**User Story:** As an instructor, I want to view AI-generated insights about my lessons, so that I can understand what students will learn and verify content quality.

#### Acceptance Criteria

1. WHEN viewing a lesson with completed analysis, THE System SHALL display the AI-generated summary
2. THE System SHALL display the list of key topics covered in the lesson
3. THE System SHALL display the learning objectives identified by the AI
4. THE System SHALL display the key points students should remember
5. WHERE difficulty level was determined, THE System SHALL display it as beginner, intermediate, or advanced
6. WHEN analysis is still processing, THE System SHALL display a "Analysis in progress" indicator
7. IF analysis failed, THEN THE System SHALL display an error message with option to retry

### Requirement 10: Enhanced Course Pages

**User Story:** As a student, I want to see courses organized by modules and lessons, so that I can understand the course structure before enrolling.

#### Acceptance Criteria

1. WHEN viewing a course page, THE System SHALL display all modules in order with their titles and descriptions
2. THE System SHALL display lesson count for each module
3. WHEN a module is expanded, THE System SHALL display all lessons within that module in order
4. THE System SHALL display lesson type icons and duration for video lessons
5. WHERE AI analysis is available, THE System SHALL display lesson summaries in the course preview
6. THE System SHALL calculate and display total course duration based on all video lessons
7. THE System SHALL display the total number of lessons across all modules

### Requirement 11: Module-Aware Learn Page

**User Story:** As a student, I want to navigate through course content by modules and lessons, so that I can follow the structured learning path.

#### Acceptance Criteria

1. WHEN viewing the learn page, THE System SHALL display a sidebar with all modules and lessons
2. THE System SHALL highlight the currently active lesson in the sidebar
3. WHEN a student clicks a lesson, THE System SHALL load and display that lesson's content
4. THE System SHALL display the current module title above the lesson content
5. THE System SHALL provide "Previous" and "Next" buttons that navigate between lessons across module boundaries
6. WHEN a student completes a lesson, THE System SHALL mark it as complete in the sidebar
7. THE System SHALL track progress as percentage of completed lessons across all modules

### Requirement 12: File Upload Security

**User Story:** As a system administrator, I want uploaded files to be validated and secured, so that malicious content cannot compromise the platform.

#### Acceptance Criteria

1. THE System SHALL validate file MIME types against the whitelist: video/mp4, video/quicktime, video/x-msvideo, application/pdf, image/jpeg, image/png
2. THE System SHALL reject files with MIME types not in the whitelist
3. THE System SHALL reject individual files exceeding 5GB in size
4. THE System SHALL reject upload sessions exceeding 10GB total size
5. THE System SHALL generate signed URLs with 1-hour expiration for all S3 file access
6. THE System SHALL apply rate limiting of 100 requests per minute per instructor on upload endpoints
7. WHERE virus scanning is configured, THE System SHALL scan uploaded files before moving them to permanent storage

### Requirement 13: Storage Path Structure

**User Story:** As a system administrator, I want course files organized in a structured hierarchy, so that storage is manageable and scalable.

#### Acceptance Criteria

1. THE Storage_Service SHALL store course thumbnails at path: courses/{courseId}/thumbnail.{ext}
2. THE Storage_Service SHALL store video lessons at path: courses/{courseId}/modules/{moduleId}/videos/{lessonId}.{ext}
3. THE Storage_Service SHALL store PDF documents at path: courses/{courseId}/modules/{moduleId}/documents/{lessonId}.pdf
4. THE Storage_Service SHALL store images at path: courses/{courseId}/modules/{moduleId}/images/{lessonId}.{ext}
5. THE Storage_Service SHALL store temporary uploads at path: temp-uploads/{instructorId}/{sessionId}/{uuid}.{ext}
6. THE System SHALL ensure all asset storagePath values follow the structured format
7. THE System SHALL ensure all storagePath values are unique across the entire system

### Requirement 14: Upload Session Management

**User Story:** As a system administrator, I want upload sessions to expire automatically, so that temporary storage doesn't accumulate indefinitely.

#### Acceptance Criteria

1. WHEN an Upload_Session is created, THE System SHALL set expiresAt to 24 hours from creation time
2. THE System SHALL run a cleanup job every hour to identify expired sessions
3. WHEN a session is expired, THE System SHALL delete all temporary files associated with that session
4. WHEN a session is expired, THE System SHALL delete the Upload_Session record from the database
5. WHEN a course is successfully created from a session, THE System SHALL mark the session status as 'complete'
6. THE System SHALL prevent analysis or course creation from expired sessions
7. THE System SHALL allow instructors to view their active upload sessions

### Requirement 15: Real-Time Progress Updates

**User Story:** As an instructor, I want to see real-time updates on AI analysis progress, so that I know when my course is ready to publish.

#### Acceptance Criteria

1. WHEN an Analysis_Job starts processing, THE System SHALL send a WebSocket message with status 'processing'
2. WHEN an Analysis_Job completes successfully, THE System SHALL send a WebSocket message with status 'completed' and the analysis results
3. IF an Analysis_Job fails, THEN THE System SHALL send a WebSocket message with status 'failed' and error details
4. THE System SHALL maintain WebSocket connections for instructors viewing their courses
5. THE System SHALL send progress updates showing completed vs total analysis jobs
6. WHEN all Analysis_Jobs for a course complete, THE System SHALL send a notification that the course is ready
7. THE System SHALL reconnect WebSocket connections automatically if they drop

### Requirement 16: Course Authorization

**User Story:** As an instructor, I want only my courses to be editable by me, so that other instructors cannot modify my content.

#### Acceptance Criteria

1. WHEN an instructor attempts to modify a module, THE System SHALL verify the instructor owns the parent course
2. WHEN an instructor attempts to modify a lesson, THE System SHALL verify the instructor owns the parent course
3. IF an instructor does not own the course, THEN THE System SHALL return a 403 Forbidden error
4. THE System SHALL allow instructors to view their own courses regardless of status
5. THE System SHALL allow students to view only PUBLISHED courses
6. THE System SHALL prevent students from accessing DRAFT courses
7. THE System SHALL log all authorization failures for security auditing

### Requirement 17: Responsive Design

**User Story:** As an instructor, I want to create courses on any device, so that I can work from my desktop, tablet, or phone.

#### Acceptance Criteria

1. WHEN viewing on mobile (0-767px), THE Conversational_UI SHALL display in single-column layout
2. WHEN viewing on tablet (768-1023px), THE Module_Editor SHALL display modules in two-column grid
3. WHEN viewing on desktop (1024-1439px), THE System SHALL display the conversational interface in a sidebar with three-column module grid
4. WHEN viewing on wide screens (1440px+), THE System SHALL display four-column module grid with expanded workspace
5. THE System SHALL use touch-friendly drag-and-drop on mobile and tablet devices
6. THE System SHALL adapt font sizes and spacing for readability on all screen sizes
7. THE System SHALL maintain 60 FPS animation performance on all supported devices

### Requirement 18: Error Recovery

**User Story:** As an instructor, I want the system to handle errors gracefully and allow me to retry failed operations, so that temporary issues don't force me to start over.

#### Acceptance Criteria

1. IF a file upload fails due to network interruption, THEN THE System SHALL allow resuming from the last successful chunk
2. IF AI analysis fails due to API rate limits, THEN THE Job_Queue SHALL retry with exponential backoff (1s, 2s, 4s)
3. IF an instructor's storage quota is exceeded, THEN THE System SHALL display current usage, limit, and upgrade options
4. IF a course name already exists for the instructor, THEN THE System SHALL display a validation error and suggest alternatives
5. WHEN an error occurs during course creation, THE System SHALL rollback all database changes and preserve temporary files
6. THE System SHALL display user-friendly error messages without exposing technical details
7. THE System SHALL log all errors with context for debugging and monitoring

### Requirement 19: Performance Optimization

**User Story:** As an instructor, I want fast upload and analysis times, so that I can publish courses quickly without long waits.

#### Acceptance Criteria

1. THE System SHALL upload files in 100MB chunks for optimal throughput
2. THE System SHALL support up to 3 concurrent file uploads for parallel processing
3. WHERE S3 Transfer Acceleration is enabled, THE System SHALL achieve minimum 50MB/s upload speed
4. THE System SHALL process video analysis in maximum 2 minutes per 10-minute video
5. THE Job_Queue SHALL process up to 5 Analysis_Jobs concurrently
6. THE System SHALL cache course structure queries for 5 minutes to reduce database load
7. THE Conversational_UI SHALL achieve initial page load in under 2 seconds and time to interactive in under 3 seconds

### Requirement 20: Data Integrity

**User Story:** As a system administrator, I want referential integrity maintained across all course data, so that orphaned records and broken references never occur.

#### Acceptance Criteria

1. WHEN a course is deleted, THE System SHALL cascade delete all modules, lessons, assets, and AI analysis records
2. WHEN a module is deleted, THE System SHALL cascade delete all lessons within that module
3. THE System SHALL enforce foreign key constraints between lessons and modules
4. THE System SHALL enforce foreign key constraints between modules and courses
5. THE System SHALL enforce foreign key constraints between lessons and assets
6. THE System SHALL prevent deletion of courses with active enrollments unless explicitly confirmed
7. THE System SHALL maintain transaction atomicity for all multi-record operations
