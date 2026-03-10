/**
 * Progress API Endpoint Tests
 *
 * Tests for PUT /api/enrollments/:id/progress
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PUT } from "./route";
import { db } from "@/app/lib/db";

describe("PUT /api/enrollments/:id/progress", () => {
  const testEnrollmentId = "test-enrollment-1";
  const testCourseId = "test-course-1";
  const testUserId = "test-user-1";
  const testSectionIds = ["section-1", "section-2", "section-3"];

  beforeEach(async () => {
    // Clear database
    await db.enrollments.clear();
    await db.courseSections.clear();
    await db.progressRecords.clear();

    // Create test enrollment
    await db.enrollments.add({
      id: testEnrollmentId,
      userId: testUserId,
      courseId: testCourseId,
      paymentId: "payment-1",
      progressPercentage: 0,
      enrolledAt: new Date(),
      syncedAt: new Date(),
      needsSync: false,
    });

    // Create test sections
    for (let i = 0; i < testSectionIds.length; i++) {
      await db.courseSections.add({
        id: testSectionIds[i],
        courseId: testCourseId,
        title: `Section ${i + 1}`,
        orderIndex: i,
        durationMinutes: 30,
        createdAt: new Date(),
        cachedAt: new Date(),
      });
    }
  });

  afterEach(async () => {
    // Clean up
    await db.enrollments.clear();
    await db.courseSections.clear();
    await db.progressRecords.clear();
  });

  it("should create new progress record when none exists", async () => {
    const request = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        completed: true,
        timeSpent: 300,
      }),
    });

    const response = await PUT(request, { params: { id: testEnrollmentId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toBe(33); // 1/3 sections completed
    expect(data.completedSections).toContain(testSectionIds[0]);

    // Verify progress record was created
    const progressRecords = await db.progressRecords.toArray();
    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].sectionId).toBe(testSectionIds[0]);
    expect(progressRecords[0].completed).toBe(true);
    expect(progressRecords[0].timeSpentSeconds).toBe(300);
  });

  it("should update existing progress record", async () => {
    // Create initial progress record
    await db.progressRecords.add({
      id: "progress-1",
      enrollmentId: testEnrollmentId,
      sectionId: testSectionIds[0],
      completed: false,
      timeSpentSeconds: 150,
      updatedAt: new Date(),
      syncedAt: new Date(),
      needsSync: false,
    });

    const request = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        completed: true,
        timeSpent: 150,
      }),
    });

    const response = await PUT(request, { params: { id: testEnrollmentId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toBe(33);

    // Verify progress record was updated
    const progressRecords = await db.progressRecords.toArray();
    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].completed).toBe(true);
    expect(progressRecords[0].timeSpentSeconds).toBe(300); // 150 + 150
  });

  it("should calculate correct progress percentage", async () => {
    // Complete 2 out of 3 sections
    const request1 = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        completed: true,
      }),
    });

    await PUT(request1, { params: { id: testEnrollmentId } });

    const request2 = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[1],
        completed: true,
      }),
    });

    const response = await PUT(request2, { params: { id: testEnrollmentId } });
    const data = await response.json();

    expect(data.progress).toBe(67); // 2/3 sections completed
    expect(data.completedSections).toHaveLength(2);
  });

  it("should update enrollment progress percentage", async () => {
    const request = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        completed: true,
      }),
    });

    await PUT(request, { params: { id: testEnrollmentId } });

    // Verify enrollment was updated
    const enrollment = await db.enrollments.get(testEnrollmentId);
    expect(enrollment?.progressPercentage).toBe(33);
    expect(enrollment?.lastAccessed).toBeDefined();
  });

  it("should return 404 for non-existent enrollment", async () => {
    const request = new Request("http://localhost/api/enrollments/non-existent/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        completed: true,
      }),
    });

    const response = await PUT(request, { params: { id: "non-existent" } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Enrollment not found");
  });

  it("should return 400 for missing required fields", async () => {
    const request = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        // missing completed field
      }),
    });

    const response = await PUT(request, { params: { id: testEnrollmentId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Missing required fields");
  });

  it("should handle incomplete section updates", async () => {
    const request = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        completed: false,
        timeSpent: 120,
      }),
    });

    const response = await PUT(request, { params: { id: testEnrollmentId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.progress).toBe(0); // Not completed yet
    expect(data.completedSections).toHaveLength(0);

    // Verify progress record was created
    const progressRecords = await db.progressRecords.toArray();
    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].completed).toBe(false);
    expect(progressRecords[0].timeSpentSeconds).toBe(120);
  });

  it("should accumulate time spent across multiple updates", async () => {
    // First update
    const request1 = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        completed: false,
        timeSpent: 100,
      }),
    });

    await PUT(request1, { params: { id: testEnrollmentId } });

    // Second update
    const request2 = new Request("http://localhost/api/enrollments/test-enrollment-1/progress", {
      method: "PUT",
      body: JSON.stringify({
        sectionId: testSectionIds[0],
        completed: false,
        timeSpent: 200,
      }),
    });

    await PUT(request2, { params: { id: testEnrollmentId } });

    // Verify time was accumulated
    const progressRecords = await db.progressRecords.toArray();
    expect(progressRecords).toHaveLength(1);
    expect(progressRecords[0].timeSpentSeconds).toBe(300); // 100 + 200
  });
});
