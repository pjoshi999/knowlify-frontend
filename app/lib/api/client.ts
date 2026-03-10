import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import { logError } from "@/app/lib/services/monitoring";

let isHandlingUnauthorized = false;

/**
 * API Client Configuration
 *
 * This module provides a centralized Axios instance with:
 * - Automatic authentication token injection
 * - Request/response interceptors
 * - Retry logic with exponential backoff (max 3 retries)
 * - Error handling with monitoring
 * - Base URL and timeout configuration
 */

// Get API URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT = 30000;

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second
const RETRY_DELAY_MAX = 10000; // 10 seconds

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(attemptNumber: number): number {
  const delay = Math.min(RETRY_DELAY_BASE * Math.pow(2, attemptNumber - 1), RETRY_DELAY_MAX);
  // Add jitter to prevent thundering herd
  return delay + Math.random() * 1000;
}

/**
 * Determine if an error should be retried
 */
function shouldRetry(error: AxiosError, retryCount: number): boolean {
  // Don't retry if max retries reached
  if (retryCount >= MAX_RETRIES) {
    return false;
  }

  // Don't retry client errors. Surface immediately to the UI.
  if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
    return false;
  }

  // Retry 5xx errors
  if (error.response?.status && error.response.status >= 500) {
    return true;
  }

  // Retry network errors
  if (!error.response) {
    return true;
  }

  return false;
}

/**
 * Create the main Axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

function isApiEnvelope(value: unknown): value is ApiEnvelope<unknown> {
  return typeof value === "object" && value !== null && "success" in value && "data" in value;
}

export function unwrapApiData<T>(payload: unknown): T {
  if (isApiEnvelope(payload)) {
    if (!payload.success) {
      throw new Error(payload.error?.message || "Request failed");
    }
    return payload.data as T;
  }
  return payload as T;
}

/**
 * Request Interceptor
 *
 * Automatically injects authentication token from localStorage
 * into every request if available
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Get auth token from localStorage
    let token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

    // Fallback to persisted Supabase session if app-specific token is missing
    if (!token && typeof window !== "undefined") {
      try {
        const rawAuthStore = localStorage.getItem("auth-storage");
        if (rawAuthStore) {
          const parsed = JSON.parse(rawAuthStore) as {
            state?: { session?: { access_token?: string } };
          };
          token = parsed?.state?.session?.access_token ?? null;
        }
      } catch {
        token = null;
      }
    }

    // Inject token into Authorization header if available
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * Handles common response scenarios:
 * - Successful responses (pass through)
 * - 401 Unauthorized (clear auth and redirect to login)
 * - Retryable errors (5xx, network errors) with exponential backoff
 * - Other errors (format, log, and reject)
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Pass through successful responses
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };

    // Initialize retry count
    if (!config._retryCount) {
      config._retryCount = 0;
    }

    // Log error to monitoring service
    logError(error, {
      url: config?.url,
      method: config?.method,
      status: error.response?.status,
      retryCount: config._retryCount,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      // Clear auth and force login page without triggering redirect loops.
      if (typeof window !== "undefined" && !isHandlingUnauthorized) {
        isHandlingUnauthorized = true;
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        localStorage.removeItem("auth-storage");

        void import("@/app/lib/auth/supabase-client")
          .then(async ({ supabase }) => {
            await supabase.auth.signOut();
          })
          .catch((signOutError) => {
            console.error("Supabase sign-out during 401 handling failed:", signOutError);
          })
          .finally(() => {
            if (!window.location.pathname.startsWith("/login")) {
              window.location.replace("/login?reauth=1");
            }
            isHandlingUnauthorized = false;
          });
      }
      return Promise.reject(error);
    }

    // Handle 403 Forbidden - insufficient permissions
    if (error.response?.status === 403) {
      console.error("Access forbidden:", error.response.data);
      return Promise.reject(error);
    }

    // Check if we should retry
    if (shouldRetry(error, config._retryCount)) {
      config._retryCount += 1;
      const delay = getRetryDelay(config._retryCount);

      console.log(
        `Retrying request (attempt ${config._retryCount}/${MAX_RETRIES}) after ${delay}ms:`,
        config.url
      );

      // Wait for the delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return apiClient(config);
    }

    // Handle network errors
    if (!error.response) {
      console.error("Network error:", error.message);
    }

    // Reject with formatted error after all retries exhausted
    return Promise.reject(error);
  }
);

/**
 * Helper function to extract error message from API error response
 */
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | { message?: string; error?: string | { message?: string } }
      | undefined;
    const errorMessage =
      typeof responseData?.error === "object" ? responseData.error?.message : responseData?.error;
    // Extract error message from response data
    const message = responseData?.message || errorMessage || error.message;
    return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred";
};

