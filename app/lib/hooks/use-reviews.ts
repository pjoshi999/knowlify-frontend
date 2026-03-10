/**
 * useReviews Hook
 *
 * Custom React Query hook for fetching course reviews
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getReviews } from "../api/reviews";
import { queryKeys } from "../query/invalidation";
import type { GetReviewsResponse } from "../api/service-types";

export interface UseReviewsOptions {
  courseId: string;
  enabled?: boolean;
}

/**
 * Hook for fetching all reviews for a specific course
 *
 * @param options - Course ID and query options
 * @returns Query result with reviews data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useReviews({
 *   courseId: 'course-123'
 * });
 *
 * if (data) {
 *   console.log(data.averageRating);
 *   console.log(data.totalReviews);
 *   data.reviews.forEach(review => {
 *     console.log(review.rating, review.comment);
 *   });
 * }
 * ```
 */
export function useReviews(options: UseReviewsOptions): UseQueryResult<GetReviewsResponse, Error> {
  const { courseId, enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.reviews.list(courseId),
    queryFn: () => getReviews(courseId),
    enabled: enabled && !!courseId,
  });
}
