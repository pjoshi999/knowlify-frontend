"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CourseCard } from "@/app/components/features/course-card";
import { SearchResults } from "@/app/components/features/search-results";
import { FilterModal } from "@/app/components/features/filter-modal";
import { FilterChips } from "@/app/components/features/filter-chips";
import { SortDropdown, type SortOption } from "@/app/components/features/sort-dropdown";
import { Skeleton } from "@/app/components/ui/loading";
import { useCoursesInfinite } from "@/app/lib/hooks/use-courses-infinite";
import { useSearch } from "@/app/lib/hooks/use-search";
import { useAuthStore } from "@/app/lib/stores/auth";
import type { SearchFilters, Course } from "@/app/lib/api/service-types";

export default function MarketplacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const observerTarget = useRef<HTMLDivElement>(null);

  // Parse URL query params
  const urlQuery = searchParams.get("q") || "";
  const urlSort = (searchParams.get("sort") as SortOption) || "date";
  const urlPriceMin = searchParams.get("priceMin");
  const urlPriceMax = searchParams.get("priceMax");
  const urlRating = searchParams.get("rating");
  const urlCategory = searchParams.get("category");

  // Initialize filters from URL
  const getInitialFilters = (): SearchFilters => {
    const filters: SearchFilters = {};

    if (urlPriceMin || urlPriceMax) {
      filters.priceRange = [
        urlPriceMin ? parseFloat(urlPriceMin) : 0,
        urlPriceMax ? parseFloat(urlPriceMax) : Infinity,
      ];
    }

    if (urlRating) {
      filters.rating = parseInt(urlRating);
    }

    if (urlCategory) {
      filters.category = urlCategory;
    }

    return filters;
  };

  // Search and filter state
  const [searchQuery] = useState(urlQuery);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(getInitialFilters());
  const [sortBy, setSortBy] = useState<SortOption>(urlSort);
  const [isSearchMode, setIsSearchMode] = useState(urlQuery.length > 0);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Fetch courses with infinite scroll pagination (browse mode)
  const {
    data: browseData,
    isLoading: isBrowseLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error: browseError,
  } = useCoursesInfinite({
    limit: 20,
    sortBy: sortBy,
    filters: searchFilters,
    enabled: !isSearchMode, // Only fetch when not in search mode
  });

  // Debug: Log query state
  useEffect(() => {
    console.log("Browse Query State:", {
      isSearchMode,
      isBrowseLoading,
      hasData: !!browseData,
      browseError,
      pages: browseData?.pages?.length,
    });
  }, [isSearchMode, isBrowseLoading, browseData, browseError]);

  // Search courses (search mode)
  const { data: searchData, isLoading: isSearchLoading } = useSearch({
    query: searchQuery,
    filters: searchFilters,
    enabled: isSearchMode && searchQuery.trim().length > 0,
  });

  // Update URL query params when filters/search/sort change
  const updateURLParams = useCallback(
    (query: string, filters: SearchFilters, sort: SortOption) => {
      const params = new URLSearchParams();

      if (query) {
        params.set("q", query);
      }

      if (sort !== "date") {
        params.set("sort", sort);
      }

      if (filters.priceRange) {
        if (filters.priceRange[0] > 0) {
          params.set("priceMin", filters.priceRange[0].toString());
        }
        if (filters.priceRange[1] !== Infinity) {
          params.set("priceMax", filters.priceRange[1].toString());
        }
      }

      if (filters.rating) {
        params.set("rating", filters.rating.toString());
      }

      if (filters.category) {
        params.set("category", filters.category);
      }

      const queryString = params.toString();
      const newUrl = queryString ? `/courses?${queryString}` : "/courses";
      router.replace(newUrl, { scroll: false });
    },
    [router]
  );

  // Infinite scroll implementation
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [target] = entries;
      if (target?.isIntersecting && hasNextPage && !isFetchingNextPage && !isSearchMode) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage, isSearchMode]
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

  // Handle search
  // const handleSearch = (query: string, filters?: SearchFilters) => {
  //   setSearchQuery(query);
  //   const newFilters = filters || searchFilters;
  //   setSearchFilters(newFilters);
  //   setIsSearchMode(query.trim().length > 0);
  //   updateURLParams(query, newFilters, sortBy);
  // };

  // Handle filter change
  const handleFilterChange = (filters: SearchFilters) => {
    setSearchFilters(filters);
    updateURLParams(searchQuery, filters, sortBy);
    if (searchQuery.trim().length > 0) {
      setIsSearchMode(true);
    }
  };

  // Handle remove filter chip
  const handleRemoveFilter = (filterKey: keyof SearchFilters) => {
    const newFilters = { ...searchFilters };
    delete newFilters[filterKey];
    setSearchFilters(newFilters);
    updateURLParams(searchQuery, newFilters, sortBy);
  };

  // Handle sort change
  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    updateURLParams(searchQuery, searchFilters, newSort);
  };

  // Handle course card click
  const handleCourseClick = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  // Handle purchase click
  const handlePurchase = (courseId: string) => {
    router.push(`/courses/${courseId}`);
  };

  // Handle upload course click
  const handleUploadCourse = () => {
    router.push("/upload");
  };

  // Get courses based on mode
  const courses = isSearchMode
    ? (searchData?.results?.filter((course) => course?.id) ?? [])
    : (browseData?.pages?.flatMap((page) => page.courses ?? []).filter((course) => course?.id) ??
      []);

  const isLoading = isSearchMode ? isSearchLoading : isBrowseLoading;

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Hero Content Section - Below Navbar */}
        <div className="relative overflow-hidden bg-background border-b border-border">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(128,128,128,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(128,128,128,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/50 border border-border/50 mb-6 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-muted-foreground opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-muted-foreground"></span>
                </span>
                <span className="text-xs text-muted-foreground">
                  Trusted by 10,000+ learners worldwide
                </span>
              </div>

              {/* Main Heading with Gradient */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-5 leading-[1.1] tracking-tight">
                <span className="text-foreground">Your All-in-One</span>
                <br />
                <span className="bg-gradient-to-r from-foreground via-foreground-secondary to-muted-foreground bg-clip-text text-transparent">
                  Learning Companion
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-muted-foreground mb-8 mx-auto leading-relaxed">
                Simplify learning with cutting-edge courses designed for everyone—from beginners to
                pros
              </p>

              {/* Category Pills */}
              <div className="flex gap-2 justify-center flex-wrap mx-auto">
                {["Programming", "Design", "Business", "Marketing", "Photography", "Music"].map(
                  (cat) => (
                    <button
                      key={cat}
                      onClick={() => handleFilterChange({ ...searchFilters, category: cat })}
                      className="px-4 py-1.5 bg-card/50 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium rounded-xl transition-all duration-200 border border-border/50 hover:border-border backdrop-blur-sm"
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Udemy Style Category Sections */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filter Bar */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
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

          {/* Search Results or Category Sections */}
          {isSearchMode ? (
            <SearchResults
              results={courses}
              query={searchQuery}
              isLoading={isLoading}
              onCourseClick={handleCourseClick}
              onPurchase={handlePurchase}
            />
          ) : (
            <>
              {/* Loading State */}
              {isLoading && (
                <div className="space-y-12">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx}>
                      <div className="h-8 w-48 bg-card rounded mb-6 animate-pulse"></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <CourseCardSkeleton key={index} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Category Sections - Udemy Style */}
              {!isLoading && courses.length > 0 && (
                <div className="space-y-16">
                  {/* Featured Courses */}
                  <CategorySection
                    title="Featured Courses"
                    courses={courses.slice(0, 4)}
                    onCourseClick={handleCourseClick}
                    onViewMore={() => router.push("/programming")}
                    showViewMore={courses.length > 4}
                  />

                  {/* Popular Courses */}
                  {courses.length > 4 && (
                    <CategorySection
                      title="Most Popular"
                      courses={courses.slice(4, 8)}
                      onCourseClick={handleCourseClick}
                      onViewMore={() => router.push("/design")}
                      showViewMore={courses.length > 8}
                    />
                  )}

                  {/* New Courses */}
                  {courses.length > 8 && (
                    <CategorySection
                      title="New Releases"
                      courses={courses.slice(8, 12)}
                      onCourseClick={handleCourseClick}
                      onViewMore={() => router.push("/business")}
                      showViewMore={courses.length > 12}
                    />
                  )}

                  {/* Instructor Upload CTA */}
                  {user?.role === "instructor" && (
                    <div className="mt-16 p-8 bg-card/30 border border-border/50 rounded-2xl text-center">
                      <h3 className="text-2xl font-bold text-foreground mb-3">
                        Share Your Knowledge
                      </h3>
                      <p className="text-muted-foreground mb-6 mx-auto">
                        Create an online course and reach thousands of students worldwide
                      </p>
                      <button
                        onClick={handleUploadCourse}
                        className="px-6 py-3 bg-muted hover:bg-muted-foreground/20 text-foreground rounded-xl transition-colors border border-border"
                      >
                        Upload Course
                      </button>
                    </div>
                  )}
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
                  <h2 className="text-2xl font-semibold text-foreground mb-2">No courses found</h2>
                  <p className="text-muted-foreground mb-6">Be the first to create a course</p>
                  {user?.role === "instructor" && (
                    <button
                      onClick={handleUploadCourse}
                      className="px-6 py-3 bg-muted hover:bg-muted-foreground/20 text-foreground rounded-xl transition-colors border border-border"
                    >
                      Upload Your First Course
                    </button>
                  )}
                </div>
              )}

              {/* Infinite Scroll Trigger */}
              {!isSearchMode && hasNextPage && (
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
            </>
          )}
        </div>
      </div>
    </>
  );
}

interface CategorySectionProps {
  title: string;
  courses: Course[];
  onCourseClick: (courseId: string) => void;
  onViewMore?: () => void;
  showViewMore?: boolean;
}

function CategorySection({
  title,
  courses,
  onCourseClick,
  onViewMore,
  showViewMore,
}: CategorySectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        {showViewMore && onViewMore && (
          <button
            onClick={onViewMore}
            className="text-sm text-muted-foreground flex items-center gap-1"
          >
            View more
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => onCourseClick(course.id)}
            onPurchase={() => onCourseClick(course.id)}
          />
        ))}
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
