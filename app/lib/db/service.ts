import { db } from "./schema";
import type {
  Course,
  CourseSection,
  CourseAsset,
  Enrollment,
  ProgressRecord,
  VideoProgress,
  UploadDraft,
  UserPreference,
  SearchHistory,
  PendingMutation,
} from "./schema";

/**
 * Course operations
 */
export const courseService = {
  /**
   * Get all cached courses
   */
  async getAll(filters?: { published?: boolean; instructorId?: string }) {
    let query = db.courses.toCollection();

    if (filters?.instructorId) {
      query = db.courses.where("instructorId").equals(filters.instructorId);
    }

    const results = await query.toArray();

    // Apply published filter if specified
    if (filters?.published !== undefined) {
      return results.filter((course) => course.published === filters.published);
    }

    return results;
  },

  /**
   * Get a single course by ID
   */
  async getById(id: string) {
    return db.courses.get(id);
  },

  /**
   * Cache a course
   */
  async cache(course: Omit<Course, "cachedAt">) {
    return db.courses.put({
      ...course,
      cachedAt: new Date(),
    });
  },

  /**
   * Cache multiple courses
   */
  async cacheMany(courses: Omit<Course, "cachedAt">[]) {
    const coursesWithCache = courses.map((course) => ({
      ...course,
      cachedAt: new Date(),
    }));
    return db.courses.bulkPut(coursesWithCache);
  },

  /**
   * Delete a course from cache
   */
  async delete(id: string) {
    return db.courses.delete(id);
  },

  /**
   * Clear all cached courses
   */
  async clear() {
    return db.courses.clear();
  },

  /**
   * Get courses older than specified date
   */
  async getStale(olderThan: Date) {
    return db.courses.where("cachedAt").below(olderThan).toArray();
  },
};

/**
 * Course section operations
 */
export const courseSectionService = {
  /**
   * Get all sections for a course
   */
  async getByCourseId(courseId: string) {
    return db.courseSections.where("courseId").equals(courseId).sortBy("orderIndex");
  },

  /**
   * Get a single section by ID
   */
  async getById(id: string) {
    return db.courseSections.get(id);
  },

  /**
   * Cache course sections
   */
  async cacheMany(sections: Omit<CourseSection, "cachedAt">[]) {
    const sectionsWithCache = sections.map((section) => ({
      ...section,
      cachedAt: new Date(),
    }));
    return db.courseSections.bulkPut(sectionsWithCache);
  },

  /**
   * Delete sections for a course
   */
  async deleteByCourseId(courseId: string) {
    return db.courseSections.where("courseId").equals(courseId).delete();
  },
};

/**
 * Course asset operations
 */
export const courseAssetService = {
  /**
   * Get all assets for a section
   */
  async getBySectionId(sectionId: string) {
    return db.courseAssets.where("sectionId").equals(sectionId).sortBy("orderIndex");
  },

  /**
   * Get a single asset by ID
   */
  async getById(id: string) {
    return db.courseAssets.get(id);
  },

  /**
   * Cache course assets
   */
  async cacheMany(assets: Omit<CourseAsset, "cachedAt">[]) {
    const assetsWithCache = assets.map((asset) => ({
      ...asset,
      cachedAt: new Date(),
    }));
    return db.courseAssets.bulkPut(assetsWithCache);
  },

  /**
   * Delete assets for a section
   */
  async deleteBySectionId(sectionId: string) {
    return db.courseAssets.where("sectionId").equals(sectionId).delete();
  },
};

/**
 * Enrollment operations
 */
export const enrollmentService = {
  /**
   * Get all enrollments for a user
   */
  async getByUserId(userId: string) {
    return db.enrollments.where("userId").equals(userId).toArray();
  },

  /**
   * Get a specific enrollment
   */
  async getById(id: string) {
    return db.enrollments.get(id);
  },

  /**
   * Check if user is enrolled in a course
   */
  async isEnrolled(userId: string, courseId: string) {
    const enrollment = await db.enrollments
      .where("[userId+courseId]")
      .equals([userId, courseId])
      .first();
    return !!enrollment;
  },

  /**
   * Create or update an enrollment
   */
  async upsert(enrollment: Omit<Enrollment, "syncedAt" | "needsSync">) {
    return db.enrollments.put({
      ...enrollment,
      syncedAt: new Date(),
      needsSync: false,
    });
  },

  /**
   * Update enrollment progress
   */
  async updateProgress(id: string, progressPercentage: number) {
    return db.enrollments.update(id, {
      progressPercentage,
      lastAccessed: new Date(),
      needsSync: true,
    });
  },

  /**
   * Get enrollments that need syncing
   */
  async getNeedingSync() {
    return db.enrollments.filter((e) => e.needsSync === true).toArray();
  },

  /**
   * Mark enrollment as synced
   */
  async markSynced(id: string) {
    return db.enrollments.update(id, {
      syncedAt: new Date(),
      needsSync: false,
    });
  },
};

/**
 * Progress record operations
 */
export const progressService = {
  /**
   * Get all progress records for an enrollment
   */
  async getByEnrollmentId(enrollmentId: string) {
    return db.progressRecords.where("enrollmentId").equals(enrollmentId).toArray();
  },

  /**
   * Get progress for a specific section
   */
  async getBySectionId(enrollmentId: string, sectionId: string) {
    return db.progressRecords
      .where("[enrollmentId+sectionId]")
      .equals([enrollmentId, sectionId])
      .first();
  },

  /**
   * Create or update progress record
   */
  async upsert(progress: Omit<ProgressRecord, "syncedAt" | "needsSync">) {
    return db.progressRecords.put({
      ...progress,
      syncedAt: new Date(),
      needsSync: true,
    });
  },

  /**
   * Mark section as completed
   */
  async markCompleted(enrollmentId: string, sectionId: string) {
    const existing = await this.getBySectionId(enrollmentId, sectionId);
    if (existing) {
      return db.progressRecords.update(existing.id, {
        completed: true,
        completedAt: new Date(),
        updatedAt: new Date(),
        needsSync: true,
      });
    }
  },

  /**
   * Get progress records that need syncing
   */
  async getNeedingSync() {
    return db.progressRecords.filter((p) => p.needsSync === true).toArray();
  },

  /**
   * Mark progress as synced
   */
  async markSynced(id: string) {
    return db.progressRecords.update(id, {
      syncedAt: new Date(),
      needsSync: false,
    });
  },
};

