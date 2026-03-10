/**
 * Progress Tracking API Endpoint
 *
 * PUT /api/enrollments/:id/progress
 * Updates progress for a specific enrollment
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/lib/db";
import type { UpdateProgressRequest, UpdateProgressResponse } from "@/app/lib/api/service-types";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<UpdateProgressResponse | { error: string }>> {
  try {
    const { id: enrollmentId } = await params;
    const body: UpdateProgressRequest = await request.json();
    const { sectionId, completed, timeSpent = 0 } = body;

    // Validate request
    if (!sectionId || typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "Missing required fields: sectionId and completed" },
        { status: 400 }
      );
    }

    // Get enrollment to verify it exists
    const enrollment = await db.enrollments.get(enrollmentId);
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Get or create progress record
    const existingProgress = await db.progressRecords.where({ enrollmentId, sectionId }).first();

    const now = new Date();

    if (existingProgress) {
      // Update existing progress record
      await db.progressRecords.update(existingProgress.id, {
        completed,
        timeSpentSeconds: existingProgress.timeSpentSeconds + timeSpent,
        completedAt: completed ? now : existingProgress.completedAt,
        updatedAt: now,
        needsSync: true,
        syncedAt: now,
      });
    } else {
      // Create new progress record
      await db.progressRecords.add({
        id: crypto.randomUUID(),
        enrollmentId,
        sectionId,
        completed,
        timeSpentSeconds: timeSpent,
        completedAt: completed ? now : undefined,
        updatedAt: now,
        needsSync: true,
        syncedAt: now,
      });
    }

    // Calculate overall progress
    const allProgress = await db.progressRecords.where({ enrollmentId }).toArray();

    const completedSections = allProgress.filter((p) => p.completed).map((p) => p.sectionId);

    // Get total sections for this course
    const courseSections = await db.courseSections
      .where({ courseId: enrollment.courseId })
      .toArray();

    const totalSections = courseSections.length;
    const progress =
      totalSections > 0 ? Math.round((completedSections.length / totalSections) * 100) : 0;

    // Update enrollment progress
    await db.enrollments.update(enrollmentId, {
      progressPercentage: progress,
      lastAccessed: now,
      needsSync: true,
      syncedAt: now,
    });

    return NextResponse.json({
      progress,
      completedSections,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
