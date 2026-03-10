import { db } from "./schema";

/**
 * Storage quota information
 */
export interface StorageQuota {
  usage: number;
  quota: number;
  percentage: number;
  available: number;
}

/**
 * Storage breakdown by table
 */
export interface StorageBreakdown {
  courses: number;
  courseSections: number;
  courseAssets: number;
  enrollments: number;
  progressRecords: number;
  videoProgress: number;
  cache: number;
  uploadDrafts: number;
  userPreferences: number;
  searchHistory: number;
  pendingMutations: number;
  total: number;
}

/**
 * Get current storage quota information
 */
export async function getStorageQuota(): Promise<StorageQuota | null> {
  if (!navigator.storage || !navigator.storage.estimate) {
    console.warn("Storage API not supported");
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;
    const available = quota - usage;

    return {
      usage,
      quota,
      percentage,
      available,
    };
  } catch (error) {
    console.error("Failed to get storage quota:", error);
    return null;
  }
}

/**
 * Check if storage is available for a given size
 */
export async function hasStorageAvailable(requiredBytes: number): Promise<boolean> {
  const quota = await getStorageQuota();
  if (!quota) return true; // Assume available if we can't check

  return quota.available >= requiredBytes;
}

/**
 * Get storage usage breakdown by table
 */
export async function getStorageBreakdown(): Promise<StorageBreakdown> {
  try {
    const [
      coursesCount,
      sectionsCount,
      assetsCount,
      enrollmentsCount,
      progressCount,
      videoProgressCount,
      cacheCount,
      draftsCount,
      preferencesCount,
      searchCount,
      mutationsCount,
    ] = await Promise.all([
      db.courses.count(),
      db.courseSections.count(),
      db.courseAssets.count(),
      db.enrollments.count(),
      db.progressRecords.count(),
      db.videoProgress.count(),
      db.cache.count(),
      db.uploadDrafts.count(),
      db.userPreferences.count(),
      db.searchHistory.count(),
      db.pendingMutations.count(),
    ]);

    // Rough estimate: each record is approximately 1KB
    // This is a simplification; actual size varies by content
    const estimateSize = (count: number) => count * 1024;

    const breakdown = {
      courses: estimateSize(coursesCount),
      courseSections: estimateSize(sectionsCount),
      courseAssets: estimateSize(assetsCount),
      enrollments: estimateSize(enrollmentsCount),
      progressRecords: estimateSize(progressCount),
      videoProgress: estimateSize(videoProgressCount),
      cache: estimateSize(cacheCount),
      uploadDrafts: estimateSize(draftsCount),
      userPreferences: estimateSize(preferencesCount),
      searchHistory: estimateSize(searchCount),
      pendingMutations: estimateSize(mutationsCount),
      total: 0,
    };

    breakdown.total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return breakdown;
  } catch (error) {
    console.error("Failed to get storage breakdown:", error);
    return {
      courses: 0,
      courseSections: 0,
      courseAssets: 0,
      enrollments: 0,
      progressRecords: 0,
      videoProgress: 0,
      cache: 0,
      uploadDrafts: 0,
      userPreferences: 0,
      searchHistory: 0,
      pendingMutations: 0,
      total: 0,
    };
  }
}

/**
 * Request persistent storage (prevents automatic eviction)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    console.warn("Persistent storage not supported");
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persist();
    return isPersisted;
  } catch (error) {
    console.error("Failed to request persistent storage:", error);
    return false;
  }
}

/**
 * Check if storage is persisted
 */
export async function isStoragePersisted(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error("Failed to check storage persistence:", error);
    return false;
  }
}

/**
 * Clean up old cached data to free space
 */
export async function cleanupOldCache(daysOld: number = 7): Promise<number> {
  const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  try {
    // Clean up old courses
    const oldCourses = await db.courses.where("cachedAt").below(cutoffDate).toArray();
    await db.courses.where("cachedAt").below(cutoffDate).delete();
    deletedCount += oldCourses.length;

    // Clean up old sections
    const oldSections = await db.courseSections.where("cachedAt").below(cutoffDate).toArray();
    await db.courseSections.where("cachedAt").below(cutoffDate).delete();
    deletedCount += oldSections.length;

    // Clean up old assets
    const oldAssets = await db.courseAssets.where("cachedAt").below(cutoffDate).toArray();
    await db.courseAssets.where("cachedAt").below(cutoffDate).delete();
    deletedCount += oldAssets.length;

    // Clean up expired cache entries
    const expiredCache = await db.cache.where("expiresAt").below(new Date()).toArray();
    await db.cache.where("expiresAt").below(new Date()).delete();
    deletedCount += expiredCache.length;

    // Clean up old upload drafts (30+ days)
    const oldDrafts = await db.uploadDrafts
      .where("updatedAt")
      .below(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .toArray();
    await db.uploadDrafts
      .where("updatedAt")
      .below(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .delete();
    deletedCount += oldDrafts.length;

    // Clean up old search history (90+ days)
    const oldSearches = await db.searchHistory
      .where("timestamp")
      .below(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .toArray();
    await db.searchHistory
      .where("timestamp")
      .below(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
      .delete();
    deletedCount += oldSearches.length;

    return deletedCount;
  } catch (error) {
    console.error("Failed to cleanup old cache:", error);
    return deletedCount;
  }
}

/**
 * Emergency cleanup when storage is critically low
 */
export async function emergencyCleanup(): Promise<void> {
  try {
    // Clear all cache
    await db.cache.clear();

    // Clear search history
    await db.searchHistory.clear();

    // Clear old upload drafts
    await db.uploadDrafts.clear();

    // Clear old video progress (keep only last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await db.videoProgress.where("updatedAt").below(thirtyDaysAgo).delete();

    console.log("Emergency cleanup completed");
  } catch (error) {
    console.error("Emergency cleanup failed:", error);
  }
}

/**
 * Monitor storage and trigger cleanup if needed
 */
export async function monitorStorage(): Promise<void> {
  const quota = await getStorageQuota();
  if (!quota) return;

  // If storage is over 80% full, trigger cleanup
  if (quota.percentage > 80) {
    console.warn("Storage usage high:", quota.percentage.toFixed(2) + "%");
    const deletedCount = await cleanupOldCache(7);
    console.log("Cleaned up", deletedCount, "old entries");
  }

  // If storage is over 95% full, trigger emergency cleanup
  if (quota.percentage > 95) {
    console.error("Storage critically low:", quota.percentage.toFixed(2) + "%");
    await emergencyCleanup();
  }
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
