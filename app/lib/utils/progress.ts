/**
 * Progress Calculation Utilities
 *
 * Helper functions for calculating and managing course progress
 */

import { db } from "../db";
import type { ProgressRecord } from "../db/schema";

/**
 * Calculate overall course completion percentage
 *
 * @param enrollmentId - The enrollment ID
 * @returns Progress percentage (0-100)
 */
export async function calculateCourseProgress(enrollmentId: string): Promise<number> {
  try {
    // Get enrollment to find course ID
    const enrollment = await db.enrollments.get(enrollmentId);
    if (!enrollment) {
      return 0;
    }

    // Get all progress records for this enrollment
    const progressRecords = await db.progressRecords.where({ enrollmentId }).toArray();

    // Get all sections for this course
    const courseSections = await db.courseSections
      .where({ courseId: enrollment.courseId })
      .toArray();

    const totalSections = courseSections.length;
    if (totalSections === 0) {
      return 0;
    }

    // Count completed sections
    const completedSections = progressRecords.filter((p) => p.completed).length;

    // Calculate percentage
    return Math.round((completedSections / totalSections) * 100);
  } catch (error) {
    console.error("Error calculating course progress:", error);
    return 0;
  }
}

/**
 * Get completed section IDs for an enrollment
 *
 * @param enrollmentId - The enrollment ID
 * @returns Array of completed section IDs
 */
export async function getCompletedSections(enrollmentId: string): Promise<string[]> {
  try {
    const progressRecords = await db.progressRecords.where({ enrollmentId }).toArray();

    return progressRecords.filter((p) => p.completed).map((p) => p.sectionId);
  } catch (error) {
    console.error("Error getting completed sections:", error);
    return [];
  }
}

/**
 * Get progress record for a specific section
 *
 * @param enrollmentId - The enrollment ID
 * @param sectionId - The section ID
 * @returns Progress record or null if not found
 */
export async function getSectionProgress(
  enrollmentId: string,
  sectionId: string
): Promise<ProgressRecord | null> {
  try {
    const progress = await db.progressRecords.where({ enrollmentId, sectionId }).first();

    return progress || null;
  } catch (error) {
    console.error("Error getting section progress:", error);
    return null;
  }
}

/**
 * Get the last accessed section for resuming
 *
 * @param enrollmentId - The enrollment ID
 * @returns Section ID of the last accessed section, or null
 */
export async function getLastAccessedSection(enrollmentId: string): Promise<string | null> {
  try {
    // Get enrollment to find course ID
    const enrollment = await db.enrollments.get(enrollmentId);
    if (!enrollment) {
      return null;
    }

    // Get all progress records sorted by update time
    const progressRecords = await db.progressRecords.where({ enrollmentId }).toArray();

    if (progressRecords.length === 0) {
      // No progress yet, return first section
      const firstSection = await db.courseSections
        .where({ courseId: enrollment.courseId })
        .sortBy("orderIndex");

      return firstSection[0]?.id || null;
    }

    // Sort by updatedAt to find most recent
    progressRecords.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    // Return the most recently updated section
    return progressRecords[0]?.sectionId || null;
  } catch (error) {
    console.error("Error getting last accessed section:", error);
    return null;
  }
}

/**
 * Get next incomplete section for continuing learning
 *
 * @param enrollmentId - The enrollment ID
 * @returns Section ID of the next incomplete section, or null if all complete
 */
export async function getNextIncompleteSection(enrollmentId: string): Promise<string | null> {
  try {
    // Get enrollment to find course ID
    const enrollment = await db.enrollments.get(enrollmentId);
    if (!enrollment) {
      return null;
    }

    // Get all sections for this course
    const courseSections = await db.courseSections
      .where({ courseId: enrollment.courseId })
      .sortBy("orderIndex");

    // Get completed section IDs
    const completedSectionIds = await getCompletedSections(enrollmentId);

    // Find first incomplete section
    const nextSection = courseSections.find((section) => !completedSectionIds.includes(section.id));

    return nextSection?.id || null;
  } catch (error) {
    console.error("Error getting next incomplete section:", error);
    return null;
  }
}

/**
 * Get total time spent on a course
 *
 * @param enrollmentId - The enrollment ID
 * @returns Total time spent in seconds
 */
export async function getTotalTimeSpent(enrollmentId: string): Promise<number> {
  try {
    const progressRecords = await db.progressRecords.where({ enrollmentId }).toArray();

    return progressRecords.reduce((total, record) => total + record.timeSpentSeconds, 0);
  } catch (error) {
    console.error("Error getting total time spent:", error);
    return 0;
  }
}

/**
 * Store the last accessed section for resume functionality
 *
 * @param enrollmentId - The enrollment ID
 * @param sectionId - The section ID that was accessed
 */
export async function storeLastAccessedSection(
  enrollmentId: string,
  sectionId: string
): Promise<void> {
  try {
    // Update the enrollment's lastAccessed timestamp
    await db.enrollments.update(enrollmentId, {
      lastAccessed: new Date(),
    });

    // Update or create progress record for this section
    const existingProgress = await db.progressRecords.where({ enrollmentId, sectionId }).first();

    if (existingProgress) {
      // Update existing progress record
      await db.progressRecords.update(existingProgress.id, {
        updatedAt: new Date(),
        needsSync: true,
      });
    } else {
      // Create new progress record
      await db.progressRecords.add({
        id: `${enrollmentId}-${sectionId}`,
        enrollmentId,
        sectionId,
        completed: false,
        timeSpentSeconds: 0,
        updatedAt: new Date(),
        syncedAt: new Date(),
        needsSync: true,
      });
    }
  } catch (error) {
    console.error("Error storing last accessed section:", error);
  }
}
