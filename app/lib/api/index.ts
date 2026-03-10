/**
 * API Module
 *
 * Central export point for all API-related functionality
 */

// Core client and utilities
export { default as apiClient, getErrorMessage, isErrorStatus } from "./client";

// Type exports
export * from "./service-types";

// Course API
export * as courseApi from "./courses";

// Enrollment API
export * as enrollmentApi from "./enrollments";

// Review API
export * as reviewApi from "./reviews";

// Search API
export * as searchApi from "./search";

// Payment API
export * as paymentApi from "./payments";

// Instructor API
export * as instructorApi from "./instructor";

// Auth API
export * as authApi from "./auth";
