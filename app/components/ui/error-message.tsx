"use client";

import { parseApiError, categorizeError, ErrorType } from "@/app/lib/utils/error-parser";

/**
 * Error Message Props
 */
interface ErrorMessageProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Error Message Component
 *
 * Displays user-friendly error messages with appropriate styling
 * and optional retry functionality.
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   error={error}
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function ErrorMessage({ error, title, onRetry, className = "" }: ErrorMessageProps) {
  const apiError = parseApiError(error);
  const errorType = categorizeError(error);

  const getIcon = () => {
    switch (errorType) {
      case ErrorType.NETWORK:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        );
      case ErrorType.AUTHENTICATION:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        );
      case ErrorType.AUTHORIZATION:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        );
      case ErrorType.NOT_FOUND:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getTitle = () => {
    if (title) return title;

    switch (errorType) {
      case ErrorType.NETWORK:
        return "Connection Error";
      case ErrorType.AUTHENTICATION:
        return "Authentication Required";
      case ErrorType.AUTHORIZATION:
        return "Access Denied";
      case ErrorType.NOT_FOUND:
        return "Not Found";
      case ErrorType.VALIDATION:
        return "Invalid Input";
      case ErrorType.SERVER:
        return "Server Error";
      default:
        return "Error";
    }
  };

  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-red-600 dark:text-red-400 mt-0.5">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">{getTitle()}</h3>

          <p className="text-sm text-red-700 dark:text-red-400">{apiError.message}</p>

          {process.env.NODE_ENV === "development" && apiError.code && (
            <p className="text-xs text-red-600 dark:text-red-500 mt-1 font-mono">
              Code: {apiError.code} {apiError.status && `(${apiError.status})`}
            </p>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Inline Error Message Component
 *
 * Compact error message for inline display (e.g., in forms)
 */
export function InlineErrorMessage({
  error,
  className = "",
}: {
  error: unknown;
  className?: string;
}) {
  const apiError = parseApiError(error);

  return (
    <p className={`text-sm text-red-600 dark:text-red-400 ${className}`}>{apiError.message}</p>
  );
}

/**
 * Error Alert Component
 *
 * Full-width alert-style error message
 */
export function ErrorAlert({
  error,
  onDismiss,
  className = "",
}: {
  error: unknown;
  onDismiss?: () => void;
  className?: string;
}) {
  const apiError = parseApiError(error);

  return (
    <div
      className={`rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <p className="text-sm text-red-800 dark:text-red-300">{apiError.message}</p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
