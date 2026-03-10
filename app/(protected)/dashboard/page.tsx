/**
 * Student Library Page
 *
 * Displays all enrolled courses with progress tracking.
 * Allows students to continue learning and filter courses by status.
 *
 * Validates: Requirements 9.1, 10.3, 10.4
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/app/components/auth/protected-route";
import { useLibrary, type EnrollmentWithCourse } from "@/app/lib/hooks/use-library";
import { CourseCard } from "@/app/components/features/course-card";
import { Button } from "@/app/components/ui/button";
import { Skeleton } from "@/app/components/ui/loading";
import { ErrorMessage } from "@/app/components/ui/error-message";
import { motion } from "framer-motion";

type FilterStatus = "all" | "in-progress" | "completed";

export default function StudentLibraryPage() {
  const router = useRouter();
  const { data, isLoading, error } = useLibrary();
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  // Filter enrollments based on selected status
  const filteredEnrollments = useMemo(() => {
    if (!data?.enrollments) return [];

    switch (filterStatus) {
      case "completed":
        return data.enrollments.filter((e) => e.progressPercentage === 100);
      case "in-progress":
        return data.enrollments.filter(
          (e) => e.progressPercentage > 0 && e.progressPercentage < 100
        );
      case "all":
      default:
        return data.enrollments;
    }
  }, [data, filterStatus]); // Use data instead of data?.enrollments

  const handleContinueLearning = (courseId: string) => {
    // Navigate to course player - it will automatically resume from last accessed section
    router.push(`/learn/${courseId}`);
  };

  const handleCourseClick = (courseId: string) => {
    // Navigate to course detail page
    router.push(`/courses/${courseId}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-background border-b border-border">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/50 border border-border/50 mb-6 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground"></span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {data?.enrollments?.length || 0} active{" "}
                  {data?.enrollments?.length === 1 ? "course" : "courses"}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-[1.1] tracking-tight">
                <span className="text-foreground">My Learning</span>
                <br />
                <span className="bg-gradient-to-r from-foreground via-foreground-secondary to-muted-foreground bg-clip-text text-transparent">
                  Journey
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
                Continue where you left off and track your progress
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 border ${filterStatus === "all"
                    ? "bg-muted text-foreground border-border"
                    : "bg-card/50 text-muted-foreground hover:text-foreground border-border/50 hover:bg-muted"
                  }`}
              >
                All Courses
                {data?.enrollments && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-background text-xs">
                    {data.enrollments.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterStatus("in-progress")}
                className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 border ${filterStatus === "in-progress"
                    ? "bg-muted text-foreground border-border"
                    : "bg-card/50 text-muted-foreground hover:text-foreground border-border/50 hover:bg-muted"
                  }`}
              >
                In Progress
                {data?.enrollments && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-background text-xs">
                    {
                      data.enrollments.filter(
                        (e) => e.progressPercentage > 0 && e.progressPercentage < 100
                      ).length
                    }
                  </span>
                )}
              </button>
              <button
                onClick={() => setFilterStatus("completed")}
                className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 border ${filterStatus === "completed"
                    ? "bg-muted text-foreground border-border"
                    : "bg-card/50 text-muted-foreground hover:text-foreground border-border/50 hover:bg-muted"
                  }`}
              >
                Completed
                {data?.enrollments && (
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-background text-xs">
                    {data.enrollments.filter((e) => e.progressPercentage === 100).length}
                  </span>
                )}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              {filteredEnrollments.length} {filteredEnrollments.length === 1 ? "course" : "courses"}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <ErrorMessage error={error} title="Failed to load your courses" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredEnrollments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-20 px-4"
            >
              <div className="w-20 h-20 rounded-full bg-card/50 flex items-center justify-center mb-6 border border-border/50">
                <svg
                  className="w-10 h-10 text-muted-foreground"
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
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                {filterStatus === "all" && "Your library is empty"}
                {filterStatus === "in-progress" && "No courses in progress"}
                {filterStatus === "completed" && "No completed courses yet"}
              </h2>
              <p className="text-muted-foreground text-center mb-6">
                {filterStatus === "all"
                  ? "Start your learning journey by exploring our course marketplace"
                  : filterStatus === "in-progress"
                    ? "You don't have any courses in progress. Start learning or browse more courses."
                    : "Complete your enrolled courses to see them here."}
              </p>
              {filterStatus === "all" && (
                <button
                  onClick={() => router.push("/courses")}
                  className="px-6 py-3 bg-muted hover:bg-muted-foreground/20 text-foreground rounded-xl transition-colors border border-border"
                >
                  Browse Courses
                </button>
              )}
              {filterStatus !== "all" && (
                <button
                  onClick={() => setFilterStatus("all")}
                  className="px-6 py-3 bg-card/50 hover:bg-muted text-foreground rounded-xl transition-colors border border-border/50"
                >
                  View All Courses
                </button>
              )}
            </motion.div>
          )}

          {/* Course Grid */}
          {!isLoading && !error && filteredEnrollments.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {filteredEnrollments.map((enrollment, index) => (
                <motion.div
                  key={enrollment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <EnrolledCourseCard
                    enrollment={enrollment}
                    onContinue={handleContinueLearning}
                    onClick={handleCourseClick}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

function EnrolledCourseCard({
  enrollment,
  onContinue,
  onClick,
}: {
  enrollment: EnrollmentWithCourse;
  onContinue: (courseId: string) => void;
  onClick: (courseId: string) => void;
}) {
  return (
    <div className="relative">
      <CourseCard
        course={enrollment.course}
        showProgress={true}
        progress={enrollment.progressPercentage}
        isEnrolled={true}
        onClick={() => onClick(enrollment.courseId)}
      />
      <div className="mt-3">
        <Button
          variant="primary"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onContinue(enrollment.courseId);
          }}
          title={
            enrollment.progressPercentage > 0 ? "Continue where you left off" : "Start this course"
          }
        >
          {enrollment.progressPercentage === 0 ? "Start Learning" : "Resume"}
        </Button>
      </div>
    </div>
  );
}

/**
 * Course Card Skeleton Component
 */
function CourseCardSkeleton() {
  return (
    <div className="bg-card/30 border border-border/50 rounded-xl overflow-hidden">
      <Skeleton variant="rectangular" height={180} className="w-full bg-muted/50" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" height={16} className="w-full bg-muted/50" />
        <Skeleton variant="text" height={16} className="w-3/4 bg-muted/50" />
        <Skeleton variant="text" height={12} className="w-1/2 bg-muted/50" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" height={12} width={80} className="bg-muted/50" />
        </div>
        <Skeleton variant="text" height={20} width={60} className="bg-muted/50" />
      </div>
    </div>
  );
}
