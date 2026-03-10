/**
 * Course Home Template Component
 *
 * Displays course overview, sections, instructor information, and reviews.
 * Provides navigation to course sections for enrolled students.
 *
 * Validates: Requirements 22.2, 22.5, 22.6, 22.7, 22.8, 22.9
 */

"use client";

import { motion } from "framer-motion";
import { Course, CourseSection, Instructor, Review } from "@/app/lib/api/service-types";
import { Button } from "@/app/components/ui/button";
import { ReviewList } from "@/app/components/features/review-list";
import { formatPrice } from "@/app/lib/utils/price";

export interface CourseHomeTemplateProps {
  course: Course;
  sections: CourseSection[];
  instructor: Instructor;
  reviews: Review[];
  isEnrolled: boolean;
  currentSectionId?: string;
  onSectionClick?: (sectionId: string) => void;
}

export function CourseHomeTemplate({
  course,
  sections,
  instructor,
  reviews,
  isEnrolled,
  currentSectionId,
  onSectionClick,
}: CourseHomeTemplateProps) {
  // Calculate total duration
  const totalDuration = sections.reduce((sum, section) => sum + section.durationMinutes, 0);

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Calculate average rating
  const averageRating = course.averageRating || 0;
  const reviewCount = reviews.length;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">{course.name}</h1>
        <p className="text-lg text-foreground-secondary mb-6">{course.description}</p>

        {/* Course Stats */}
        <div className="flex flex-wrap items-center gap-6 text-sm">
          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-5 h-5 ${
                    star <= Math.round(averageRating) ? "text-white fill-current" : "text-gray-300"
                  }`}
                  fill={star <= Math.round(averageRating) ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
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
            <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
            <span className="text-foreground-secondary">
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>

          {/* Enrollments */}
          <div className="flex items-center gap-2 text-foreground-secondary">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>{course.enrollmentCount} students enrolled</span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-2 text-foreground-secondary">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{formatDuration(totalDuration)} total</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Outline */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">Course Content</h2>
            <div className="space-y-2">
              {sections.map((section, index) => {
                const isCurrentSection = section.id === currentSectionId;
                const canNavigate = isEnrolled && onSectionClick;

                return (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                    className={`p-4 rounded-lg border transition-all ${
                      isCurrentSection
                        ? "bg-gray-900 border-white"
                        : "bg-muted border-border hover:border-gray-400"
                    } ${canNavigate ? "cursor-pointer" : ""}`}
                    onClick={() => canNavigate && onSectionClick(section.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-semibold">
                            {index + 1}
                          </span>
                          <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
                        </div>
                        {section.description && (
                          <p className="text-sm text-foreground-secondary ml-11">
                            {section.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground-secondary whitespace-nowrap">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>{formatDuration(section.durationMinutes)}</span>
                      </div>
                    </div>
                    {isCurrentSection && (
                      <div className="mt-2 ml-11 flex items-center gap-2 text-sm text-primary font-medium">
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Currently viewing
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Reviews Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Student Reviews ({reviewCount})
            </h2>
            <ReviewList
              reviews={reviews}
              emptyMessage="No reviews yet. Be the first to review this course!"
            />
          </motion.section>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="sticky top-4 space-y-6"
          >
            {/* Instructor Card */}
            <div className="p-6 rounded-lg bg-muted border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4">Instructor</h3>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">
                    {instructor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground mb-1">{instructor.name}</h4>
                  <p className="text-sm text-foreground-secondary mb-2">{instructor.email}</p>
                  {instructor.bio && (
                    <p className="text-sm text-foreground-secondary">{instructor.bio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Course Info Card */}
            <div className="p-6 rounded-lg bg-muted border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4">Course Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary">Price</span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(course.price)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary">Sections</span>
                  <span className="font-semibold text-foreground">{sections.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground-secondary">Duration</span>
                  <span className="font-semibold text-foreground">
                    {formatDuration(totalDuration)}
                  </span>
                </div>
                {course.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground-secondary">Category</span>
                    <span className="font-semibold text-foreground">{course.category}</span>
                  </div>
                )}
              </div>

              {!isEnrolled && (
                <div className="mt-6">
                  <Button variant="primary" size="lg" className="w-full">
                    Enroll Now
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
