"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/app/components/auth/protected-route";
import { useAuth } from "@/app/lib/auth/auth-provider";
import { useLibrary } from "@/app/lib/hooks/use-library";
import { supabase } from "@/app/lib/auth/supabase-client";
import { getBackendMe } from "@/app/lib/api/auth";
import { Button } from "@/app/components/ui/button";
import { CourseCard } from "@/app/components/features/course-card";
import { SkeletonCard } from "@/app/components/ui/loading";

type SupabaseProfile = {
  id: string;
  email?: string;
  created_at?: string;
  last_sign_in_at?: string;
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  user_metadata?: {
    name?: string;
    full_name?: string;
    role?: "student" | "instructor";
    avatar_url?: string;
    picture?: string;
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: libraryData, isLoading: isLoadingLibrary } = useLibrary();
  const [profile, setProfile] = useState<SupabaseProfile | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user: supabaseUser },
      } = await supabase.auth.getUser();
      if (supabaseUser) {
        setProfile(supabaseUser as unknown as SupabaseProfile);
      }

      try {
        await getBackendMe();
        setSyncError(null);
      } catch (error) {
        setSyncError(error instanceof Error ? error.message : "Backend sync failed");
      }
    };

    void loadProfile();
  }, []);

  const displayName =
    profile?.user_metadata?.full_name ||
    profile?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const avatarUrl = profile?.user_metadata?.avatar_url || profile?.user_metadata?.picture;

  const selectedRole =
    (profile?.user_metadata?.role as "student" | "instructor" | undefined) ||
    (user?.role as "student" | "instructor" | undefined) ||
    "student";

  const roleLabel = selectedRole === "instructor" ? "Instructor" : "Learner";

  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    : "Recently";

  const enrollments = libraryData?.enrollments || [];
  const completedCourses = enrollments.filter((e) => e.progressPercentage === 100).length;
  const totalLearningTime = 0; // TODO: Add timeSpent tracking
  const learningHours = Math.floor(totalLearningTime / 3600);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background relative">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-background/80 to-transparent border-b border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 max-w-4xl">
              {/* Avatar */}
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={120}
                  height={120}
                  className="w-28 h-28 sm:w-32 sm:h-32 profile-image border-4 border-border/50"
                />
              ) : (
                <div className="flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32 profile-image bg-primary text-primary-foreground font-bold text-4xl border-4 border-border/50">
                  {displayName[0]?.toUpperCase() || "U"}
                </div>
              )}

              {/* User Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">{displayName}</h1>
                <p className="text-lg text-muted-foreground mb-4">{profile?.email || user?.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-card backdrop-blur-sm rounded-xl text-sm text-foreground border border-border">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {roleLabel}
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-card backdrop-blur-sm rounded-xl text-sm text-foreground border border-border">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Joined {joinedDate}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl relative z-10">
          {syncError && (
            <div className="mb-8 rounded-xl bg-red-950/30 border border-red-900 p-4 text-sm text-red-300 backdrop-blur-sm">
              {syncError}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
            <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-muted-foreground"
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
                <h3 className="text-sm font-medium text-muted-foreground">Courses</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">{enrollments.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedRole === "instructor" ? "Created" : "Enrolled"}
              </p>
            </div>

            <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">{completedCourses}</p>
              <p className="text-xs text-muted-foreground mt-1">Courses finished</p>
            </div>

            <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <svg
                  className="w-5 h-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-sm font-medium text-muted-foreground">Learning Time</h3>
              </div>
              <p className="text-2xl font-bold text-foreground">{learningHours}h</p>
              <p className="text-xs text-muted-foreground mt-1">Total hours</p>
            </div>
          </div>

          {/* Purchased Courses Section */}
          <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-foreground">My Purchased Courses</h2>
              {enrollments.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                  View All
                </Button>
              )}
            </div>

            {isLoadingLibrary && (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!isLoadingLibrary && enrollments.length === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-zinc-700 mx-auto mb-4"
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
                <p className="text-muted-foreground mb-4">No purchased courses yet</p>
                <Button variant="primary" onClick={() => router.push("/courses")}>
                  Browse Courses
                </Button>
              </div>
            )}

            {!isLoadingLibrary && enrollments.length > 0 && (
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {enrollments.slice(0, 6).map((enrollment) => (
                  <div key={enrollment.id} className="relative">
                    <CourseCard
                      course={enrollment.course}
                      showProgress={true}
                      progress={enrollment.progressPercentage}
                      isEnrolled={true}
                      onClick={() => router.push(`/learn/${enrollment.courseId}`)}
                    />
                    <div className="mt-3">
                      <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => router.push(`/learn/${enrollment.courseId}`)}
                      >
                        {enrollment.progressPercentage === 0 ? "Start Learning" : "Resume"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Section */}
          <div className="bg-card backdrop-blur-sm border border-border rounded-xl p-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
            {enrollments.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 text-zinc-700 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRole === "instructor"
                    ? "Start creating courses to see your activity here"
                    : "Start learning to see your activity here"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {enrollments.slice(0, 5).map((enrollment) => (
                  <div
                    key={enrollment.id}
                    className="flex items-center gap-4 p-4 bg-muted rounded-xl hover:bg-muted/80 transition-colors cursor-pointer"
                    onClick={() => router.push(`/learn/${enrollment.courseId}`)}
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-muted rounded flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {enrollment.course?.name || "Course"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {enrollment.progressPercentage}% complete
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all"
                          style={{ width: `${enrollment.progressPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