/**
 * Error types for classification
 */
export enum ErrorType {
  NETWORK_ERROR = "network_error",
  CLIENT_ERROR = "client_error",
  SERVER_ERROR = "server_error",
  VALIDATION_ERROR = "validation_error",
  AUTHENTICATION_ERROR = "authentication_error",
  AUTHORIZATION_ERROR = "authorization_error",
  UNKNOWN_ERROR = "unknown_error",
}

/**
 * Classified error with user-friendly message
 */
export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
  statusCode?: number;
  originalError?: Error;
}

/**
 * Classify error and provide user-friendly message
 */
export const classifyError = (error: unknown): AppError => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = getErrorMessage(error);

    // Network errors
    if (!error.response) {
      return {
        type: ErrorType.NETWORK_ERROR,
        message,
        userMessage: "Connection issue. Please check your internet and try again.",
        retryable: true,
        originalError: error,
      };
    }

    // Authentication errors (401)
    if (status === 401) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        message,
        userMessage: "Your session has expired. Please log in again.",
        retryable: false,
        statusCode: status,
        originalError: error,
      };
    }

    // Authorization errors (403)
    if (status === 403) {
      return {
        type: ErrorType.AUTHORIZATION_ERROR,
        message,
        userMessage: "You don't have permission to access this.",
        retryable: false,
        statusCode: status,
        originalError: error,
      };
    }

    // Not found (404)
    if (status === 404) {
      return {
        type: ErrorType.CLIENT_ERROR,
        message,
        userMessage: "Resource not found.",
        retryable: false,
        statusCode: status,
        originalError: error,
      };
    }

    // Validation errors (400)
    if (status === 400) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        message,
        userMessage: message || "Invalid request. Please check your input.",
        retryable: false,
        statusCode: status,
        originalError: error,
      };
    }

    // Rate limiting (429)
    if (status === 429) {
      return {
        type: ErrorType.CLIENT_ERROR,
        message,
        userMessage: "Too many requests. Please wait a moment and try again.",
        retryable: false,
        statusCode: status,
        originalError: error,
      };
    }

    // Other 4xx errors
    if (status && status >= 400 && status < 500) {
      return {
        type: ErrorType.CLIENT_ERROR,
        message,
        userMessage: message || "Invalid request. Please check your input.",
        retryable: false,
        statusCode: status,
        originalError: error,
      };
    }

    // Server errors (5xx)
    if (status && status >= 500) {
      return {
        type: ErrorType.SERVER_ERROR,
        message,
        userMessage: "Server error. We're working on it. Please try again later.",
        retryable: true,
        statusCode: status,
        originalError: error,
      };
    }
  }

  // Unknown errors
  return {
    type: ErrorType.UNKNOWN_ERROR,
    message: error instanceof Error ? error.message : "An unexpected error occurred",
    userMessage: "An unexpected error occurred. Please try again.",
    retryable: false,
    originalError: error instanceof Error ? error : undefined,
  };
};

/**
 * Helper function to check if error is a specific HTTP status code
 */
export const isErrorStatus = (error: unknown, status: number): boolean => {
  return axios.isAxiosError(error) && error.response?.status === status;
};

export default apiClient;
