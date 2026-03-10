/**
 * Optimistic Update Utilities
 *
 * Provides helpers for implementing optimistic updates in mutations.
 * Optimistic updates immediately update the UI before the server responds,
 * then rollback if the mutation fails.
 */

import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./invalidation";
import type { Course, Enrollment, Review } from "../api/service-types";

/**
 * Context type for rollback on error
 */
interface OptimisticContext {
  previousCourses?: unknown;
  previousCourse?: unknown;
  previousProgress?: unknown;
  previousReviews?: unknown;
  previousEnrollments?: unknown;
}

/**
 * Optimistic update for course creation
 */
export function optimisticCourseCreate(queryClient: QueryClient, newCourse: Partial<Course>) {
  return {
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.lists() });

      // Snapshot previous value
      const previousCourses = queryClient.getQueryData(queryKeys.courses.lists());

      // Optimistically update to the new value
      queryClient.setQueryData(queryKeys.courses.lists(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          courses: [newCourse, ...(old.courses || [])],
          total: (old.total || 0) + 1,
        };
      });

      return { previousCourses };
    },

    onError: (_err: unknown, _variables: unknown, context?: OptimisticContext) => {
      // Rollback on error
      if (context?.previousCourses) {
        queryClient.setQueryData(queryKeys.courses.lists(), context.previousCourses);
      }
    },

    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
    },
  };
}

/**
 * Optimistic update for course updates
 */
export function optimisticCourseUpdate(
  queryClient: QueryClient,
  courseId: string,
  updates: Partial<Course>
) {
  return {
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.courses.detail(courseId) });

      // Snapshot previous value
      const previousCourse = queryClient.getQueryData(queryKeys.courses.detail(courseId));

      // Optimistically update
      queryClient.setQueryData(queryKeys.courses.detail(courseId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          course: {
            ...old.course,
            ...updates,
          },
        };
      });

      return { previousCourse };
    },

    onError: (_err: unknown, _variables: unknown, context?: OptimisticContext) => {
      // Rollback on error
      if (context?.previousCourse) {
        queryClient.setQueryData(queryKeys.courses.detail(courseId), context.previousCourse);
      }
    },

    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    },
  };
}

/**
 * Optimistic update for progress tracking
 */
export function optimisticProgressUpdate(
  queryClient: QueryClient,
  courseId: string,
  sectionId: string,
  completed: boolean
) {
  return {
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.progress.course(courseId) });

      // Snapshot previous value
      const previousProgress = queryClient.getQueryData(queryKeys.progress.course(courseId));

      // Optimistically update
      queryClient.setQueryData(queryKeys.progress.course(courseId), (old: any) => {
        if (!old) return old;

        const updatedSections = old.completedSections || [];
        const newSections = completed
          ? [...updatedSections, sectionId]
          : updatedSections.filter((id: string) => id !== sectionId);

        return {
          ...old,
          completedSections: newSections,
          progress: (newSections.length / (old.totalSections || 1)) * 100,
        };
      });

      return { previousProgress };
    },

    onError: (_err: unknown, _variables: unknown, context?: OptimisticContext) => {
      // Rollback on error
      if (context?.previousProgress) {
        queryClient.setQueryData(queryKeys.progress.course(courseId), context.previousProgress);
      }
    },

    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.progress.course(courseId) });
    },
  };
}

/**
 * Optimistic update for review creation
 */
export function optimisticReviewCreate(
  queryClient: QueryClient,
  courseId: string,
  newReview: Partial<Review>
) {
  return {
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.reviews.list(courseId) });

      // Snapshot previous value
      const previousReviews = queryClient.getQueryData(queryKeys.reviews.list(courseId));

      // Optimistically update
      queryClient.setQueryData(queryKeys.reviews.list(courseId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          reviews: [newReview, ...(old.reviews || [])],
          totalReviews: (old.totalReviews || 0) + 1,
        };
      });

      return { previousReviews };
    },

    onError: (_err: unknown, _variables: unknown, context?: OptimisticContext) => {
      // Rollback on error
      if (context?.previousReviews) {
        queryClient.setQueryData(queryKeys.reviews.list(courseId), context.previousReviews);
      }
    },

    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.list(courseId) });
    },
  };
}

/**
 * Optimistic update for review updates
 */
export function optimisticReviewUpdate(
  queryClient: QueryClient,
  courseId: string,
  reviewId: string,
  updates: Partial<Review>
) {
  return {
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.reviews.list(courseId) });

      // Snapshot previous value
      const previousReviews = queryClient.getQueryData(queryKeys.reviews.list(courseId));

      // Optimistically update
      queryClient.setQueryData(queryKeys.reviews.list(courseId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          reviews: old.reviews.map((review: Review) =>
            review.id === reviewId ? { ...review, ...updates } : review
          ),
        };
      });

      return { previousReviews };
    },

    onError: (_err: unknown, _variables: unknown, context?: OptimisticContext) => {
      // Rollback on error
      if (context?.previousReviews) {
        queryClient.setQueryData(queryKeys.reviews.list(courseId), context.previousReviews);
      }
    },

    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.list(courseId) });
    },
  };
}

/**
 * Optimistic update for review deletion
 */
export function optimisticReviewDelete(
  queryClient: QueryClient,
  courseId: string,
  reviewId: string
) {
  return {
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.reviews.list(courseId) });

      // Snapshot previous value
      const previousReviews = queryClient.getQueryData(queryKeys.reviews.list(courseId));

      // Optimistically update
      queryClient.setQueryData(queryKeys.reviews.list(courseId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          reviews: old.reviews.filter((review: Review) => review.id !== reviewId),
          totalReviews: Math.max((old.totalReviews || 1) - 1, 0),
        };
      });

      return { previousReviews };
    },

    onError: (_err: unknown, _variables: unknown, context?: OptimisticContext) => {
      // Rollback on error
      if (context?.previousReviews) {
        queryClient.setQueryData(queryKeys.reviews.list(courseId), context.previousReviews);
      }
    },

    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.list(courseId) });
    },
  };
}

/**
 * Optimistic update for enrollment creation
 */
export function optimisticEnrollmentCreate(
  queryClient: QueryClient,
  newEnrollment: Partial<Enrollment>
) {
  return {
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.enrollments.lists() });

      // Snapshot previous value
      const previousEnrollments = queryClient.getQueryData(queryKeys.enrollments.lists());

      // Optimistically update
      queryClient.setQueryData(queryKeys.enrollments.lists(), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          enrollments: [newEnrollment, ...(old.enrollments || [])],
        };
      });

      return { previousEnrollments };
    },

    onError: (_err: unknown, _variables: unknown, context?: OptimisticContext) => {
      // Rollback on error
      if (context?.previousEnrollments) {
        queryClient.setQueryData(queryKeys.enrollments.lists(), context.previousEnrollments);
      }
    },

    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.lists() });
    },
  };
}
