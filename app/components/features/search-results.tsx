"use client";

import { CourseCard } from "./course-card";
import { Skeleton } from "@/app/components/ui/loading";
import type { Course } from "@/app/lib/api/service-types";

export interface SearchResultsProps {
  results: Course[];
  query: string;
  isLoading?: boolean;
  onCourseClick: (courseId: string) => void;
  onPurchase: (courseId: string) => void;
}

/**
 * SearchResults Component
 *
 * Displays search results with highlighting and empty states
 *
 * Features:
 * - Course grid layout
 * - Loading skeletons
 * - "No results" state with helpful message
 * - Keyword highlighting in course names
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */
export function SearchResults({
  results,
  query,
  isLoading,
  onCourseClick,
  onPurchase,
}: SearchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <SearchResultSkeleton key={index} />
        ))}
      </div>
    );
  }

  // No results state
  if (results.length === 0 && query) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg
          className="w-24 h-24 text-foreground-secondary mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h2 className="text-2xl font-semibold text-foreground mb-2">No courses found</h2>
        <p className="text-foreground-secondary mb-4 max-w-md">
          We couldn&apos;t find any courses matching &quot;{query}&quot;. Try adjusting your search
          or filters.
        </p>
        <div className="text-sm text-foreground-secondary space-y-1">
          <p>Suggestions:</p>
          <ul className="list-disc list-inside text-left">
            <li>Check your spelling</li>
            <li>Try more general keywords</li>
            <li>Remove some filters</li>
            <li>Browse all courses instead</li>
          </ul>
        </div>
      </div>
    );
  }

  // Results grid
  return (
    <div>
      {query && (
        <div className="mb-6">
          <p className="text-foreground-secondary">
            Found <span className="font-semibold text-foreground">{results.length}</span>{" "}
            {results.length === 1 ? "course" : "courses"} for &quot;
            <span className="font-semibold text-foreground">{query}</span>&quot;
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {results.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => onCourseClick(course.id)}
            onPurchase={onPurchase}
            highlightQuery={query}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Search Result Skeleton Component
 */
function SearchResultSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <Skeleton variant="rectangular" height={192} className="w-full" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" height={20} className="w-3/4" />
        <Skeleton variant="text" height={16} className="w-1/2" />
        <div className="flex items-center gap-2">
          <Skeleton variant="rectangular" height={16} width={80} />
          <Skeleton variant="text" height={16} width={40} />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton variant="text" height={24} width={60} />
          <Skeleton variant="rectangular" height={36} width={100} className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}