/**
 * Video progress operations
 */
export const videoProgressService = {
  /**
   * Get video progress for a specific asset
   */
  async get(userId: string, assetId: string) {
    return db.videoProgress.where("[userId+assetId]").equals([userId, assetId]).first();
  },

  /**
   * Update video playback position
   */
  async update(progress: Omit<VideoProgress, "updatedAt">) {
    return db.videoProgress.put({
      ...progress,
      updatedAt: new Date(),
    });
  },

  /**
   * Get last accessed video for a course
   */
  async getLastForCourse(userId: string, courseId: string) {
    return db.videoProgress
      .where("[userId+courseId]")
      .equals([userId, courseId])
      .reverse()
      .sortBy("updatedAt")
      .then((results) => results[0]);
  },
};

/**
 * Cache operations
 */
export const cacheService = {
  /**
   * Get cached data by key
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const entry = await db.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (entry.expiresAt < new Date()) {
      await db.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  },

  /**
   * Set cached data with expiration
   */
  async set(key: string, data: unknown, ttlSeconds: number = 3600) {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return db.cache.put({
      key,
      data,
      expiresAt,
      cachedAt: new Date(),
    });
  },

  /**
   * Delete cached data
   */
  async delete(key: string) {
    return db.cache.delete(key);
  },

  /**
   * Clear expired cache entries
   */
  async clearExpired() {
    return db.cache.where("expiresAt").below(new Date()).delete();
  },

  /**
   * Clear all cache
   */
  async clear() {
    return db.cache.clear();
  },
};

/**
 * Upload draft operations
 */
export const uploadDraftService = {
  /**
   * Get all drafts for an instructor
   */
  async getByInstructorId(instructorId: string) {
    return db.uploadDrafts.where("instructorId").equals(instructorId).reverse().sortBy("updatedAt");
  },

  /**
   * Get a draft by ID
   */
  async getById(id: string) {
    return db.uploadDrafts.get(id);
  },

  /**
   * Create or update a draft
   */
  async upsert(draft: Omit<UploadDraft, "createdAt" | "updatedAt"> & { id: string }) {
    const existing = await db.uploadDrafts.get(draft.id);
    return db.uploadDrafts.put({
      ...draft,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    });
  },

  /**
   * Delete a draft
   */
  async delete(id: string) {
    return db.uploadDrafts.delete(id);
  },

  /**
   * Clear old drafts (older than 30 days)
   */
  async clearOld() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return db.uploadDrafts.where("updatedAt").below(thirtyDaysAgo).delete();
  },
};

/**
 * User preference operations
 */
export const preferenceService = {
  /**
   * Get user preferences
   */
  async get(userId: string) {
    return db.userPreferences.get(userId);
  },

  /**
   * Create or update user preferences
   */
  async upsert(preferences: Omit<UserPreference, "updatedAt">) {
    return db.userPreferences.put({
      ...preferences,
      updatedAt: new Date(),
    });
  },

  /**
   * Update specific preference fields
   */
  async update(userId: string, updates: Partial<Omit<UserPreference, "userId">>) {
    return db.userPreferences.update(userId, {
      ...updates,
      updatedAt: new Date(),
    });
  },
};

/**
 * Search history operations
 */
export const searchHistoryService = {
  /**
   * Get search history for a user
   */
  async getByUserId(userId: string, limit: number = 10) {
    return db.searchHistory
      .where("userId")
      .equals(userId)
      .reverse()
      .sortBy("timestamp")
      .then((results) => results.slice(0, limit));
  },

  /**
   * Add search to history
   */
  async add(userId: string, query: string, filters?: SearchHistory["filters"]) {
    return db.searchHistory.add({
      id: `${userId}-${Date.now()}`,
      userId,
      query,
      filters,
      timestamp: new Date(),
    });
  },

  /**
   * Clear search history for a user
   */
  async clearForUser(userId: string) {
    return db.searchHistory.where("userId").equals(userId).delete();
  },
};

/**
 * Pending mutation operations
 */
export const mutationQueueService = {
  /**
   * Get all pending mutations
   */
  async getAll() {
    return db.pendingMutations.orderBy("createdAt").toArray();
  },

  /**
   * Add a mutation to the queue
   */
  async add(mutation: Omit<PendingMutation, "id" | "retryCount" | "createdAt">) {
    return db.pendingMutations.add({
      ...mutation,
      id: `${mutation.type}-${Date.now()}`,
      retryCount: 0,
      createdAt: new Date(),
    });
  },

  /**
   * Update retry count
   */
  async incrementRetry(id: string) {
    const mutation = await db.pendingMutations.get(id);
    if (mutation) {
      return db.pendingMutations.update(id, {
        retryCount: mutation.retryCount + 1,
        lastAttemptAt: new Date(),
      });
    }
  },

  /**
   * Remove a mutation from the queue
   */
  async remove(id: string) {
    return db.pendingMutations.delete(id);
  },

  /**
   * Clear all mutations
   */
  async clear() {
    return db.pendingMutations.clear();
  },
};
