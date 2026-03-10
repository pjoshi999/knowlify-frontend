/**
 * useCourses Hook
 *
 * Custom React Query hook for fetching courses with pagination and filtering
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getCourses } from "../api/courses";
import { queryKeys } from "../query/invalidation";
import type { GetCoursesParams, GetCoursesResponse } from "../api/service-types";

export interface UseCoursesOptions extends GetCoursesParams {
  enabled?: boolean;
}

/**
 * Hook for fetching courses with pagination and filtering
 *
 * @param options - Query parameters including pagination and filters
 * @returns Query result with courses data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCourses({
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'date',
 *   filters: { priceRange: [0, 100] }
 * });
 * ```
 */
export function useCourses(
  options: UseCoursesOptions = {}
): UseQueryResult<GetCoursesResponse, Error> {
  const { enabled = true, ...params } = options;

  return useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: () => getCourses(params),
    enabled,
  });
}
