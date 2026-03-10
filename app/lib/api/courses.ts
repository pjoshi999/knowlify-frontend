/**
 * Course API Service
 *
 * Service layer for course-related API operations
 */

import apiClient from "./client";
import { unwrapApiData } from "./client";
import { mapCourse, mapCourseSections, mapInstructor } from "./mappers";
import type {
  GetCoursesParams,
  GetCoursesResponse,
  GetCourseResponse,
  CreateCourseRequest,
  CreateCourseResponse,
  UpdateCourseRequest,
  Course,
  DeleteCourseResponse,
  Instructor,
} from "./service-types";

/**
 * Get list of courses with optional filtering and pagination
 */
export async function getCourses(params?: GetCoursesParams): Promise<GetCoursesResponse> {
  const queryParams: Record<string, unknown> = {
    page: params?.page,
    limit: params?.limit,
  };

  if (params?.sortBy) {
    const sortMap: Record<string, string> = {
      date: "createdAt",
      price: "priceAmount",
      rating: "avgRating",
    };
    queryParams.sortBy = sortMap[params.sortBy] || "createdAt";
    queryParams.sortOrder = "desc";
  }

  if (params?.filters?.category) {
    queryParams.category = params.filters.category;
  }
  if (params?.filters?.rating) {
    queryParams.minRating = params.filters.rating;
  }
  if (params?.filters?.priceRange) {
    queryParams.minPrice = params.filters.priceRange[0];
    queryParams.maxPrice = params.filters.priceRange[1];
  }

  const response = await apiClient.get("/courses", { params: queryParams });
  const payload = unwrapApiData<{ data?: any[]; pagination?: any }>(response.data);

  const courses = (payload?.data || []).map(mapCourse);

  return {
    courses,
    total: Number(payload?.pagination?.total ?? courses.length),
    page: Number(payload?.pagination?.page ?? params?.page ?? 1),
    hasMore: Boolean(payload?.pagination?.hasNext),
  };
}

/**
 * Get detailed information about a specific course
 */
export async function getCourse(courseId: string): Promise<GetCourseResponse> {
  const response = await apiClient.get(`/courses/${courseId}`);
  const courseData = unwrapApiData<any>(response.data);

  return {
    course: mapCourse(courseData) as Course,
    sections: mapCourseSections(courseData),
    instructor: mapInstructor(courseData) as Instructor,
    isEnrolled: Boolean(courseData?.isEnrolled),
    progress: typeof courseData?.progress === "number" ? Number(courseData.progress) : undefined,
    enrollmentId: courseData?.enrollmentId,
  };
}

/**
 * Create a new course (instructor only)
 */
export async function createCourse(data: CreateCourseRequest): Promise<CreateCourseResponse> {
  // If thumbnail file is provided, use FormData
  if (data.thumbnail) {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("description", data.description);
    formData.append("category", data.category || "General");
    formData.append("priceAmount", String(Math.round(data.price)));
    formData.append("thumbnail", data.thumbnail);

    const response = await apiClient.post("/courses", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    const payload = unwrapApiData<any>(response.data);
    return {
      courseId: String(payload?.id),
      shareableLink: `/courses/${payload?.id}`,
    };
  }

  // Otherwise, use JSON
  const response = await apiClient.post("/courses", {
    name: data.name,
    description: data.description,
    category: data.category || "General",
    thumbnailUrl: data.thumbnailUrl,
    priceAmount: data.price,
  });
  const payload = unwrapApiData<any>(response.data);
  return {
    courseId: String(payload?.id),
    shareableLink: `/courses/${payload?.id}`,
  };
}

/**
 * Update an existing course (instructor only)
 */
export async function updateCourse(courseId: string, data: UpdateCourseRequest): Promise<Course> {
  const response = await apiClient.put(`/courses/${courseId}`, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.description !== undefined ? { description: data.description } : {}),
    ...(data.thumbnailUrl !== undefined ? { thumbnailUrl: data.thumbnailUrl } : {}),
    ...(data.price !== undefined ? { priceAmount: data.price } : {}),
  });
  return mapCourse(unwrapApiData<any>(response.data));
}

/**
 * Delete a course (instructor only)
 */
export async function deleteCourse(courseId: string): Promise<DeleteCourseResponse> {
  const response = await apiClient.delete(`/courses/${courseId}`);
  unwrapApiData<{ message?: string }>(response.data);
  return { success: true };
}

/**
 * Get course assets (videos, PDFs, etc.)
 * Requires enrollment or instructor ownership
 */
export async function getCourseAssets(courseId: string): Promise<any[]> {
  const response = await apiClient.get(`/courses/${courseId}/assets`);
  const assets = unwrapApiData<any[]>(response.data);
  return assets || [];
}

/**
 * Check if user has access to a course
 * Returns access status, enrollment info, and course details
 */
export async function checkCourseAccess(courseId: string): Promise<{
  hasAccess: boolean;
  reason: "enrolled" | "instructor" | "not_enrolled";
  enrollmentId?: string;
  progress?: any;
  course: any;
}> {
  const response = await apiClient.get(`/courses/${courseId}/access`);
  const data = unwrapApiData<any>(response.data);
  const rawCourse = data?.course;

  return {
    hasAccess: Boolean(data?.hasAccess),
    reason: data?.reason || "not_enrolled",
    enrollmentId: data?.enrollmentId,
    progress: data?.progress,
    // Preserve manifest for the learn page while keeping mapped fields.
    course: rawCourse
      ? {
          ...mapCourse(rawCourse),
          manifest: rawCourse.manifest,
        }
      : null,
  };
}
