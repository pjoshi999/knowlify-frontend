/**
 * TanStack Query Configuration
 *
 * Central export for all TanStack Query utilities including:
 * - Query client configuration
 * - IndexedDB persistence
 * - Cache invalidation strategies
 * - Optimistic update helpers
 * - Query providers
 */

// Client configuration
export { createQueryClient, getQueryClient } from "./client";

// Persistence
export { createIDBPersister } from "./persister";

// Cache invalidation
export { queryKeys, invalidationStrategies } from "./invalidation";

// Optimistic updates
export {
  optimisticCourseCreate,
  optimisticCourseUpdate,
  optimisticProgressUpdate,
  optimisticReviewCreate,
  optimisticReviewUpdate,
  optimisticReviewDelete,
  optimisticEnrollmentCreate,
} from "./optimistic";

// Providers
export { QueryProvider, SimpleQueryProvider, AdaptiveQueryProvider } from "./provider";
