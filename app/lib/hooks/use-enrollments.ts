/**
 * useEnrollments Hook
 *
 * Custom React Query hook for fetching student enrollments (library)
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getEnrollments } from "../api/enrollments";
import { queryKeys } from "../query/invalidation";
import type { GetEnrollmentsResponse } from "../api/service-types";

export interface UseEnrollmentsOptions {
  enabled?: boolean;
}

/**
 * Hook for fetching all enrollments for the current user (student library)
 *
 * @param options - Query options
 * @returns Query result with enrollments data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEnrollments();
 *
 * if (data) {
 *   data.enrollments.forEach(enrollment => {
 *     console.log(enrollment.courseId);
 *     console.log(enrollment.progressPercentage);
 *   });
 * }
 * ```
 */
export function useEnrollments(
  options: UseEnrollmentsOptions = {}
): UseQueryResult<GetEnrollmentsResponse, Error> {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.enrollments.lists(),
    queryFn: () => getEnrollments(),
    enabled,
  });
}
