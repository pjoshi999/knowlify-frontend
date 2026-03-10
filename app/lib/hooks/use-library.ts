/**
 * useLibrary Hook
 *
 * Custom hook for fetching student library with course details
 * Combines enrollment data with course information
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getEnrollments } from "../api/enrollments";
import { getCourse } from "../api/courses";
import { queryKeys } from "../query/invalidation";
import type { Enrollment, Course } from "../api/service-types";

export interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

export interface LibraryData {
  enrollments: EnrollmentWithCourse[];
}

/**
 * Hook for fetching student library with full course details
 *
 * @returns Query result with enrollments and their associated courses
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useLibrary();
 *
 * if (data) {
 *   data.enrollments.forEach(enrollment => {
 *     console.log(enrollment.course.name);
 *     console.log(enrollment.progressPercentage);
 *   });
 * }
 * ```
 */
export function useLibrary(): UseQueryResult<LibraryData, Error> {
  return useQuery({
    queryKey: queryKeys.enrollments.lists(),
    queryFn: async () => {
      // Fetch all enrollments (backend already includes course data)
      const enrollmentsResponse = await getEnrollments();

      // Check if enrollments already have course data from backend
      const enrollmentsWithCourses = await Promise.all(
        enrollmentsResponse.enrollments.map(async (enrollment) => {
          // If course data is already included, use it
          if ((enrollment as any).course) {
            return enrollment as EnrollmentWithCourse;
          }

          // Otherwise, fetch course details separately
          try {
            const courseResponse = await getCourse(enrollment.courseId);
            return {
              ...enrollment,
              course: courseResponse.course,
            };
          } catch (error) {
            // If course fetch fails, return enrollment with a placeholder course
            console.error(`Failed to fetch course ${enrollment.courseId}:`, error);
            return {
              ...enrollment,
              course: {
                id: enrollment.courseId,
                instructorId: "",
                name: "Course Unavailable",
                description: "",
                price: 0,
                published: false,
                enrollmentCount: 0,
                averageRating: 0,
                reviewCount: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            };
          }
        })
      );

      return {
        enrollments: enrollmentsWithCourses,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
