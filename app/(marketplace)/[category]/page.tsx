"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CourseCard } from "@/app/components/features/course-card";
import { FilterModal } from "@/app/components/features/filter-modal";
import { FilterChips } from "@/app/components/features/filter-chips";
import { SortDropdown, type SortOption } from "@/app/components/features/sort-dropdown";
import { Skeleton } from "@/app/components/ui/loading";
import { useCoursesInfinite } from "@/app/lib/hooks/use-courses-infinite";
import type { SearchFilters } from "@/app/lib/api/service-types";

/**
 * Dynamic Category Page
 *
 * Displays courses filtered by category with a focused layout
 */
export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Get category from URL params and capitalize it
  const categorySlug = params.category as string;
  const category = categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1);

  // Initialize filters with category
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    category: category,
  });
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch courses with category filter
  const {
    data: browseData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useCoursesInfinite({
    limit: 20,
    sortBy: sortBy,
    filters: searchFilters,
  });

  // Infinite scroll implementation
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const option = {
      root: null,
      rootMargin: "100px",
      threshold: 0,
    };

    const observer = new IntersectionObserver(handleObserver, option);
    observer.observe(element);

    return () => observer.unobserve(element);
  }, [handleObserver]);

  // Handle filter change
  const handleFilterChange = (filters: SearchFilters) => {
    // Always keep the category filter
    setSearchFilters({ ...filters, category: category });
  };

  // Handle remove filter chip
  const handleRemoveFilter = (filterKey: keyof SearchFilters) => {
    if (filterKey === "category") return; // Don't allow removing category filter
    const newFilters = { ...searchFilters };
    delete newFilters[filterKey];
    setSearchFilters(newFilters);
  };

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  // Handle course card click
  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  // Get courses
  const courses =
    browseData?.pages?.flatMap((page) => page.courses ?? []).filter((course) => course?.id) ?? [];

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Category Hero */}
        <div className="relative overflow-hidden bg-gradient-to-b from-card/50 to-background border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="">
              <button
                onClick={() => router.push("/courses")}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 mb-4"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to all courses
              </button>

              <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
                {category} Courses
              </h1>
              <p className="text-lg text-muted-foreground">
                Explore our collection of {category.toLowerCase()} courses designed to help you
                master new skills
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilterModal(true)}
                className="px-4 py-2 bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground text-sm rounded-xl transition-colors border border-border/50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
              </button>
              <p className="text-sm text-muted-foreground">
                {courses.length} {courses.length === 1 ? "course" : "courses"}
              </p>
            </div>
            <SortDropdown value={sortBy} onChange={handleSortChange} />
          </div>

          {/* Filter Chips */}
          <FilterChips filters={searchFilters} onRemoveFilter={handleRemoveFilter} />

          {/* Filter Modal */}
          <FilterModal
            filters={searchFilters}
            onFilterChange={handleFilterChange}
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
          />

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => (
                <CourseCardSkeleton key={index} />
              ))}
            </div>
          )}

          {/* Course Grid */}
          {!isLoading && courses.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => handleCourseClick(course.id)}
                  onPurchase={() => handleCourseClick(course.id)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && courses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
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
                No {category.toLowerCase()} courses found
              </h2>
              <p className="text-muted-foreground mb-6">
                Check back soon for new courses in this category
              </p>
              <button
                onClick={() => router.push("/courses")}
                className="px-6 py-3 bg-muted hover:bg-muted-foreground/20 text-foreground rounded-xl transition-colors border border-border"
              >
                Browse All Courses
              </button>
            </div>
          )}

          {/* Infinite Scroll Trigger */}
          {hasNextPage && (
            <div ref={observerTarget} className="h-10 mt-12">
              {isFetchingNextPage && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <CourseCardSkeleton key={`loading-${index}`} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
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
