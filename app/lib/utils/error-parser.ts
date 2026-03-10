import axios, { AxiosError } from "axios";

/**
 * Standardized API Error Response
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

/**
 * Error Types for categorization
 */
export enum ErrorType {
  NETWORK = "NETWORK",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  VALIDATION = "VALIDATION",
  NOT_FOUND = "NOT_FOUND",
  SERVER = "SERVER",
  UNKNOWN = "UNKNOWN",
}

/**
 * Parse API error response into standardized format
 *
 * @param error - The error object from API call
 * @returns Standardized ApiError object
 */
export function parseApiError(error: unknown): ApiError {
  // Handle Axios errors
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    return {
      message: extractErrorMessage(axiosError),
      code: axiosError.code,
      status: axiosError.response?.status,
      details: axiosError.response?.data,
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // Handle unknown error types
  return {
    message: "An unexpected error occurred",
  };
}

/**
 * Extract user-friendly error message from Axios error
 *
 * @param error - Axios error object
 * @returns User-friendly error message
 */
function extractErrorMessage(error: AxiosError<any>): string {
  // Check for response data message
  if (error.response?.data) {
    const data = error.response.data;

    // Try common message fields
    if (typeof data.message === "string") {
      return data.message;
    }
    if (typeof data.error === "string") {
      return data.error;
    }
    if (typeof data.detail === "string") {
      return data.detail;
    }

    // Handle validation errors
    if (data.errors && Array.isArray(data.errors)) {
      return data.errors.map((e: any) => e.message || e).join(", ");
    }
  }

  // Fallback to status-based messages
  if (error.response?.status) {
    return getStatusMessage(error.response.status);
  }

  // Network error
  if (error.code === "ERR_NETWORK" || !error.response) {
    return "Network error. Please check your connection and try again.";
  }

  // Timeout error
  if (error.code === "ECONNABORTED") {
    return "Request timed out. Please try again.";
  }

  // Generic fallback
  return error.message || "An unexpected error occurred";
}

/**
 * Get user-friendly message based on HTTP status code
 *
 * @param status - HTTP status code
 * @returns User-friendly message
 */
function getStatusMessage(status: number): string {
  switch (status) {
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 409:
      return "This action conflicts with existing data.";
    case 422:
      return "The provided data is invalid. Please check and try again.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
      return "Service temporarily unavailable. Please try again later.";
    case 503:
      return "Service is under maintenance. Please try again later.";
    case 504:
      return "Request timed out. Please try again.";
    default:
      if (status >= 500) {
        return "Server error. Please try again later.";
      }
      return "An error occurred. Please try again.";
  }
}

/**
 * Categorize error by type
 *
 * @param error - The error object
 * @returns Error type category
 */
export function categorizeError(error: unknown): ErrorType {
  if (!axios.isAxiosError(error)) {
    return ErrorType.UNKNOWN;
  }

  const status = error.response?.status;

  if (!status) {
    return ErrorType.NETWORK;
  }

  if (status === 401) {
    return ErrorType.AUTHENTICATION;
  }

  if (status === 403) {
    return ErrorType.AUTHORIZATION;
  }

  if (status === 404) {
    return ErrorType.NOT_FOUND;
  }

  if (status === 400 || status === 422) {
    return ErrorType.VALIDATION;
  }

  if (status >= 500) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Check if error is retryable
 *
 * @param error - The error object
 * @returns True if error should be retried
 */
export function isRetryableError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }

  const status = error.response?.status;

  // Network errors are retryable
  if (!status) {
    return true;
  }

  // 5xx server errors are retryable
  if (status >= 500) {
    return true;
  }

  // 429 rate limit is retryable
  if (status === 429) {
    return true;
  }

  // 408 request timeout is retryable
  if (status === 408) {
    return true;
  }

  // 4xx client errors are not retryable
  return false;
}

/**
 * Get retry delay based on attempt number (exponential backoff)
 *
 * @param attemptNumber - Current retry attempt (0-indexed)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @param maxDelay - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds
 */
export function getRetryDelay(
  attemptNumber: number,
  baseDelay: number = 1000,
  maxDelay: number = 30000
): number {
  const delay = baseDelay * Math.pow(2, attemptNumber);
  return Math.min(delay, maxDelay);
}

/**
 * Format error for logging to monitoring service
 *
 * @param error - The error object
 * @param context - Additional context information
 * @returns Formatted error object for logging
 */
export function formatErrorForLogging(
  error: unknown,
  context?: Record<string, any>
): Record<string, any> {
  const apiError = parseApiError(error);
  const errorType = categorizeError(error);

  return {
    message: apiError.message,
    code: apiError.code,
    status: apiError.status,
    type: errorType,
    details: apiError.details,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  };
}
