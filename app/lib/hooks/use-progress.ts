/**
 * useProgress Hook
 *
 * Custom React Query hook for managing course progress tracking
 */

import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { updateProgress } from "../api/enrollments";
import { queryKeys } from "../query/invalidation";
import type { UpdateProgressRequest, UpdateProgressResponse } from "../api/service-types";

export interface UpdateProgressParams {
  enrollmentId: string;
  data: UpdateProgressRequest;
}

/**
 * Hook for updating course progress
 *
 * @returns Mutation result for updating progress
 *
 * @example
 * ```tsx
 * const updateProgressMutation = useUpdateProgress();
 *
 * const handleSectionComplete = async () => {
 *   await updateProgressMutation.mutateAsync({
 *     enrollmentId: 'enrollment-123',
 *     data: {
 *       sectionId: 'section-456',
 *       completed: true,
 *       timeSpent: 300
 *     }
 *   });
 * };
 * ```
 */
export function useUpdateProgress(): UseMutationResult<
  UpdateProgressResponse,
  Error,
  UpdateProgressParams
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, data }: UpdateProgressParams) =>
      updateProgress(enrollmentId, data),
    onSuccess: () => {
      // Invalidate enrollments to refresh progress data
      queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.lists() });
    },
  });
}

/**
 * Hook for tracking video progress
 *
 * @param enrollmentId - The enrollment ID
 * @param sectionId - The section ID
 * @returns Functions to update progress
 *
 * @example
 * ```tsx
 * const { markComplete, updateTimeSpent } = useVideoProgress(enrollmentId, sectionId);
 *
 * // Mark section as complete
 * await markComplete();
 *
 * // Update time spent
 * await updateTimeSpent(120);
 * ```
 */
export function useVideoProgress(enrollmentId: string, sectionId: string) {
  const updateProgressMutation = useUpdateProgress();

  const markComplete = async () => {
    return updateProgressMutation.mutateAsync({
      enrollmentId,
      data: {
        sectionId,
        completed: true,
      },
    });
  };

  const updateTimeSpent = async (timeSpent: number) => {
    return updateProgressMutation.mutateAsync({
      enrollmentId,
      data: {
        sectionId,
        completed: false,
        timeSpent,
      },
    });
  };

  return {
    markComplete,
    updateTimeSpent,
    isUpdating: updateProgressMutation.isPending,
    error: updateProgressMutation.error,
  };
}
