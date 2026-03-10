/**
 * Common API Types
 *
 * Shared types for API requests and responses
 */

/**
 * Standard API error response format
 */
export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Standard API success response format
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Paginated response format
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Request configuration options
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
}
