"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/app/components/auth/protected-route";
import { useCourseContent } from "@/app/lib/hooks/use-course-access";
import { EnhancedVideoPlayer } from "@/app/components/features/EnhancedVideoPlayer";
import { MiniPlayer } from "@/app/components/features/MiniPlayer";
import { LessonCompletionToast } from "@/app/components/features/LessonCompletionToast";
import { ModuleCompletionBadge } from "@/app/components/features/ModuleCompletionBadge";
import { Spinner } from "@/app/components/ui/loading";
import { ErrorMessage } from "@/app/components/ui/error-message";
import { Button } from "@/app/components/ui/button";
import { getLastAccessedSection, storeLastAccessedSection } from "@/app/lib/utils/progress";

interface LessonWithVideo {
  id: string;
  title?: string;
  videoUrl?: string;
}

interface VideoAsset {
  storagePath: string;
  fileName?: string;
}

function findVideoForLesson(
  lesson: LessonWithVideo,
  videos: VideoAsset[],
  allLessons: LessonWithVideo[]
): { storagePath: string } | null {
  // Strategy 1: Return direct videoUrl if present (preserve existing behavior)
  if (lesson?.videoUrl) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Video Matching] Strategy 1 (Direct URL): Using lesson.videoUrl");
    }
    return { storagePath: lesson.videoUrl };
  }

  // If no videos available, return null
  if (!videos || videos.length === 0) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Video Matching] No videos available");
    }
    return null;
  }

  // Strategy 2: Try exact fileName match
  const exactMatch = videos.find((v) => v.fileName === lesson?.title);
  if (exactMatch) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Video Matching] Strategy 2 (Exact Match): Found exact fileName match");
    }
    return exactMatch;
  }

  // Strategy 3: Try substring match (both directions)
  const substringMatch = videos.find(
    (v) => lesson?.title?.includes(v.fileName ?? "") || v.fileName?.includes(lesson?.title ?? "")
  );
  if (substringMatch) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Video Matching] Strategy 3 (Substring Match): Found substring match");
    }
    return substringMatch;
  }

  // Strategy 4: Match by lesson index/order in course structure
  if (allLessons && allLessons.length > 0) {
    const lessonIndex = allLessons.findIndex((l) => l.id === lesson?.id);
    if (lessonIndex >= 0 && lessonIndex < videos.length) {
      const video = videos[lessonIndex];
      if (video) {
        if (process.env.NODE_ENV === "development") {
          console.log(
            `[Video Matching] Strategy 4 (Index Match): Matched by lesson index ${lessonIndex}`
          );
        }
        return video;
      }
    }
  }

  // Strategy 5: Try case-insensitive matching
  const caseInsensitiveMatch = videos.find(
    (v) =>
      v.fileName?.toLowerCase() === lesson?.title?.toLowerCase() ||
      lesson?.title?.toLowerCase()?.includes(v.fileName?.toLowerCase() ?? "") ||
      v.fileName?.toLowerCase()?.includes(lesson?.title?.toLowerCase() ?? "")
  );
  if (caseInsensitiveMatch) {
    if (process.env.NODE_ENV === "development") {
      console.log("[Video Matching] Strategy 5 (Case-Insensitive): Found case-insensitive match");
    }
    return caseInsensitiveMatch;
  }

  // Strategy 6: Fallback to first available video if only one video exists
  if (videos.length === 1) {
    const video = videos[0];
    if (video) {
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[Video Matching] Strategy 6 (Single Video Fallback): Using only available video"
        );
      }
      return video;
    }
  }

  // No match found
  if (process.env.NODE_ENV === "development") {
    console.log("[Video Matching] No match found for lesson:", lesson?.title);
    console.log(
      "[Video Matching] Available videos:",
      videos.map((v) => v.fileName)
    );
  }
  return null;
}

