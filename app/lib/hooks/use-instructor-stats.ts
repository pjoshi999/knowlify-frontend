/**
 * useInstructorStats Hook
 *
 * Custom React Query hook for fetching instructor dashboard statistics
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getStats } from "../api/instructor";
import { queryKeys } from "../query/invalidation";
import type { GetInstructorStatsResponse } from "../api/service-types";

export interface UseInstructorStatsOptions {
  enabled?: boolean;
  refetchInterval?: number;
}

/**
 * Hook for fetching instructor dashboard statistics
 *
 * Includes total courses, enrollments, revenue, and per-course statistics.
 * Supports real-time updates via refetchInterval option.
 *
 * @param options - Query options including polling interval
 * @returns Query result with instructor statistics
 *
 * @example
 * ```tsx
 * // Basic usage
 * const { data, isLoading, error } = useInstructorStats();
 *
 * // With real-time updates (poll every 30 seconds)
 * const { data } = useInstructorStats({
 *   refetchInterval: 30000
 * });
 *
 * if (data) {
 *   console.log(data.totalCourses);
 *   console.log(data.totalEnrollments);
 *   console.log(data.totalRevenue);
 *   data.courseStats.forEach(stat => {
 *     console.log(stat.courseName, stat.revenue);
 *   });
 * }
 * ```
 */
export function useInstructorStats(
  options: UseInstructorStatsOptions = {}
): UseQueryResult<GetInstructorStatsResponse, Error> {
  const { enabled = true, refetchInterval } = options;

  return useQuery({
    queryKey: queryKeys.instructor.stats(),
    queryFn: () => getStats(),
    enabled,
    refetchInterval,
  });
}
