/**
 * Error Handling and Recovery Utilities
 *
 * Provides user-friendly error messages and retry logic
 */

import { AxiosError } from "axios";

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

/**
 * Convert various error types to AppError
 */
export const normalizeError = (error: unknown): AppError => {
  // Axios error
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const data = error.response?.data;

    return {
      code: data?.error?.code || "NETWORK_ERROR",
      message: data?.error?.message || error.message || "Network request failed",
      details: data?.error?.details,
      statusCode,
    };
  }

  // Standard Error
  if (error instanceof Error) {
    return {
      code: "UNKNOWN_ERROR",
      message: error.message,
      statusCode: 500,
    };
  }

  // Unknown error type
  return {
    code: "UNKNOWN_ERROR",
    message: "An unexpected error occurred",
    statusCode: 500,
  };
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyMessage = (error: AppError): string => {
  const messages: Record<string, string> = {
    // Network errors
    NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection.",
    TIMEOUT_ERROR: "The request took too long. Please try again.",

    // Authentication errors
    UNAUTHORIZED: "You need to be logged in to perform this action.",
    FORBIDDEN: "You do not have permission to perform this action.",
    TOKEN_EXPIRED: "Your session has expired. Please log in again.",

    // Validation errors
    BAD_REQUEST: "Invalid request. Please check your input and try again.",
    VALIDATION_ERROR: "Please check your input and try again.",

    // Resource errors
    NOT_FOUND: "The requested resource was not found.",
    CONFLICT: "This resource already exists.",
    GONE: "This resource is no longer available.",

    // Upload errors
    FILE_TOO_LARGE: "One or more files exceed the maximum size limit (5GB per file).",
    INVALID_FILE_TYPE: "One or more files have an unsupported file type.",
    UPLOAD_FAILED: "File upload failed. Please try again.",

    // Analysis errors
    ANALYSIS_FAILED: "AI analysis failed. You can retry the analysis later.",
    RATE_LIMIT_EXCEEDED: "Too many requests. Please wait a moment and try again.",

    // Server errors
    INTERNAL_SERVER_ERROR: "An unexpected error occurred. Please try again later.",
    SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again later.",
  };

  return messages[error.code] || error.message || "An unexpected error occurred";
};

/**
 * Determine if error is retryable
 */
export const isRetryableError = (error: AppError): boolean => {
  const retryableCodes = [
    "NETWORK_ERROR",
    "TIMEOUT_ERROR",
    "RATE_LIMIT_EXCEEDED",
    "SERVICE_UNAVAILABLE",
    "INTERNAL_SERVER_ERROR",
  ];

  const retryableStatusCodes = [408, 429, 500, 502, 503, 504];

  return (
    retryableCodes.includes(error.code) ||
    (error.statusCode !== undefined && retryableStatusCodes.includes(error.statusCode))
  );
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> => {
  const { maxRetries = 3, initialDelay = 1000, maxDelay = 30000, backoffMultiplier = 2 } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const normalizedError = normalizeError(error);

      // Don't retry if error is not retryable
      if (!isRetryableError(normalizedError)) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);

      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries} failed, retrying in ${delay}ms...`);
    }
  }

  throw lastError;
};

/**
 * Log error for debugging
 */
export const logError = (error: unknown, context?: string): void => {
  const normalizedError = normalizeError(error);

  console.error("[Error]", {
    context,
    code: normalizedError.code,
    message: normalizedError.message,
    statusCode: normalizedError.statusCode,
    details: normalizedError.details,
    timestamp: new Date().toISOString(),
  });

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to error tracking service
  }
};

/**
 * Handle error with user notification
 */
export const handleError = (
  error: unknown,
  context?: string,
  onError?: (message: string) => void
): void => {
  const normalizedError = normalizeError(error);
  const userMessage = getUserFriendlyMessage(normalizedError);

  logError(error, context);

  if (onError) {
    onError(userMessage);
  }
};