export default function CoursePlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [currentSectionId, setCurrentSectionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab] = useState<"overview" | "qa" | "notes">("overview");
  const [searchQuery] = useState("");
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [recentlyCompletedLessons, setRecentlyCompletedLessons] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"normal" | "theater" | "fullscreen">(() => {
    if (typeof window === "undefined") return "normal";
    const savedViewMode = localStorage.getItem("viewMode_preference");
    return savedViewMode === "theater" || savedViewMode === "normal" ? savedViewMode : "normal";
  });
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [miniPlayerPosition, setMiniPlayerPosition] = useState(() => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const savedPosition = localStorage.getItem("miniPlayerPosition");
    if (savedPosition) {
      try {
        return JSON.parse(savedPosition);
      } catch {
        const defaultX = window.innerWidth - 320 - 16;
        const defaultY = window.innerHeight - 180 - 16;
        return { x: defaultX, y: defaultY };
      }
    }
    const defaultX = window.innerWidth - 320 - 16;
    const defaultY = window.innerHeight - 180 - 16;
    return { x: defaultX, y: defaultY };
  });
  const [miniPlayerVideoElement, setMiniPlayerVideoElement] = useState<HTMLVideoElement | null>(
    null
  );
  const [celebrationState, setCelebrationState] = useState<{
    type: "lesson" | "module" | null;
    title: string;
    id: string;
  } | null>(null);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoPlayerRef = useRef<{ videoElement: HTMLVideoElement | null }>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const {
    hasAccess,
    enrollmentId,
    isInstructor,
    progress,
    manifest,
    videos,
    isLoading,
    error,
    refetchAll,
  } = useCourseContent(courseId, {
    onAccessDenied: () => {
      router.push(`/courses/${courseId}`);
    },
  });

  // Add animation styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes checkmark-animation {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        50% {
          transform: scale(1.2);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .animate-checkmark {
        animation: checkmark-animation 0.5s ease-out;
      }
      @keyframes slide-down {
        0% {
          transform: translate(-50%, -100%);
          opacity: 0;
        }
        100% {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
      .animate-slide-down {
        animation: slide-down 0.3s ease-out;
      }
      @keyframes scale-in {
        0% {
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0;
        }
        100% {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
      }
      .animate-scale-in {
        animation: scale-in 0.3s ease-out;
      }
      @keyframes bounce-slow {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
      .animate-bounce-slow {
        animation: bounce-slow 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Persist viewing mode preference
  useEffect(() => {
    if (viewMode !== "fullscreen") {
      localStorage.setItem("viewMode_preference", viewMode);
    }
  }, [viewMode]);

  // Persist mini player position
  useEffect(() => {
    localStorage.setItem("miniPlayerPosition", JSON.stringify(miniPlayerPosition));
  }, [miniPlayerPosition]);

  // Sync video element ref to state for rendering
  useEffect(() => {
    const videoElement = videoPlayerRef.current?.videoElement;
    if (videoElement) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMiniPlayerVideoElement(videoElement);
    }
  }, []);

  // Intersection Observer for mini player
  useEffect(() => {
    if (!videoContainerRef.current) return;

    // Disable mini player on mobile
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsMiniPlayerVisible(false);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isMobileNow = window.innerWidth < 768;

          if (isMobileNow) {
            // On mobile, pause video when scrolling past player
            if (!entry.isIntersecting && videoPlayerRef.current?.videoElement) {
              videoPlayerRef.current.videoElement.pause();
            }
          } else {
            // On desktop, show mini player when video scrolls out of view
            setIsMiniPlayerVisible(!entry.isIntersecting);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when less than 10% of video is visible
      }
    );

    observer.observe(videoContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle window resize to adjust mini player position
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsMiniPlayerVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle orientation change for landscape fullscreen on mobile
  useEffect(() => {
    const handleOrientationChange = () => {
      const isMobile = window.innerWidth < 768;

      if (isMobile && window.screen?.orientation) {
        const orientation = window.screen.orientation.type;

        if (orientation.includes("landscape") && videoContainerRef.current) {
          // Enter fullscreen in landscape mode on mobile
          const videoElement = videoPlayerRef.current?.videoElement;
          if (videoElement && document.fullscreenEnabled) {
            videoElement.requestFullscreen?.().catch((err) => {
              console.log("Fullscreen request failed:", err);
            });
          }
        }
      }
    };

    // Listen for orientation changes
    if (window.screen?.orientation) {
      window.screen.orientation.addEventListener("change", handleOrientationChange);

      // Check initial orientation
      handleOrientationChange();

      return () => {
        window.screen.orientation.removeEventListener("change", handleOrientationChange);
      };
    }
  }, []);

  // Handle mobile swipe gestures on video player
  useEffect(() => {
    const videoContainer = videoContainerRef.current;
    if (!videoContainer) return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Check if it's a horizontal swipe (more horizontal than vertical)
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

      // Require minimum 50px swipe distance
      const minSwipeDistance = 50;

      // Require swipe to be reasonably fast (within 500ms)
      const maxSwipeTime = 500;

      if (isHorizontalSwipe && Math.abs(deltaX) >= minSwipeDistance && deltaTime <= maxSwipeTime) {
        const videoElement = videoPlayerRef.current?.videoElement;
        if (videoElement) {
          if (deltaX > 0) {
            // Swipe right: rewind 10 seconds
            videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
          } else {
            // Swipe left: skip forward 10 seconds
            videoElement.currentTime = Math.min(
              videoElement.duration,
              videoElement.currentTime + 10
            );
          }
        }
      }

      touchStartRef.current = null;
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
    };

    videoContainer.addEventListener("touchstart", handleTouchStart, { passive: true });
    videoContainer.addEventListener("touchend", handleTouchEnd);
    videoContainer.addEventListener("touchcancel", handleTouchCancel);

    return () => {
      videoContainer.removeEventListener("touchstart", handleTouchStart);
      videoContainer.removeEventListener("touchend", handleTouchEnd);
      videoContainer.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, []);

  // Handle viewing mode changes
  const handleViewModeChange = (mode: "normal" | "theater" | "fullscreen") => {
    setViewMode(mode);
  };

  // Handle mini player close
  const handleMiniPlayerClose = () => {
    setIsMiniPlayerVisible(false);
  };

  // Handle mini player expand (scroll back to main video)
  const handleMiniPlayerExpand = () => {
    videoContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setIsMiniPlayerVisible(false);
  };

  // Handle mini player position change
  const handleMiniPlayerPositionChange = (position: { x: number; y: number }) => {
    setMiniPlayerPosition(position);
  };

  useEffect(() => {
    if (manifest?.modules && manifest.modules.length > 0 && !currentSectionId) {
      const firstModule = manifest.modules[0];
      const firstLesson = firstModule?.lessons?.[0];

      // Initialize all modules as expanded
      if (expandedModules.size === 0) {
        setExpandedModules(new Set(manifest.modules.map((m: any) => m.id)));
      }

      if (firstLesson) {
        if (enrollmentId) {
          getLastAccessedSection(enrollmentId)
            .then((lastSectionId) => {
              setCurrentSectionId(lastSectionId || firstLesson.id);
            })
            .catch(() => {
              setCurrentSectionId(firstLesson.id);
            });
        } else {
          setCurrentSectionId(firstLesson.id);
        }
      }
    }
  }, [manifest, currentSectionId, enrollmentId, expandedModules.size]);

  useEffect(() => {
    if (currentSectionId && enrollmentId) {
      storeLastAccessedSection(enrollmentId, currentSectionId);
    }
  }, [currentSectionId, enrollmentId]);

  // Track newly completed lessons for animation and celebrations
  useEffect(() => {
    if (progress?.completedLessons && manifest?.modules && enrollmentId) {
      const newCompletions = progress.completedLessons.filter(
        (lessonId: string) => !recentlyCompletedLessons.has(lessonId)
      );

      if (newCompletions.length > 0) {
        const newSet = new Set(recentlyCompletedLessons);
        newCompletions.forEach((id: string) => newSet.add(id));
        setRecentlyCompletedLessons(newSet);

        // Get celebration state from localStorage
        const celebrationKey = `celebrations_${enrollmentId}`;
        const storedCelebrations = localStorage.getItem(celebrationKey);
        const celebratedLessons = storedCelebrations
          ? JSON.parse(storedCelebrations)
          : { lessons: [], modules: [] };

        // Trigger lesson completion celebration for the most recent completion
        const latestCompletion = newCompletions[newCompletions.length - 1];
        if (latestCompletion && !celebratedLessons.lessons.includes(latestCompletion)) {
          const lesson = manifest.modules
            .flatMap((m: any) => m.lessons || [])
            .find((l: any) => l.id === latestCompletion);

          if (lesson) {
            setCelebrationState({
              type: "lesson",
              title: lesson.title,
              id: latestCompletion,
            });

            // Mark as celebrated
            celebratedLessons.lessons.push(latestCompletion);
            localStorage.setItem(celebrationKey, JSON.stringify(celebratedLessons));
          }
        }

        // Check for module completion
        manifest.modules.forEach((module: any) => {
          const moduleLessons = module.lessons || [];
          const completedInModule = moduleLessons.filter((l: any) =>
            progress.completedLessons.includes(l.id)
          );

          if (
            moduleLessons.length > 0 &&
            completedInModule.length === moduleLessons.length &&
            !celebratedLessons.modules.includes(module.id)
          ) {
            // Module is complete and hasn't been celebrated yet
            setTimeout(() => {
              setCelebrationState({
                type: "module",
                title: module.title,
                id: module.id,
              });

              // Mark as celebrated
              celebratedLessons.modules.push(module.id);
              localStorage.setItem(celebrationKey, JSON.stringify(celebratedLessons));
            }, 3500); // Show after lesson celebration
          }
        });

        // Remove animation class after animation completes
        setTimeout(() => {
          setRecentlyCompletedLessons(new Set());
        }, 1000);
      }
    }
  }, [progress?.completedLessons, manifest?.modules, enrollmentId]);

  const progressPercentage = manifest?.modules
    ? Math.round(
        ((progress?.completedLessons?.length || 0) /
          manifest.modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0)) *
          100
      )
    : 0;

  // Filter lessons based on search query
  const filteredModules = manifest?.modules
    ?.map((module: any) => {
      const filteredLessons = module.lessons?.filter((lesson: any) =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...module, lessons: filteredLessons };
    })
    .filter((module: any) => module.lessons && module.lessons.length > 0);

  // Auto-expand modules with search matches
  useEffect(() => {
    if (searchQuery && filteredModules) {
      const matchingModuleIds = new Set<string>(filteredModules.map((m: any) => m.id as string));
      setExpandedModules(matchingModuleIds);
    }
  }, [searchQuery, filteredModules]);

  if (!isLoading && !hasAccess) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface flex items-center justify-center">
              <svg
                className="w-10 h-10 text-foreground-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-foreground-secondary mb-6">
              You need to enroll in this course to access its content.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/courses")}>
                Browse Courses
              </Button>
              <Button variant="primary" onClick={() => router.push(`/courses/${courseId}`)}>
                View Course
              </Button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      {isLoading && (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Spinner size="xl" className="mb-4" />
            <p className="text-foreground-secondary">Loading course...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorMessage error={error} title="Failed to load course" />
            <div className="mt-6 text-center">
              <Button variant="primary" onClick={() => refetchAll()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !error && hasAccess && manifest && (
        <div className="min-h-screen bg-background">
          {/* Modern Header */}
          <div className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-10 shadow-sm">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => router.push("/dashboard")}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200 flex-shrink-0 p-2 hover:bg-muted rounded-lg"
                  aria-label="Back to dashboard"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                </button>
                <div className="flex-1 min-w-0">
                  <h1 className="text-sm font-semibold text-foreground truncate">
                    {manifest.modules?.[0]?.lessons?.find((l: any) => l.id === currentSectionId)
                      ?.title || "Course"}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="bg-muted rounded-full h-1.5 w-32 sm:w-48 overflow-hidden">
                      <div
                        className="bg-foreground h-1.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors duration-200 text-muted-foreground hover:text-foreground"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row max-w-[1920px] mx-auto">
            <div
              className={`flex-1 transition-all duration-300 ${
                isSidebarOpen ? (viewMode === "theater" ? "lg:mr-80" : "lg:mr-96") : ""
              }`}
            >
              <div className="bg-black w-full aspect-video" ref={videoContainerRef}>
                {currentSectionId &&
                  (() => {
                    const currentLesson = manifest.modules
                      ?.flatMap((m: any) => m.lessons || [])
                      .find((l: any) => l.id === currentSectionId);

                    // Find next lesson
                    const allLessons = manifest.modules?.flatMap((m: any) => m.lessons || []) || [];
                    const currentIndex = allLessons.findIndex(
                      (l: any) => l.id === currentSectionId
                    );
                    const nextLesson =
                      currentIndex >= 0 && currentIndex < allLessons.length - 1
                        ? allLessons[currentIndex + 1]
                        : undefined;

                    // Use enhanced video matching function
                    const videoAsset = findVideoForLesson(currentLesson, videos, allLessons);

                    // Debug logging
                    if (process.env.NODE_ENV === "development") {
                      console.log("[Learn Page] Current Lesson:", currentLesson);
                      console.log("[Learn Page] All Videos:", videos);
                      console.log("[Learn Page] Videos Length:", videos?.length);
                      console.log("[Learn Page] All Lessons:", allLessons);
                      console.log("[Learn Page] Video Asset:", videoAsset);
                      console.log("[Learn Page] Video URL:", videoAsset?.storagePath);
                      console.log("[Learn Page] Enrollment ID:", enrollmentId);
                      console.log("[Learn Page] Is Instructor:", isInstructor);
                      console.log(
                        "[Learn Page] Should Render Video:",
                        !!(videoAsset && (enrollmentId || isInstructor))
                      );
                    }

                    return videoAsset && (enrollmentId || isInstructor) ? (
                      <div className="w-full aspect-video" key={currentSectionId}>
                        <EnhancedVideoPlayer
                          ref={videoPlayerRef}
                          src={videoAsset.storagePath}
                          enrollmentId={enrollmentId || "instructor-preview"}
                          lessonId={currentSectionId}
                          courseId={courseId}
                          lastPosition={
                            progress?.watchedVideos?.[currentSectionId]?.lastPosition || 0
                          }
                          duration={progress?.watchedVideos?.[currentSectionId]?.duration}
                          viewMode={viewMode}
                          onViewModeChange={handleViewModeChange}
                          nextLesson={
                            nextLesson ? { id: nextLesson.id, title: nextLesson.title } : undefined
                          }
                          className="w-full h-full"
                        />
                      </div>
                    ) : (
                      <div className="w-full aspect-video flex items-center justify-center bg-muted">
                        <div className="text-center px-6">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
                            <svg
                              className="w-8 h-8 text-muted-foreground"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-foreground mb-2">
                            Video Not Available
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {currentLesson
                              ? "This lesson does not have a video yet."
                              : "Please select a lesson to watch."}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
              </div>

              {/* Lesson Content Area */}
              <div className="p-6 sm:p-8 bg-background">
                <div className="max-w-4xl mx-auto">
                  {activeTab === "overview" && (
                    <>
                      <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                        {manifest.modules
                          ?.flatMap((m: any) => m.lessons || [])
                          .find((l: any) => l.id === currentSectionId)?.title || "Lesson"}
                      </h2>
                      <p className="text-muted-foreground leading-relaxed">
                        {manifest.modules
                          ?.flatMap((m: any) => m.lessons || [])
                          .find((l: any) => l.id === currentSectionId)?.description ||
                          "No description available."}
                      </p>
                    </>
                  )}
                  {activeTab === "qa" && (
                    <>
                      <h3 className="text-xl font-bold text-foreground mb-4">
                        Questions & Answers
                      </h3>
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                        </div>
                        <p className="text-muted-foreground">
                          No questions yet. Be the first to ask!
                        </p>
                      </div>
                    </>
                  )}
                  {activeTab === "notes" && (
                    <>
                      <h3 className="text-xl font-bold text-foreground mb-4">Your Notes</h3>
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-card flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-muted-foreground"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </div>
                        <p className="text-muted-foreground">
                          No notes yet. Start taking notes while watching!
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Modern Sidebar */}
            <div
              className={`fixed lg:fixed right-0 top-0 bottom-0 bg-card/95 backdrop-blur-md border-l border-border overflow-y-auto transition-all duration-300 z-20 shadow-xl ${
                isSidebarOpen ? "translate-x-0" : "translate-x-full"
              } ${viewMode === "theater" ? "w-full sm:w-80 lg:w-80" : "w-full sm:w-96 lg:w-96"}`}
            >
              {/* Mobile sticky header */}
              <div className="lg:hidden sticky top-0 z-10 bg-card/95 backdrop-blur-md border-b border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground text-lg">Course Content</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors duration-200 text-muted-foreground hover:text-foreground"
                    aria-label="Close sidebar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-4 pt-20 pb-40 lg:pb-48">
                <div className="hidden lg:block">
                  <div className="flex items-center justify-between mb-6 pt-6">
                    <h3 className="font-bold text-foreground text-lg">Course Content</h3>
                  </div>
                </div>

                {/* Expand/Collapse All Controls */}
                {!searchQuery && (
                  <div className="mb-6 grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        if (manifest?.modules) {
                          setExpandedModules(new Set(manifest.modules.map((m: any) => m.id)));
                        }
                      }}
                      className="px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground hover:bg-muted/80 transition-all duration-200 text-sm font-medium"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={() => setExpandedModules(new Set())}
                      className="px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground hover:bg-muted/80 transition-all duration-200 text-sm font-medium"
                    >
                      Collapse All
                    </button>
                  </div>
                )}

                {/* No Results Message */}
                {searchQuery && (!filteredModules || filteredModules.length === 0) && (
                  <div className="text-center py-8">
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-muted-foreground text-sm">No results found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      Try a different search term
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  {(searchQuery ? filteredModules : manifest.modules)?.map(
                    (module: any, moduleIndex: number) => {
                      const isExpanded = expandedModules.has(module.id);
                      const completedCount =
                        module.lessons?.filter((lesson: any) =>
                          progress?.completedLessons?.includes(lesson.id)
                        ).length || 0;
                      const totalCount = module.lessons?.length || 0;
                      const progressPercent =
                        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                      return (
                        <div
                          key={module.id || moduleIndex}
                          className="border border-border rounded-xl overflow-hidden bg-card/50 hover:border-border/80 hover:bg-card transition-all duration-200"
                        >
                          <button
                            onClick={() => {
                              const newExpanded = new Set(expandedModules);
                              if (isExpanded) {
                                newExpanded.delete(module.id);
                              } else {
                                newExpanded.add(module.id);
                              }
                              setExpandedModules(newExpanded);
                            }}
                            className="w-full bg-muted/50 hover:bg-muted transition-all duration-200 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex-1 text-left min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-foreground text-sm truncate">
                                    {module.title}
                                  </h4>
                                  {completedCount === totalCount && totalCount > 0 && (
                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                      <svg
                                        className="w-3 h-3 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <p className="text-muted-foreground text-xs">
                                    {totalCount} {totalCount === 1 ? "lesson" : "lessons"}
                                  </p>
                                  {!isExpanded && (
                                    <>
                                      <span className="text-muted-foreground/50">•</span>
                                      <span className="text-xs font-medium text-foreground">
                                        {progressPercent}% complete
                                      </span>
                                    </>
                                  )}
                                </div>
                                {!isExpanded && totalCount > 0 && (
                                  <div className="mt-2 bg-muted rounded-full h-1 overflow-hidden">
                                    <div
                                      className="h-full bg-foreground transition-all duration-300"
                                      style={{ width: `${progressPercent}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                              <svg
                                className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          </button>
                          {isExpanded && (
                            <div className="divide-y divide-border">
                              {module.lessons?.map((lesson: any, lessonIndex: number) => {
                                const isActive = lesson.id === currentSectionId;
                                const isCompleted = progress?.completedLessons?.includes(lesson.id);
                                const isRecentlyCompleted = recentlyCompletedLessons.has(lesson.id);

                                return (
                                  <button
                                    key={lesson.id || lessonIndex}
                                    onClick={() => setCurrentSectionId(lesson.id)}
                                    className={`w-full text-left transition-all ${
                                      isActive
                                        ? "bg-foreground/10 border-l-4 border-foreground"
                                        : "hover:bg-muted/50 border-l-4 border-transparent"
                                    } p-3`}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <div
                                        className={`flex-shrink-0 rounded-full flex items-center justify-center font-semibold mt-0.5 w-6 h-6 text-xs ${
                                          isCompleted
                                            ? "bg-green-500 text-white"
                                            : isActive
                                              ? "bg-foreground text-background"
                                              : "bg-muted text-muted-foreground"
                                        }`}
                                      >
                                        {isCompleted ? (
                                          <svg
                                            className={`w-3.5 h-3.5 ${isRecentlyCompleted ? "animate-checkmark" : ""}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        ) : (
                                          lessonIndex + 1
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p
                                          className={`font-medium text-sm truncate ${isActive ? "text-foreground" : "text-foreground"}`}
                                        >
                                          {lesson.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          {lesson.duration && (
                                            <span className="text-muted-foreground text-xs">
                                              {lesson.duration} min
                                            </span>
                                          )}
                                          {lesson.type === "VIDEO" && (
                                            <>
                                              <span className="text-muted-foreground/50">•</span>
                                              <span className="text-muted-foreground text-xs">
                                                Video
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {isActive && (
                                        <div className="flex-shrink-0 mt-1">
                                          <div className="w-2 h-2 rounded-full bg-foreground animate-pulse"></div>
                                        </div>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="fixed bottom-8 right-8 lg:hidden bg-foreground text-background p-4 rounded-full shadow-2xl hover:bg-foreground/90 transition-all duration-200 hover:scale-110 z-30"
              aria-label="Open course content"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}

          {/* Mini Player */}
          {isMiniPlayerVisible && miniPlayerVideoElement && currentSectionId && (
            <MiniPlayer
              videoRef={{ current: miniPlayerVideoElement }}
              lessonTitle={
                manifest.modules
                  ?.flatMap((m: any) => m.lessons || [])
                  .find((l: any) => l.id === currentSectionId)?.title || "Current Lesson"
              }
              onClose={handleMiniPlayerClose}
              onExpand={handleMiniPlayerExpand}
              position={miniPlayerPosition}
              onPositionChange={handleMiniPlayerPositionChange}
            />
          )}

          {/* Celebration Components */}
          {celebrationState?.type === "lesson" && (
            <LessonCompletionToast
              lessonTitle={celebrationState.title}
              onClose={() => setCelebrationState(null)}
            />
          )}
          {celebrationState?.type === "module" && (
            <ModuleCompletionBadge
              moduleTitle={celebrationState.title}
              moduleId={celebrationState.id}
              onClose={() => setCelebrationState(null)}
            />
          )}
        </div>
      )}
    </ProtectedRoute>
  );
}
