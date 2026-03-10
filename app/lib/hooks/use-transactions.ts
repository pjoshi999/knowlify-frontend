/**
 * useTransactions Hook
 *
 * Custom React Query hook for fetching instructor transaction history
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getTransactions } from "../api/instructor";
import { queryKeys } from "../query/invalidation";
import type { GetTransactionsParams, GetTransactionsResponse } from "../api/service-types";

export interface UseTransactionsOptions extends GetTransactionsParams {
  enabled?: boolean;
}

/**
 * Hook for fetching instructor transaction history
 *
 * Supports filtering by date range and course ID.
 *
 * @param options - Query options including date filters
 * @returns Query result with transaction history
 *
 * @example
 * ```tsx
 * // Basic usage - all transactions
 * const { data, isLoading } = useTransactions();
 *
 * // With date range filter
 * const { data } = useTransactions({
 *   startDate: '2024-01-01',
 *   endDate: '2024-12-31'
 * });
 *
 * // Filter by course
 * const { data } = useTransactions({
 *   courseId: 'course-123'
 * });
 * ```
 */
export function useTransactions(
  options: UseTransactionsOptions = {}
): UseQueryResult<GetTransactionsResponse, Error> {
  const { enabled = true, startDate, endDate, courseId } = options;

  return useQuery({
    queryKey: queryKeys.instructor.transactions({ startDate, endDate, courseId }),
    queryFn: () => getTransactions({ startDate, endDate, courseId }),
    enabled,
  });
}
