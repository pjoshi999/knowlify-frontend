/**
 * Review API Service
 *
 * Service layer for course review operations
 */

import apiClient from "./client";
import { unwrapApiData } from "./client";
import { mapReview } from "./mappers";
import type {
  CreateReviewRequest,
  CreateReviewResponse,
  UpdateReviewRequest,
  Review,
  DeleteReviewResponse,
  GetReviewsResponse,
} from "./service-types";

/**
 * Create a new review for a course
 */
export async function createReview(data: CreateReviewRequest): Promise<CreateReviewResponse> {
  const response = await apiClient.post("/reviews", data);
  const review = mapReview(unwrapApiData<any>(response.data));
  return {
    reviewId: review.id,
    review,
  };
}

/**
 * Update an existing review
 */
export async function updateReview(reviewId: string, data: UpdateReviewRequest): Promise<Review> {
  const response = await apiClient.put(`/reviews/${reviewId}`, data);
  return mapReview(unwrapApiData<any>(response.data));
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<DeleteReviewResponse> {
  const response = await apiClient.delete(`/reviews/${reviewId}`);
  unwrapApiData<{ message?: string }>(response.data);
  return { success: true };
}

/**
 * Get all reviews for a specific course
 */
export async function getReviews(courseId: string): Promise<GetReviewsResponse> {
  const response = await apiClient.get(`/reviews/courses/${courseId}`);
  const payload = unwrapApiData<any[]>(response.data);
  const reviews = (payload || []).map(mapReview);
  const totalReviews = reviews.length;
  const averageRating = totalReviews
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;
  return {
    reviews,
    averageRating,
    totalReviews,
  };
}
