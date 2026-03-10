"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/loading";

export interface ReviewFormProps {
  courseId: string;
  onSubmit: (data: { rating: number; comment: string }) => Promise<void>;
  onCancel?: () => void;
  initialRating?: number;
  initialComment?: string;
  isEditing?: boolean;
}

const MAX_COMMENT_LENGTH = 2000;

export function ReviewForm({
  courseId: _courseId,
  onSubmit,
  onCancel,
  initialRating = 0,
  initialComment = "",
  isEditing = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    if (comment.trim().length === 0) {
      setError("Please write a comment");
      return;
    }

    if (comment.length > MAX_COMMENT_LENGTH) {
      setError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({ rating, comment: comment.trim() });

      // Reset form if not editing
      if (!isEditing) {
        setRating(0);
        setComment("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRating(initialRating);
    setComment(initialComment);
    setError(null);
    onCancel?.();
  };

  const remainingChars = MAX_COMMENT_LENGTH - comment.length;
  const isOverLimit = remainingChars < 0;

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl p-6"
    >
      <h3 className="text-xl font-bold text-foreground mb-4">
        {isEditing ? "Edit Your Review" : "Write a Review"}
      </h3>

      {/* Star Rating Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Rating <span className="text-white">*</span>
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="focus:outline-none focus:ring-2 focus:ring-white rounded transition-transform hover:scale-110"
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredStar || rating) ? "text-white fill-current" : "text-gray-300"
                }`}
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
            </button>
          ))}
          {rating > 0 && (
            <span className="ml-2 text-sm text-foreground-secondary">
              {rating} star{rating > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Comment Textarea */}
      <div className="mb-4">
        <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
          Your Review <span className="text-white">*</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this course..."
          rows={6}
          className={`w-full px-4 py-3 bg-background border rounded-xl text-foreground placeholder-foreground-secondary focus:outline-none focus:ring-2 focus:ring-white transition-colors resize-none ${
            isOverLimit ? "border-white focus:ring-white" : "border-border"
          }`}
          aria-describedby="comment-counter"
          disabled={isSubmitting}
        />
        <div
          id="comment-counter"
          className={`text-sm mt-1 ${
            isOverLimit
              ? "text-white"
              : remainingChars < 100
                ? "text-white"
                : "text-foreground-secondary"
          }`}
        >
          {remainingChars} character{remainingChars !== 1 ? "s" : ""} remaining
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-error border border-error rounded-xl text-error-foreground text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || isOverLimit}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Submitting...
            </>
          ) : isEditing ? (
            "Update Review"
          ) : (
            "Submit Review"
          )}
        </Button>

        {(isEditing || onCancel) && (
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
      </div>
    </motion.form>
  );
}
