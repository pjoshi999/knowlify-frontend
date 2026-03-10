/**
 * ReviewList Component
 *
 * Displays a list of course reviews with ratings, comments, and user information.
 * Handles empty state when no reviews exist.
 * Sorts reviews by most recent first.
 *
 * Validates: Requirements 11.8, 11.9
 */

"use client";

import { motion } from "framer-motion";
import { Review } from "@/app/lib/api/service-types";

export interface ReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
  emptyMessage?: string;
  currentUserId?: string;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

/**
 * Renders star rating display
 */
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-white fill-current" : "text-gray-300"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ))}
    </div>
  );
}

/**
 * Renders individual review card
 */
function ReviewCard({
  review,
  index,
  isOwnReview,
  onEdit,
  onDelete,
}: {
  review: Review;
  index: number;
  isOwnReview: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-card border border-border rounded-xl p-6"
    >
      <div className="flex items-start gap-4">
        {/* User Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
          <span className="text-sm font-bold text-foreground">
            {review.user?.name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>

        {/* Review Content */}
        <div className="flex-1">
          {/* Header: Name, Date, and Actions */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <p className="font-medium text-foreground">{review.user?.name || "Anonymous"}</p>
              <p className="text-sm text-foreground-secondary">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Edit and Delete buttons for own reviews */}
            {isOwnReview && (onEdit || onDelete) && (
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(review)}
                    className="text-sm text-white hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1"
                    aria-label="Edit review"
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(review.id)}
                    className="text-sm text-white hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded px-2 py-1"
                    aria-label="Delete review"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Star Rating */}
          <div className="mb-2">
            <StarRating rating={review.rating} />
          </div>

          {/* Review Comment */}
          <p className="text-foreground-secondary">{review.comment}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * ReviewList Component
 *
 * Displays all reviews for a course, sorted by most recent first.
 * Shows empty state when no reviews exist.
 * Allows users to edit and delete their own reviews.
 */
export function ReviewList({
  reviews,
  isLoading = false,
  emptyMessage = "No reviews yet. Be the first to review this course!",
  currentUserId,
  onEdit,
  onDelete,
}: ReviewListProps) {
  // Sort reviews by most recent first (Requirement 11.9)
  const sortedReviews = [...reviews].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  // Empty state (Requirement 11.8 - handle no reviews)
  if (sortedReviews.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-foreground-secondary opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
        <p className="text-foreground-secondary">{emptyMessage}</p>
      </div>
    );
  }

  // Display reviews (Requirement 11.8 - display individual reviews)
  return (
    <div className="space-y-4">
      {sortedReviews.map((review, index) => (
        <ReviewCard
          key={review.id}
          review={review}
          index={index}
          isOwnReview={currentUserId === review.userId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
