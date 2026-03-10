import Dexie, { type EntityTable } from "dexie";

/**
 * Course data stored locally for offline access
 */
export interface Course {
  id: string;
  instructorId: string;
  name: string;
  description: string;
  price: number;
  thumbnailUrl?: string;
  category?: string;
  published: boolean;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  // Metadata for cache management
  cachedAt: Date;
}

/**
 * Course sections with content structure
 */
export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  durationMinutes: number;
  createdAt: Date;
  // Metadata for cache management
  cachedAt: Date;
}

/**
 * Course assets (videos, documents, etc.)
 */
export interface CourseAsset {
  id: string;
  sectionId: string;
  type: "video" | "document" | "quiz" | "exam";
  filename: string;
  storageKey: string;
  url: string;
  sizeBytes: number;
  metadata: {
    duration?: number;
    pageCount?: number;
    resolution?: string;
    format?: string;
    mimeType: string;
  };
  orderIndex: number;
  createdAt: Date;
  // Metadata for cache management
  cachedAt: Date;
}

/**
 * Student enrollments in courses
 */
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  paymentId: string;
  progressPercentage: number;
  enrolledAt: Date;
  lastAccessed?: Date;
  // Metadata for sync management
  syncedAt: Date;
  needsSync: boolean;
}

/**
 * Progress tracking for course sections
 */
export interface ProgressRecord {
  id: string;
  enrollmentId: string;
  sectionId: string;
  completed: boolean;
  timeSpentSeconds: number;
  completedAt?: Date;
  updatedAt: Date;
  // Metadata for sync management
  syncedAt: Date;
  needsSync: boolean;
}

/**
 * Video playback position for resume functionality
 */
export interface VideoProgress {
  id: string;
  userId: string;
  courseId: string;
  sectionId: string;
  assetId: string;
  currentTime: number;
  duration: number;
  updatedAt: Date;
}

/**
 * Generic API response cache
 */
export interface CacheEntry {
  key: string;
  data: unknown;
  expiresAt: Date;
  cachedAt: Date;
}

/**
 * Draft course uploads for resuming interrupted uploads
 */
export interface UploadDraft {
  id: string;
  instructorId: string;
  sessionId?: string;
  courseName?: string;
  courseDescription?: string;
  coursePrice?: number;
  category?: string;
  thumbnailUrl?: string;
  uploadedFiles: Array<{
    filename: string;
    path: string;
    size: number;
    type: string;
  }>;
  parsedStructure?: unknown;
  status: "collecting" | "parsing" | "generating" | "error";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User preferences and settings
 */
export interface UserPreference {
  userId: string;
  theme: "dark" | "light";
  language?: string;
  notifications: {
    email: boolean;
    push: boolean;
    courseUpdates: boolean;
    newContent: boolean;
  };
  playback: {
    autoplay: boolean;
    playbackSpeed: number;
    quality: "auto" | "1080p" | "720p" | "480p" | "360p";
  };
  accessibility: {
    reducedMotion: boolean;
    highContrast: boolean;
    fontSize: "small" | "medium" | "large";
  };
  updatedAt: Date;
}

/**
 * Search history for quick access
 */
export interface SearchHistory {
  id: string;
  userId: string;
  query: string;
  filters?: {
    priceRange?: [number, number];
    rating?: number;
    category?: string;
  };
  timestamp: Date;
}

/**
 * Offline mutation queue for syncing when online
 */
export interface PendingMutation {
  id: string;
  type: "progress" | "enrollment" | "review" | "preference";
  endpoint: string;
  method: "POST" | "PUT" | "DELETE";
  data: unknown;
  retryCount: number;
  createdAt: Date;
  lastAttemptAt?: Date;
}

/**
 * Main database class with versioned schema
 */
export class CourseMarketplaceDB extends Dexie {
  // Tables
  courses!: EntityTable<Course, "id">;
  courseSections!: EntityTable<CourseSection, "id">;
  courseAssets!: EntityTable<CourseAsset, "id">;
  enrollments!: EntityTable<Enrollment, "id">;
  progressRecords!: EntityTable<ProgressRecord, "id">;
  videoProgress!: EntityTable<VideoProgress, "id">;
  cache!: EntityTable<CacheEntry, "key">;
  uploadDrafts!: EntityTable<UploadDraft, "id">;
  userPreferences!: EntityTable<UserPreference, "userId">;
  searchHistory!: EntityTable<SearchHistory, "id">;
  pendingMutations!: EntityTable<PendingMutation, "id">;

  constructor() {
    super("CourseMarketplaceDB");

    // Version 1: Initial schema
    this.version(1).stores({
      courses: "id, instructorId, published, createdAt, averageRating, cachedAt",
      courseSections: "id, courseId, orderIndex, cachedAt",
      courseAssets: "id, sectionId, type, orderIndex, cachedAt",
      enrollments: "id, userId, courseId, enrolledAt, syncedAt, needsSync",
      progressRecords:
        "id, [enrollmentId+sectionId], enrollmentId, sectionId, completed, syncedAt, needsSync",
      videoProgress: "id, userId, courseId, sectionId, assetId, updatedAt",
      cache: "key, expiresAt, cachedAt",
      uploadDrafts: "id, instructorId, status, createdAt, updatedAt",
      userPreferences: "userId, updatedAt",
      searchHistory: "id, userId, timestamp",
      pendingMutations: "id, type, createdAt, lastAttemptAt",
    });
  }
}

// Create and export database instance
export const db = new CourseMarketplaceDB();
