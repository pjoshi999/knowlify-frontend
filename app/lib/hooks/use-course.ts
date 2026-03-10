/**
 * useCourse Hook
 *
 * Custom React Query hook for fetching single course details
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getCourse } from "../api/courses";
import { queryKeys } from "../query/invalidation";
import type { GetCourseResponse } from "../api/service-types";

export interface UseCourseOptions {
  courseId: string;
  enabled?: boolean;
}

/**
 * Hook for fetching detailed information about a specific course
 *
 * @param options - Course ID and query options
 * @returns Query result with course details
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCourse({
 *   courseId: 'course-123'
 * });
 *
 * if (data) {
 *   console.log(data.course.name);
 *   console.log(data.sections);
 *   console.log(data.isEnrolled);
 * }
 * ```
 */
export function useCourse(options: UseCourseOptions): UseQueryResult<GetCourseResponse, Error> {
  const { courseId, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.courses.detail(courseId),
    queryFn: () => getCourse(courseId),
    enabled: enabled && !!courseId,
  });
}
