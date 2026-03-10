/**
 * Cache Invalidation Strategies
 *
 * Defines when and how to invalidate cached data to ensure consistency
 * between client and server state.
 */

import { QueryClient } from "@tanstack/react-query";

/**
 * Query key factories for consistent cache key generation
 */
export const queryKeys = {
  // Course keys
  courses: {
    all: ["courses"] as const,
    lists: () => [...queryKeys.courses.all, "list"] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.courses.lists(), filters] as const,
    details: () => [...queryKeys.courses.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
  },

  // Course access keys
  courseAccess: (courseId: string) => ["courseAccess", courseId] as const,
  courseAssets: (courseId: string) => ["courseAssets", courseId] as const,

  // Enrollment keys
  enrollments: {
    all: ["enrollments"] as const,
    lists: () => [...queryKeys.enrollments.all, "list"] as const,
    list: (userId?: string) => [...queryKeys.enrollments.lists(), userId] as const,
    details: () => [...queryKeys.enrollments.all, "detail"] as const,
    detail: (id: string) => [...queryKeys.enrollments.details(), id] as const,
  },

  // Progress keys
  progress: {
    all: ["progress"] as const,
    course: (courseId: string) => [...queryKeys.progress.all, "course", courseId] as const,
    section: (sectionId: string) => [...queryKeys.progress.all, "section", sectionId] as const,
  },

  // Review keys
  reviews: {
    all: ["reviews"] as const,
    lists: () => [...queryKeys.reviews.all, "list"] as const,
    list: (courseId: string) => [...queryKeys.reviews.lists(), courseId] as const,
  },

  // Search keys
  search: {
    all: ["search"] as const,
    results: (query: string, filters?: Record<string, unknown> | undefined) =>
      [...queryKeys.search.all, "results", query, filters] as const,
    suggestions: (query: string) => [...queryKeys.search.all, "suggestions", query] as const,
  },

  // Instructor keys
  instructor: {
    all: ["instructor"] as const,
    stats: () => [...queryKeys.instructor.all, "stats"] as const,
    courses: () => [...queryKeys.instructor.all, "courses"] as const,
    transactions: (filters?: Record<string, unknown>) =>
      [...queryKeys.instructor.all, "transactions", filters] as const,
  },
};

/**
 * Invalidation strategies for different mutation types
 */
export const invalidationStrategies = {
  /**
   * After creating a course
   */
  onCourseCreate: (queryClient: QueryClient) => {
    // Invalidate course lists
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
    // Invalidate instructor courses
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.courses() });
    // Invalidate instructor stats
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.stats() });
  },

  /**
   * After updating a course
   */
  onCourseUpdate: (queryClient: QueryClient, courseId: string) => {
    // Invalidate specific course detail
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    // Invalidate course lists (in case name/price changed)
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
    // Invalidate instructor courses
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.courses() });
  },

  /**
   * After deleting a course
   */
  onCourseDelete: (queryClient: QueryClient, courseId: string) => {
    // Remove specific course from cache
    queryClient.removeQueries({ queryKey: queryKeys.courses.detail(courseId) });
    // Invalidate course lists
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
    // Invalidate instructor data
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.courses() });
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.stats() });
  },

  /**
   * After creating an enrollment (purchase)
   */
  onEnrollmentCreate: (queryClient: QueryClient, courseId: string) => {
    // Invalidate enrollment lists
    queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.lists() });
    // Invalidate course detail (to update isEnrolled status)
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    // Invalidate course access
    queryClient.invalidateQueries({ queryKey: queryKeys.courseAccess(courseId) });
    // Invalidate course assets (now accessible)
    queryClient.invalidateQueries({ queryKey: queryKeys.courseAssets(courseId) });
    // Invalidate instructor stats (enrollment count changed)
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.stats() });
  },

  /**
   * After updating progress
   */
  onProgressUpdate: (queryClient: QueryClient, courseId: string, sectionId: string) => {
    // Invalidate course progress
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.course(courseId) });
    // Invalidate section progress
    queryClient.invalidateQueries({ queryKey: queryKeys.progress.section(sectionId) });
    // Invalidate enrollment list (progress percentage changed)
    queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.lists() });
  },

  /**
   * After creating a review
   */
  onReviewCreate: (queryClient: QueryClient, courseId: string) => {
    // Invalidate review list for the course
    queryClient.invalidateQueries({ queryKey: queryKeys.reviews.list(courseId) });
    // Invalidate course detail (average rating changed)
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    // Invalidate course lists (average rating changed)
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
    // Invalidate instructor stats
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.stats() });
  },

  /**
   * After updating a review
   */
  onReviewUpdate: (queryClient: QueryClient, courseId: string) => {
    // Invalidate review list
    queryClient.invalidateQueries({ queryKey: queryKeys.reviews.list(courseId) });
    // Invalidate course detail (average rating may have changed)
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    // Invalidate course lists
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
    // Invalidate instructor stats
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.stats() });
  },

  /**
   * After deleting a review
   */
  onReviewDelete: (queryClient: QueryClient, courseId: string) => {
    // Invalidate review list
    queryClient.invalidateQueries({ queryKey: queryKeys.reviews.list(courseId) });
    // Invalidate course detail (average rating changed)
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    // Invalidate course lists
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
    // Invalidate instructor stats
    queryClient.invalidateQueries({ queryKey: queryKeys.instructor.stats() });
  },

  /**
   * After user logout
   */
  onLogout: (queryClient: QueryClient) => {
    // Clear all cached data
    queryClient.clear();
  },

  /**
   * After user login
   */
  onLogin: (queryClient: QueryClient) => {
    // Invalidate all queries to fetch fresh data for the new user
    queryClient.invalidateQueries();
  },
};
