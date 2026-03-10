/**
 * Monitoring Service
 *
 * Provides error logging and monitoring functionality.
 * In production, this would integrate with services like Sentry, DataDog, etc.
 */

interface ErrorContext {
  [key: string]: any;
}

/**
 * Log an error to the monitoring service
 */
export function logError(error: Error | unknown, context?: ErrorContext): void {
  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.error("Error logged:", error);
    if (context) {
      console.error("Context:", context);
    }
  }

  // In production, send to monitoring service
  // Example: Sentry.captureException(error, { extra: context });
}

/**
 * Log a warning to the monitoring service
 */
export function logWarning(message: string, context?: ErrorContext): void {
  if (process.env.NODE_ENV === "development") {
    console.warn("Warning:", message);
    if (context) {
      console.warn("Context:", context);
    }
  }

  // In production, send to monitoring service
}

/**
 * Log an info message to the monitoring service
 */
export function logInfo(message: string, context?: ErrorContext): void {
  if (process.env.NODE_ENV === "development") {
    console.info("Info:", message);
    if (context) {
      console.info("Context:", context);
    }
  }

  // In production, send to monitoring service
}
