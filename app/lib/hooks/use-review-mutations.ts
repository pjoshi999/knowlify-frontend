/**
 * useReviewMutations Hook
 *
 * Custom React Query hooks for review mutations (create, update, delete)
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReview, updateReview, deleteReview } from "../api/reviews";
import { invalidationStrategies } from "../query/invalidation";
import type {
  CreateReviewRequest,
  CreateReviewResponse,
  UpdateReviewRequest,
  Review,
  DeleteReviewResponse,
} from "../api/service-types";

/**
 * Hook for creating a new review
 *
 * @example
 * ```tsx
 * const createReviewMutation = useCreateReview();
 *
 * const handleSubmit = async (data) => {
 *   try {
 *     const result = await createReviewMutation.mutateAsync({
 *       courseId: 'course-123',
 *       rating: 5,
 *       comment: 'Great course!'
 *     });
 *     console.log('Review created:', result.reviewId);
 *   } catch (error) {
 *     console.error('Failed to create review:', error);
 *   }
 * };
 * ```
 */
export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation<CreateReviewResponse, Error, CreateReviewRequest>({
    mutationFn: createReview,
    onSuccess: (_data, variables) => {
      // Use the comprehensive invalidation strategy
      invalidationStrategies.onReviewCreate(queryClient, variables.courseId);
    },
  });
}

/**
 * Hook for updating an existing review
 *
 * @example
 * ```tsx
 * const updateReviewMutation = useUpdateReview();
 *
 * const handleUpdate = async () => {
 *   try {
 *     const result = await updateReviewMutation.mutateAsync({
 *       reviewId: 'review-123',
 *       courseId: 'course-123',
 *       data: {
 *         rating: 4,
 *         comment: 'Updated review'
 *       }
 *     });
 *     console.log('Review updated:', result);
 *   } catch (error) {
 *     console.error('Failed to update review:', error);
 *   }
 * };
 * ```
 */
export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation<
    Review,
    Error,
    { reviewId: string; courseId: string; data: UpdateReviewRequest }
  >({
    mutationFn: ({ reviewId, data }) => updateReview(reviewId, data),
    onSuccess: (_data, variables) => {
      // Use the comprehensive invalidation strategy
      invalidationStrategies.onReviewUpdate(queryClient, variables.courseId);
    },
  });
}

/**
 * Hook for deleting a review
 *
 * @example
 * ```tsx
 * const deleteReviewMutation = useDeleteReview();
 *
 * const handleDelete = async () => {
 *   if (confirm('Are you sure you want to delete this review?')) {
 *     try {
 *       await deleteReviewMutation.mutateAsync({
 *         reviewId: 'review-123',
 *         courseId: 'course-123'
 *       });
 *       console.log('Review deleted');
 *     } catch (error) {
 *       console.error('Failed to delete review:', error);
 *     }
 *   }
 * };
 * ```
 */
export function useDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation<DeleteReviewResponse, Error, { reviewId: string; courseId: string }>({
    mutationFn: ({ reviewId }) => deleteReview(reviewId),
    onSuccess: (_data, variables) => {
      // Use the comprehensive invalidation strategy
      invalidationStrategies.onReviewDelete(queryClient, variables.courseId);
    },
  });
}
