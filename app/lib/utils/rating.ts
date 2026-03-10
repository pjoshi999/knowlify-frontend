/**
 * Rating Calculation Utilities
 *
 * Utility functions for calculating and formatting course ratings
 */

import type { Review } from "../api/service-types";

/**
 * Calculate average rating from an array of reviews
 *
 * @param reviews - Array of review objects
 * @returns Average rating rounded to 1 decimal place, or 0 if no reviews
 *
 * @example
 * ```ts
 * const reviews = [
 *   { rating: 5, ... },
 *   { rating: 4, ... },
 *   { rating: 5, ... }
 * ];
 * const avg = calculateAverageRating(reviews); // 4.7
 * ```
 */
export function calculateAverageRating(reviews: Review[]): number {
  if (!reviews || reviews.length === 0) {
    return 0;
  }

  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const average = sum / reviews.length;

  // Round to 1 decimal place
  return Math.round(average * 10) / 10;
}

/**
 * Format rating for display with proper decimal places
 *
 * @param rating - Rating value (0-5)
 * @returns Formatted rating string
 *
 * @example
 * ```ts
 * formatRating(4.7); // "4.7"
 * formatRating(5);   // "5.0"
 * formatRating(0);   // "No ratings"
 * ```
 */
export function formatRating(rating: number): string {
  if (rating === 0) {
    return "No ratings";
  }

  return rating.toFixed(1);
}

/**
 * Format review count for display
 *
 * @param count - Number of reviews
 * @returns Formatted review count string
 *
 * @example
 * ```ts
 * formatReviewCount(0);   // "No reviews"
 * formatReviewCount(1);   // "1 review"
 * formatReviewCount(42);  // "42 reviews"
 * formatReviewCount(1234); // "1.2K reviews"
 * ```
 */
export function formatReviewCount(count: number): string {
  if (count === 0) {
    return "No reviews";
  }

  if (count === 1) {
    return "1 review";
  }

  // Format large numbers with K suffix
  if (count >= 1000) {
    const thousands = count / 1000;
    return `${thousands.toFixed(1)}K reviews`;
  }

  return `${count} reviews`;
}

/**
 * Get rating distribution from reviews
 * Returns count of reviews for each star rating (1-5)
 *
 * @param reviews - Array of review objects
 * @returns Object with counts for each rating level
 *
 * @example
 * ```ts
 * const reviews = [
 *   { rating: 5, ... },
 *   { rating: 4, ... },
 *   { rating: 5, ... }
 * ];
 * const dist = getRatingDistribution(reviews);
 * // { 1: 0, 2: 0, 3: 0, 4: 1, 5: 2 }
 * ```
 */
export function getRatingDistribution(reviews: Review[]): Record<number, number> {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach((review) => {
    const rating = Math.round(review.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof typeof distribution]++;
    }
  });

  return distribution;
}

/**
 * Get percentage of reviews for a specific rating
 *
 * @param reviews - Array of review objects
 * @param rating - Rating level (1-5)
 * @returns Percentage of reviews with that rating (0-100)
 *
 * @example
 * ```ts
 * const reviews = [
 *   { rating: 5, ... },
 *   { rating: 4, ... },
 *   { rating: 5, ... },
 *   { rating: 5, ... }
 * ];
 * getRatingPercentage(reviews, 5); // 75
 * getRatingPercentage(reviews, 4); // 25
 * ```
 */
export function getRatingPercentage(reviews: Review[], rating: number): number {
  if (!reviews || reviews.length === 0) {
    return 0;
  }

  const distribution = getRatingDistribution(reviews);
  const count = distribution[rating as keyof typeof distribution] || 0;

  return Math.round((count / reviews.length) * 100);
}

/**
 * Validate rating value
 *
 * @param rating - Rating value to validate
 * @returns True if rating is valid (1-5), false otherwise
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}
