/**
 * useCoursesInfinite Hook
 *
 * Custom React Query hook for fetching courses with infinite scroll pagination
 */

import { useInfiniteQuery, UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";
import { getCourses } from "../api/courses";
import { queryKeys } from "../query/invalidation";
import type { GetCoursesParams, GetCoursesResponse } from "../api/service-types";

export interface UseCoursesInfiniteOptions extends Omit<GetCoursesParams, "page"> {
  enabled?: boolean;
}

/**
 * Hook for fetching courses with infinite scroll pagination
 *
 * @param options - Query parameters including filters and sort options
 * @returns Infinite query result with paginated courses data
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   fetchNextPage,
 *   hasNextPage,
 *   isFetchingNextPage
 * } = useCoursesInfinite({
 *   limit: 20,
 *   sortBy: 'date',
 *   filters: { priceRange: [0, 100] }
 * });
 * ```
 */
export function useCoursesInfinite(
  options: UseCoursesInfiniteOptions = {}
): UseInfiniteQueryResult<InfiniteData<GetCoursesResponse>, Error> {
  const { enabled = true, limit = 20, ...params } = options;

  return useInfiniteQuery({
    queryKey: queryKeys.courses.list({ ...params, limit }),
    queryFn: ({ pageParam = 1 }) =>
      getCourses({
        ...params,
        page: pageParam as number,
        limit,
      }),
    getNextPageParam: (lastPage) => {
      // If hasMore is true, return the next page number
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      // Otherwise, return undefined to indicate no more pages
      return undefined;
    },
    initialPageParam: 1,
    enabled,
  });
}
