/**
 * TanStack Query Client Configuration
 *
 * Configures QueryClient with:
 * - Default options for queries and mutations
 * - Retry logic for transient failures
 * - Cache time and stale time settings
 * - Error handling
 */

import { QueryClient, DefaultOptions } from "@tanstack/react-query";

/**
 * Default options for all queries and mutations
 */
const defaultOptions: DefaultOptions = {
  queries: {
    // Stale time: 5 minutes (data is considered fresh for 5 minutes)
    staleTime: 5 * 60 * 1000,

    // Cache time: 30 minutes (unused data stays in cache for 30 minutes)
    gcTime: 30 * 60 * 1000,

    // Retry configuration for transient failures
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors (client errors)
      if (error instanceof Error && "response" in error) {
        const status = (error as any).response?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
      }

      // Retry up to 3 times for other errors (5xx, network errors)
      return failureCount < 3;
    },

    // Exponential backoff for retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch on window focus for fresh data
    refetchOnWindowFocus: true,

    // Refetch on reconnect after network issues
    refetchOnReconnect: true,

    // Don't refetch on mount if data is still fresh
    refetchOnMount: false,
  },

  mutations: {
    // Retry mutations once for transient failures
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof Error && "response" in error) {
        const status = (error as any).response?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
      }

      // Retry once for 5xx and network errors
      return failureCount < 1;
    },

    // Exponential backoff for mutation retries
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  },
};

/**
 * Create and configure the QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions,
  });
}

/**
 * Singleton QueryClient instance for the application
 */
let queryClient: QueryClient | undefined;

/**
 * Get or create the QueryClient instance
 */
export function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server-side: always create a new client
    return createQueryClient();
  }

  // Client-side: reuse existing client
  if (!queryClient) {
    queryClient = createQueryClient();
  }

  return queryClient;
}
