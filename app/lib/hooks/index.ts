/**
 * Custom React Query Hooks
 *
 * Centralized exports for all custom hooks in the application
 */

export { useCourses } from "./use-courses";
export type { UseCoursesOptions } from "./use-courses";

export { useCoursesInfinite } from "./use-courses-infinite";
export type { UseCoursesInfiniteOptions } from "./use-courses-infinite";

export { useCourse } from "./use-course";
export type { UseCourseOptions } from "./use-course";

export { useEnrollments } from "./use-enrollments";
export type { UseEnrollmentsOptions } from "./use-enrollments";

export { useLibrary } from "./use-library";
export type { EnrollmentWithCourse, LibraryData } from "./use-library";

export { useCourseAssets } from "./use-course-assets";
export type { CourseAsset } from "./use-course-assets";

export { useReviews } from "./use-reviews";
export type { UseReviewsOptions } from "./use-reviews";

export { useSearch, useSearchSuggestions } from "./use-search";
export type { UseSearchOptions } from "./use-search";

export { useInstructorStats } from "./use-instructor-stats";
export type { UseInstructorStatsOptions } from "./use-instructor-stats";

export { useInstructorCourses, useUpdateCourse, useDeleteCourse } from "./use-instructor-courses";
export type { UseInstructorCoursesOptions } from "./use-instructor-courses";

export {
  usePrefetchImages,
  usePrefetchNextPage,
  usePrefetchResources,
  useIntersectionPrefetch,
  usePrefetchOnIdle,
} from "./use-prefetch";
