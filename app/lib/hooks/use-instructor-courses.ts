/**
 * useInstructorCourses Hook
 *
 * Custom React Query hook for fetching instructor's courses
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { getInstructorCourses } from "../api/instructor";
import { updateCourse, deleteCourse } from "../api/courses";
import { queryKeys } from "../query/invalidation";
import type {
  GetInstructorCoursesResponse,
  UpdateCourseRequest,
  Course,
} from "../api/service-types";

export interface UseInstructorCoursesOptions {
  enabled?: boolean;
}

/**
 * Hook for fetching instructor's courses
 *
 * @param options - Query options
 * @returns Query result with instructor's courses
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useInstructorCourses();
 *
 * if (data) {
 *   data.courses.forEach(course => {
 *     console.log(course.name, course.published);
 *   });
 * }
 * ```
 */
export function useInstructorCourses(
  options: UseInstructorCoursesOptions = {}
): UseQueryResult<GetInstructorCoursesResponse, Error> {
  const { enabled = true } = options;

  return useQuery({
    queryKey: queryKeys.instructor.courses(),
    queryFn: () => getInstructorCourses(),
    enabled,
  });
}

/**
 * Hook for updating a course
 *
 * @returns Mutation for updating course
 *
 * @example
 * ```tsx
 * const updateCourseMutation = useUpdateCourse();
 *
 * const handleUpdate = async () => {
 *   await updateCourseMutation.mutateAsync({
 *     courseId: '123',
 *     data: { published: false }
 *   });
 * };
 * ```
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: UpdateCourseRequest }) =>
      updateCourse(courseId, data),
    onSuccess: (updatedCourse: Course) => {
      // Invalidate instructor stats and courses
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.courses() });

      // Update the specific course in cache
      queryClient.setQueryData(queryKeys.courses.detail(updatedCourse.id), (old: any) => ({
        ...old,
        course: updatedCourse,
      }));
    },
  });
}

/**
 * Hook for deleting a course
 *
 * @returns Mutation for deleting course
 *
 * @example
 * ```tsx
 * const deleteCourseMutation = useDeleteCourse();
 *
 * const handleDelete = async () => {
 *   await deleteCourseMutation.mutateAsync('course-id');
 * };
 * ```
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => deleteCourse(courseId),
    onSuccess: () => {
      // Invalidate instructor stats and courses
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.instructor.courses() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all });
    },
  });
}
