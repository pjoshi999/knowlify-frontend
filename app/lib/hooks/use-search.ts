/**
 * useSearch Hook
 *
 * Custom React Query hook for searching courses with debouncing
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { search, getSuggestions } from "../api/search";
import { queryKeys } from "../query/invalidation";
import type { SearchParams, SearchResponse } from "../api/service-types";

export interface UseSearchOptions extends Omit<SearchParams, "query"> {
  query: string;
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook for searching courses with automatic debouncing
 *
 * Debounces the search query to prevent excessive API calls while typing.
 * Default debounce time is 300ms as per performance requirements.
 *
 * @param options - Search parameters including query and filters
 * @returns Query result with search results
 *
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 *
 * const { data, isLoading, error } = useSearch({
 *   query: searchQuery,
 *   filters: { priceRange: [0, 100] },
 *   debounceMs: 300
 * });
 *
 * // Search is automatically debounced - won't fire until user stops typing
 * ```
 */
export function useSearch(options: UseSearchOptions): UseQueryResult<SearchResponse, Error> {
  const { query, enabled = true, debounceMs = 300, ...params } = options;

  // Debounce the search query
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Only enable query if debounced query has content
  const shouldFetch = enabled && debouncedQuery.trim().length > 0;

  return useQuery({
    queryKey: queryKeys.search.results(
      debouncedQuery,
      params.filters as Record<string, unknown> | undefined
    ),
    queryFn: () => search({ query: debouncedQuery, ...params }),
    enabled: shouldFetch,
  });
}

/**
 * Hook for getting search suggestions with debouncing
 *
 * @param query - Search query string
 * @param options - Additional options
 * @returns Query result with suggestions
 *
 * @example
 * ```tsx
 * const { data: suggestions } = useSearchSuggestions('react', {
 *   debounceMs: 200
 * });
 * ```
 */
export function useSearchSuggestions(
  query: string,
  options: { enabled?: boolean; debounceMs?: number } = {}
): UseQueryResult<string[], Error> {
  const { enabled = true, debounceMs = 300 } = options;

  // Debounce the query
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const shouldFetch = enabled && debouncedQuery.trim().length > 0;

  return useQuery({
    queryKey: queryKeys.search.suggestions(debouncedQuery),
    queryFn: async () => (await getSuggestions({ query: debouncedQuery, limit: 5 })).suggestions,
    enabled: shouldFetch,
  });
}
