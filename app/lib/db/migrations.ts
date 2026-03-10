import { db } from "./schema";

/**
 * Migration utilities for handling schema changes
 *
 * When adding new versions to the schema:
 * 1. Increment the version number in schema.ts
 * 2. Add the new stores/indexes in the version() call
 * 3. Add a migration function here if data transformation is needed
 * 4. Register the migration in the migrations map
 */

/**
 * Migration function type
 */
type MigrationFn = () => Promise<void>;

/**
 * Migration registry
 * Key: version number, Value: migration function
 */
const migrations: Record<number, MigrationFn> = {
  // Example migration for version 2 (when we add it):
  // 2: async () => {
  //   // Transform existing data if needed
  //   const courses = await db.courses.toArray();
  //   // ... perform transformations
  //   await db.courses.bulkPut(courses);
  // },
};

/**
 * Run all pending migrations
 */
export async function runMigrations(): Promise<void> {
  const currentVersion = db.verno;

  console.log("Current database version:", currentVersion);

  // Run migrations in order
  for (let version = 1; version <= currentVersion; version++) {
    const migration = migrations[version];
    if (migration) {
      console.log(`Running migration for version ${version}...`);
      try {
        await migration();
        console.log(`Migration ${version} completed successfully`);
      } catch (error) {
        console.error(`Migration ${version} failed:`, error);
        throw error;
      }
    }
  }
}

/**
 * Reset database (delete and recreate)
 * WARNING: This will delete all local data!
 */
export async function resetDatabase(): Promise<void> {
  console.warn("Resetting database - all local data will be lost!");

  try {
    await db.delete();
    console.log("Database deleted");

    // Recreate database
    await db.open();
    console.log("Database recreated");
  } catch (error) {
    console.error("Failed to reset database:", error);
    throw error;
  }
}

/**
 * Export database data for backup
 */
export async function exportDatabase(): Promise<string> {
  try {
    const data = {
      version: db.verno,
      timestamp: new Date().toISOString(),
      tables: {
        courses: await db.courses.toArray(),
        courseSections: await db.courseSections.toArray(),
        courseAssets: await db.courseAssets.toArray(),
        enrollments: await db.enrollments.toArray(),
        progressRecords: await db.progressRecords.toArray(),
        videoProgress: await db.videoProgress.toArray(),
        cache: await db.cache.toArray(),
        uploadDrafts: await db.uploadDrafts.toArray(),
        userPreferences: await db.userPreferences.toArray(),
        searchHistory: await db.searchHistory.toArray(),
        pendingMutations: await db.pendingMutations.toArray(),
      },
    };

    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Failed to export database:", error);
    throw error;
  }
}

/**
 * Import database data from backup
 * WARNING: This will overwrite existing data!
 */
export async function importDatabase(jsonData: string): Promise<void> {
  try {
    const data = JSON.parse(jsonData);

    console.log("Importing database from backup...");
    console.log("Backup version:", data.version);
    console.log("Backup timestamp:", data.timestamp);

    // Clear existing data
    await db.transaction("rw", db.tables, async () => {
      await Promise.all(db.tables.map((table) => table.clear()));
    });

    // Import data
    await db.transaction("rw", db.tables, async () => {
      if (data.tables.courses) await db.courses.bulkAdd(data.tables.courses);
      if (data.tables.courseSections) await db.courseSections.bulkAdd(data.tables.courseSections);
      if (data.tables.courseAssets) await db.courseAssets.bulkAdd(data.tables.courseAssets);
      if (data.tables.enrollments) await db.enrollments.bulkAdd(data.tables.enrollments);
      if (data.tables.progressRecords)
        await db.progressRecords.bulkAdd(data.tables.progressRecords);
      if (data.tables.videoProgress) await db.videoProgress.bulkAdd(data.tables.videoProgress);
      if (data.tables.cache) await db.cache.bulkAdd(data.tables.cache);
      if (data.tables.uploadDrafts) await db.uploadDrafts.bulkAdd(data.tables.uploadDrafts);
      if (data.tables.userPreferences)
        await db.userPreferences.bulkAdd(data.tables.userPreferences);
      if (data.tables.searchHistory) await db.searchHistory.bulkAdd(data.tables.searchHistory);
      if (data.tables.pendingMutations)
        await db.pendingMutations.bulkAdd(data.tables.pendingMutations);
    });

    console.log("Database import completed successfully");
  } catch (error) {
    console.error("Failed to import database:", error);
    throw error;
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
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

    return {
      version: db.verno,
      tables: {
        courses: coursesCount,
        courseSections: sectionsCount,
        courseAssets: assetsCount,
        enrollments: enrollmentsCount,
        progressRecords: progressCount,
        videoProgress: videoProgressCount,
        cache: cacheCount,
        uploadDrafts: draftsCount,
        userPreferences: preferencesCount,
        searchHistory: searchCount,
        pendingMutations: mutationsCount,
      },
      total:
        coursesCount +
        sectionsCount +
        assetsCount +
        enrollmentsCount +
        progressCount +
        videoProgressCount +
        cacheCount +
        draftsCount +
        preferencesCount +
        searchCount +
        mutationsCount,
    };
  } catch (error) {
    console.error("Failed to get database stats:", error);
    throw error;
  }
}
