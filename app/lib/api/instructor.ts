/**
 * Instructor API Service
 *
 * Service layer for instructor dashboard and statistics operations
 */

import apiClient from "./client";
import { unwrapApiData } from "./client";
import { mapCourse, mapCourseStat } from "./mappers";
import type {
  GetInstructorStatsResponse,
  GetInstructorCoursesResponse,
  GetTransactionsParams,
  GetTransactionsResponse,
} from "./service-types";

/**
 * Get instructor statistics including revenue and enrollments
 */
export async function getStats(): Promise<GetInstructorStatsResponse> {
  const [statsResponse, coursesResponse] = await Promise.all([
    apiClient.get("/instructor/stats"),
    apiClient.get("/instructor/courses"),
  ]);

  const stats = unwrapApiData<any>(statsResponse.data);
  const coursePayload = unwrapApiData<{ data?: any[] }>(coursesResponse.data);
  const courseStats = (coursePayload?.data || []).map(mapCourseStat);

  return {
    totalCourses: Number(stats?.totalCourses ?? 0),
    totalEnrollments: Number(stats?.totalEnrollments ?? 0),
    totalRevenue: Number(stats?.totalRevenue ?? 0),
    courseStats,
  };
}

/**
 * Get all courses created by the instructor
 */
export async function getInstructorCourses(): Promise<GetInstructorCoursesResponse> {
  const response = await apiClient.get("/instructor/courses");
  const payload = unwrapApiData<{ data?: any[] }>(response.data);
  return {
    courses: (payload?.data || []).map(mapCourse),
  };
}

/**
 * Get transaction history for instructor
 */
export async function getTransactions(
  params?: GetTransactionsParams
): Promise<GetTransactionsResponse> {
  void params;
  return {
    transactions: [],
    total: 0,
  };
}
