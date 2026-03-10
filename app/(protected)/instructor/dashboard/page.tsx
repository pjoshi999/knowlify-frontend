"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RoleProtectedRoute } from "@/app/components/auth/protected-route";
import { useInstructorStats } from "@/app/lib/hooks/use-instructor-stats";
import { useUpdateCourse } from "@/app/lib/hooks/use-instructor-courses";
import { Spinner } from "@/app/components/ui/loading";
import { ErrorMessage } from "@/app/components/ui/error-message";
import { CourseEditModal } from "@/app/components/features/course-edit-modal";
import { getCourse } from "@/app/lib/api/courses";
import { motion } from "framer-motion";
import type { CourseStats, Course } from "@/app/lib/api/service-types";

export default function InstructorDashboardPage() {
  const router = useRouter();
  // Fetch instructor stats with real-time updates (every 30 seconds)
  const {
    data: stats,
    isLoading,
    error,
    refetch,
  } = useInstructorStats({
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  const [sortBy, setSortBy] = useState<"enrollments" | "rating">("enrollments");
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  // Sort course stats based on selected criteria
  const sortedCourseStats = stats?.courseStats
    ? [...stats.courseStats].sort((a, b) => {
      switch (sortBy) {
        case "enrollments":
          return b.enrollments - a.enrollments;
        case "rating":
          return b.averageRating - a.averageRating;
        default:
          return 0;
      }
    })
    : [];

  const handleEditCourse = async (courseId: string) => {
    setIsLoadingCourse(true);
    try {
      // Fetch full course details
      const courseResponse = await getCourse(courseId);
      setEditingCourse(courseResponse.course);
    } catch (error) {
      console.error("Failed to fetch course details:", error);
      alert(
        "Failed to load course details: " +
        (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsLoadingCourse(false);
    }
  };

  const handleCloseEditModal = () => {
    setEditingCourse(null);
  };

  const handleEditSuccess = () => {
    refetch();
  };

  return (
    <RoleProtectedRoute requiredRole="instructor">
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-background border-b border-border">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[99999px] bg-card/50 border border-border/50 mb-6 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground"></span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {stats?.totalEnrollments || 0} total students
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-5 leading-[1.1] tracking-tight">
                <span className="text-foreground">Instructor</span>
                <br />
                <span className="bg-gradient-to-r from-foreground via-foreground-secondary to-muted-foreground bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed">
                Manage your courses and track your teaching performance
              </p>

              <button
                onClick={() => router.push("/upload")}
                className="px-6 py-3 bg-muted hover:bg-muted-foreground/20 text-foreground rounded-xl transition-colors border border-border inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Upload New Course
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20">
              <ErrorMessage
                title="Failed to load dashboard"
                error={error}
                onRetry={() => void refetch()}
              />
            </div>
          )}

          {/* Dashboard Content */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Statistics Cards */}
              <div className="grid gap-6 md:grid-cols-2 mb-12">
                {/* Total Courses */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-blue-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Courses</p>
                      <p className="text-xs text-muted-foreground">Courses you&apos;ve created</p>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-foreground">{stats.totalCourses}</div>
                </div>

                {/* Total Enrollments */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-emerald-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Enrollments</p>
                      <p className="text-xs text-muted-foreground">Students across all courses</p>
                    </div>
                  </div>
                  <div className="text-5xl font-bold text-foreground">{stats.totalEnrollments}</div>
                </div>
              </div>

              {/* Course List Section */}
              <div className="bg-card/30 border border-border/50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">Your Courses</h2>
                    <p className="text-sm text-muted-foreground">
                      Manage and track performance of your courses
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSortBy("enrollments")}
                      className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 border ${sortBy === "enrollments"
                        ? "bg-muted text-foreground border-border"
                        : "bg-card/50 text-muted-foreground hover:text-foreground border-border/50 hover:bg-muted"
                        }`}
                    >
                      Enrollments
                    </button>
                    <button
                      onClick={() => setSortBy("rating")}
                      className={`px-4 py-2 text-sm rounded-xl transition-all duration-200 border ${sortBy === "rating"
                        ? "bg-muted text-foreground border-border"
                        : "bg-card/50 text-muted-foreground hover:text-foreground border-border/50 hover:bg-muted"
                        }`}
                    >
                      Rating
                    </button>
                  </div>
                </div>

                {sortedCourseStats.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-card/50 flex items-center justify-center mx-auto mb-6 border border-border/50">
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
                    <h3 className="text-xl font-semibold text-foreground mb-2">No courses yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start sharing your knowledge with the world
                    </p>
                    <button
                      onClick={() => router.push("/upload")}
                      className="px-6 py-3 bg-muted hover:bg-muted-foreground/20 text-foreground rounded-xl transition-colors border border-border"
                    >
                      Create Your First Course
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground text-sm">
                            Course Name
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-foreground text-sm">
                            Enrollments
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-foreground text-sm">
                            Rating
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-foreground text-sm">
                            Reviews
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-foreground text-sm">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedCourseStats.map((course) => (
                          <CourseRow
                            key={course.courseId}
                            course={course}
                            onUpdate={() => refetch()}
                            onEdit={() => handleEditCourse(course.courseId)}
                            isLoadingEdit={isLoadingCourse}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Course Edit Modal */}
      <CourseEditModal
        course={editingCourse}
        open={!!editingCourse}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />
    </RoleProtectedRoute>
  );
}

/**
 * Course Row Component
 *
 * Displays a single course with its statistics and management actions
 */
interface CourseRowProps {
  course: CourseStats;
  onUpdate: () => void;
  onEdit: () => void;
  isLoadingEdit: boolean;
}

function CourseRow({ course, onUpdate, onEdit, isLoadingEdit }: CourseRowProps) {
  const updateCourseMutation = useUpdateCourse();
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  const handleEdit = () => {
    onEdit();
  };

  const handleUnpublish = async () => {
    if (!confirm(`Are you sure you want to unpublish "${course.courseName}"?`)) {
      return;
    }

    setIsUnpublishing(true);
    try {
      await updateCourseMutation.mutateAsync({
        courseId: course.courseId,
        data: { published: false },
      });
      onUpdate();
    } catch (error) {
      alert(
        "Failed to unpublish course: " + (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setIsUnpublishing(false);
    }
  };

  const handleView = () => {
    // Navigate to course detail page
    window.location.href = `/courses/${course.courseId}`;
  };

  return (
    <motion.tr
      className="border-b border-border hover:bg-muted/50 transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <td className="py-4 px-4">
        <button
          onClick={handleView}
          className="text-foreground hover:text-foreground/80 font-medium transition-colors text-left"
        >
          {course.courseName}
        </button>
      </td>
      <td className="py-4 px-4 text-right text-foreground">{course.enrollments}</td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          <span className="text-foreground">
            {course.averageRating > 0 ? course.averageRating.toFixed(1) : "N/A"}
          </span>
          {course.averageRating > 0 && <span className="text-yellow-500">★</span>}
        </div>
      </td>
      <td className="py-4 px-4 text-right text-muted-foreground">{course.reviewCount}</td>
      <td className="py-4 px-4 text-right">
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleEdit}
            disabled={isLoadingEdit}
            className="px-3 py-1.5 text-sm bg-card/50 hover:bg-muted text-foreground rounded-xl transition-colors border border-border/50 disabled:opacity-50"
          >
            {isLoadingEdit ? "Loading..." : "Edit"}
          </button>
          <button
            onClick={handleUnpublish}
            disabled={isUnpublishing || isLoadingEdit}
            className="px-3 py-1.5 text-sm bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl transition-colors border border-border/50 disabled:opacity-50"
          >
            {isUnpublishing ? "Unpublishing..." : "Unpublish"}
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
