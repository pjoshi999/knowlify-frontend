"use client";

import { motion } from "framer-motion";
import type { Review } from "@/app/lib/api/service-types";

export interface RatingDistributionProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

/**
 * RatingDistribution Component
 *
 * Displays a visual breakdown of rating distribution showing:
 * - Average rating with large display
 * - Total review count
 * - Bar chart showing count of reviews at each star level (5 to 1)
 * - Percentage of reviews at each level
 *
 * Validates: Requirements 11.7 (optional enhancement)
 */
export function RatingDistribution({
  reviews,
  averageRating,
  totalReviews,
}: RatingDistributionProps) {
  // Calculate distribution of ratings
  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length;
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
    return { stars, count, percentage };
  });

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Rating Distribution</h3>

      <div className="flex items-start gap-8">
        {/* Average Rating Display */}
        <div className="flex flex-col items-center">
          <div className="text-5xl font-bold text-foreground mb-2">
            {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
          </div>

          {/* Star Display */}
          <div className="flex items-center mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(averageRating) ? "text-white fill-current" : "text-gray-300"
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
            ))}
          </div>

          <div className="text-sm text-foreground-secondary">
            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>

        {/* Distribution Bars */}
        <div className="flex-1 space-y-2">
          {distribution.map(({ stars, count, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              {/* Star Label */}
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium text-foreground">{stars}</span>
                <svg
                  className="w-4 h-4 text-white fill-current"
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
              </div>

              {/* Progress Bar */}
              <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, delay: 0.1 * (5 - stars) }}
                />
              </div>

              {/* Count and Percentage */}
              <div className="w-20 text-right">
                <span className="text-sm text-foreground-secondary">
                  {count} ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
