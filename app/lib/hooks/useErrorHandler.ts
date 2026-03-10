import { useState, useCallback } from "react";
import { parseApiError, isRetryableError, getRetryDelay } from "@/lib/utils/error-parser";
import { logError } from "@/lib/services/monitoring";
import { useToast } from "@/app/components/ui/toast";

/**
 * Error handler hook options
 */
interface UseErrorHandlerOptions {
  showToast?: boolean;
  maxRetries?: number;
  onError?: (error: unknown) => void;
}

/**
 * Error handler hook return type
 */
interface UseErrorHandlerReturn {
  error: unknown | null;
  isRetrying: boolean;
  retryCount: number;
  handleError: (error: unknown) => void;
  clearError: () => void;
  retry: (fn: () => Promise<any>) => Promise<any>;
}

/**
 * Custom hook for handling errors with retry logic
 *
 * @param options - Configuration options
 * @returns Error handler utilities
 *
 * @example
 * ```tsx
 * const { error, handleError, retry } = useErrorHandler({
 *   showToast: true,
 *   maxRetries: 3
 * });
 *
 * const fetchData = async () => {
 *   try {
 *     const data = await api.getData();
 *     return data;
 *   } catch (err) {
 *     handleError(err);
 *   }
 * };
 *
 * // With retry
 * await retry(fetchData);
 * ```
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const { showToast = true, maxRetries = 3, onError } = options;

  const [error, setError] = useState<unknown | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { addToast } = useToast();

  /**
   * Handle error with logging and optional toast notification
   */
  const handleError = useCallback(
    (err: unknown) => {
      setError(err);

      // Log error to monitoring service
      logError(err, {
        component: "useErrorHandler",
        retryCount,
      });

      // Show toast notification if enabled
      if (showToast) {
        const apiError = parseApiError(err);
        addToast({
          type: "error",
          title: "Error",
          description: apiError.message,
        });
      }

      // Call custom error handler if provided
      if (onError) {
        onError(err);
      }
    },
    [showToast, addToast, onError, retryCount]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  /**
   * Retry a failed operation with exponential backoff
   */
  const retry = useCallback(
    async (fn: () => Promise<any>): Promise<any> => {
      let currentRetry = 0;

      while (currentRetry <= maxRetries) {
        try {
          setIsRetrying(currentRetry > 0);
          setRetryCount(currentRetry);

          const result = await fn();

          // Success - clear error state
          clearError();
          setIsRetrying(false);

          return result;
        } catch (err) {
          // Check if error is retryable
          if (!isRetryableError(err) || currentRetry >= maxRetries) {
            // Not retryable or max retries reached
            handleError(err);
            setIsRetrying(false);
            throw err;
          }

          // Calculate delay for next retry
          const delay = getRetryDelay(currentRetry);

          // Log retry attempt
          logError(err, {
            component: "useErrorHandler",
            retryAttempt: currentRetry + 1,
            maxRetries,
            nextRetryDelay: delay,
          });

          // Wait before retrying
          await new Promise((resolve) => setTimeout(resolve, delay));

          currentRetry++;
        }
      }
    },
    [maxRetries, handleError, clearError]
  );

  return {
    error,
    isRetrying,
    retryCount,
    handleError,
    clearError,
    retry,
  };
}

/**
 * Custom hook for handling async operations with error handling and retry
 *
 * @param asyncFn - Async function to execute
 * @param options - Configuration options
 * @returns Async operation utilities
 *
 * @example
 * ```tsx
 * const { execute, loading, error, data } = useAsyncWithRetry(
 *   async () => api.getData(),
 *   { maxRetries: 3 }
 * );
 *
 * // Execute the operation
 * await execute();
 * ```
 */
export function useAsyncWithRetry<T>(
  asyncFn: () => Promise<T>,
  options: UseErrorHandlerOptions = {}
) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const errorHandler = useErrorHandler(options);

  const execute = useCallback(async () => {
    setLoading(true);
    errorHandler.clearError();

    try {
      const result = await errorHandler.retry(asyncFn);
      setData(result);
      return result;
    } catch (err) {
      // Error already handled by retry function
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn, errorHandler]);

  return {
    execute,
    loading,
    error: errorHandler.error,
    data,
    isRetrying: errorHandler.isRetrying,
    retryCount: errorHandler.retryCount,
    clearError: errorHandler.clearError,
  };
}
