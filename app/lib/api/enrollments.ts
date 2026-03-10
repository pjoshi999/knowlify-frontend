/**
 * Enrollment API Service
 *
 * Service layer for enrollment and progress tracking operations
 */

import apiClient from "./client";
import { unwrapApiData } from "./client";
import { mapEnrollment, mapCourse } from "./mappers";
import type {
  CreateEnrollmentRequest,
  CreateEnrollmentResponse,
  GetEnrollmentsResponse,
  UpdateProgressRequest,
  UpdateProgressResponse,
} from "./service-types";

/**
 * Create a new enrollment after successful payment
 */
export async function createEnrollment(
  data: CreateEnrollmentRequest
): Promise<CreateEnrollmentResponse> {
  const response = await apiClient.post("/enrollments", {
    courseId: data.courseId,
    paymentId: data.paymentIntentId,
  });
  const enrollment = mapEnrollment(unwrapApiData<any>(response.data));
  return {
    enrollmentId: enrollment.id,
    course: mapCourse({ id: enrollment.courseId, name: "Course", description: "", price: 0 }),
  };
}

/**
 * Get all enrollments for the current user
 */
export async function getEnrollments(): Promise<GetEnrollmentsResponse> {
  const response = await apiClient.get("/enrollments");
  const payload = unwrapApiData<any[]>(response.data);
  return {
    enrollments: (payload || []).map(mapEnrollment),
  };
}

/**
 * Update progress for a specific enrollment
 */
export async function updateProgress(
  enrollmentId: string,
  data: UpdateProgressRequest
): Promise<UpdateProgressResponse> {
  const response = await apiClient.put(`/enrollments/${enrollmentId}/progress`, {
    lessonId: data.sectionId,
    completed: data.completed,
    position: data.timeSpent ?? 0,
    videoId: data.sectionId,
  });
  const payload = unwrapApiData<any>(response.data);
  const completedSections = payload?.progress?.completedLessons || [];
  return {
    progress: Number(payload?.completionPercentage ?? payload?.progressPercentage ?? 0),
    completedSections: Array.isArray(completedSections) ? completedSections : [],
  };
}
