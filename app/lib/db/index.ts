/**
 * IndexedDB Database Layer
 *
 * This module provides offline-first data persistence using Dexie.js (IndexedDB wrapper).
 * It supports:
 * - Course data caching for offline access
 * - Enrollment and progress tracking with sync management
 * - Generic API response caching
 * - Upload draft persistence for resuming interrupted uploads
 * - User preferences storage
 * - Search history
 * - Offline mutation queue for syncing when online
 * - Storage quota management and cleanup
 */

// Export database instance and schema
export { db, CourseMarketplaceDB } from "./schema";
export type {
  Course,
  CourseSection,
  CourseAsset,
  Enrollment,
  ProgressRecord,
  VideoProgress,
  CacheEntry,
  UploadDraft,
  UserPreference,
  SearchHistory,
  PendingMutation,
} from "./schema";

// Export services
export {
  courseService,
  courseSectionService,
  courseAssetService,
  enrollmentService,
  progressService,
  videoProgressService,
  cacheService,
  uploadDraftService,
  preferenceService,
  searchHistoryService,
  mutationQueueService,
} from "./service";

// Export quota management
export {
  getStorageQuota,
  hasStorageAvailable,
  getStorageBreakdown,
  requestPersistentStorage,
  isStoragePersisted,
  cleanupOldCache,
  emergencyCleanup,
  monitorStorage,
  formatBytes,
} from "./quota";
export type { StorageQuota, StorageBreakdown } from "./quota";
