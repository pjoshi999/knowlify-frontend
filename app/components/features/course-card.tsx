"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Course } from "@/app/lib/api/service-types";
import { Button } from "@/app/components/ui/button";
import { OptimizedImage } from "@/app/components/ui/optimized-image";
import { formatPrice } from "@/app/lib/utils/price";

export interface CourseCardProps {
  course: Course;
  onPurchase?: (courseId: string) => void;
  showProgress?: boolean;
  progress?: number;
  isEnrolled?: boolean;
  onClick?: () => void;
  highlightQuery?: string;
}

const CourseCard = forwardRef<HTMLDivElement, CourseCardProps>(
  (
    {
      course,
      onPurchase,
      showProgress = false,
      progress = 0,
      isEnrolled = false,
      onClick,
      highlightQuery,
    },
    ref
  ) => {
    const handlePurchaseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onPurchase?.(course.id);
    };

    // Highlight matching text in course name
    const highlightText = (text: string, query?: string) => {
      if (!query || !query.trim()) return text;

      const regex = new RegExp(`(${query})`, "gi");
      const parts = text.split(regex);

      return parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-gray-800 text-foreground">
            {part}
          </mark>
        ) : (
          part
        )
      );
    };

    return (
      <div
        ref={ref}
        className="group bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-border/80 transition-colors duration-200"
        onClick={onClick}
      >
        {/* Course Thumbnail - 16:9 aspect ratio (280x158px) */}
        <div className="relative w-full aspect-[16/9] bg-muted overflow-hidden">
          {course.thumbnailUrl ? (
            <OptimizedImage
              src={course.thumbnailUrl}
              alt={course.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/80">
              <svg
                className="w-16 h-16 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
          )}

          {/* Progress Bar for Enrolled Courses */}
          {showProgress && isEnrolled && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          )}

          {/* Bestseller Badge (if high rating) */}
          {course.averageRating >= 4.5 && course.reviewCount >= 10 && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-foreground px-2 py-1 text-xs font-bold rounded">
              Bestseller
            </div>
          )}

          {/* Hover Overlay with Add to Cart Button */}
          {!isEnrolled && onPurchase && (
            <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                variant="primary"
                size="md"
                onClick={handlePurchaseClick}
                className="bg-primary text-primary-foreground hover:bg-primary-hover font-semibold"
              >
                Add to Cart
              </Button>
            </div>
          )}
        </div>

        {/* Course Content */}
        <div className="p-3">
          {/* Course Name - Bold, 2 lines max */}
          <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2 leading-tight">
            {highlightText(course.name, highlightQuery)}
          </h3>

          {/* Instructor Name - Small, gray */}
          {course.instructorName && (
            <p className="text-xs text-muted-foreground mb-2">{course.instructorName}</p>
          )}

          {/* Rating Stars + Review Count */}
          <div className="flex items-center gap-1 mb-2">
            <span className="text-sm font-bold text-yellow-500">
              {course.averageRating > 0 ? course.averageRating.toFixed(1) : "New"}
            </span>
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <svg
                  key={index}
                  className={`w-3 h-3 ${
                    index < Math.round(course.averageRating)
                      ? "text-yellow-500 fill-current"
                      : "text-muted-foreground fill-current"
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {course.reviewCount > 0 && (
              <span className="text-xs text-muted-foreground">({course.reviewCount})</span>
            )}
          </div>

          {/* Price and Meta Info */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-foreground">{formatPrice(course.price)}</div>
            {isEnrolled && showProgress && (
              <div className="text-xs font-medium text-muted-foreground">{progress}% Complete</div>
            )}
          </div>

          {/* Course Meta (duration, lessons, level) */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>All Levels</span>
            <span>•</span>
            <span>{course.enrollmentCount} students</span>
          </div>
        </div>
      </div>
    );
  }
);

CourseCard.displayName = "CourseCard";

export { CourseCard };
