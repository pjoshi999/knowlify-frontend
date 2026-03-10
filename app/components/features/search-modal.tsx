"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/app/lib/hooks/use-search";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface RecentSearch {
  query: string;
  timestamp: number;
  courseId?: string; // Optional course ID for direct navigation
}

const RECENT_SEARCHES_KEY = "knowlify_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [currentTime] = useState(() => Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  // Get search results (courses)
  const { data: searchData } = useSearch({
    query: searchQuery,
    enabled: searchQuery.length > 2,
  });

  const suggestions = searchData?.results || [];

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Save search to localStorage
  const saveRecentSearch = (query: string, courseId?: string) => {
    const newSearch: RecentSearch = {
      query: query.trim(),
      timestamp: currentTime,
      courseId,
    };

    const updated = [newSearch, ...recentSearches.filter((s) => s.query !== query.trim())].slice(
      0,
      MAX_RECENT_SEARCHES
    );

    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Handle search submission
  const handleSearch = (query: string) => {
    if (query.trim()) {
      saveRecentSearch(query);
      router.push(`/courses?q=${encodeURIComponent(query.trim())}`);
      onClose();
      setSearchQuery("");
    }
  };

  // Handle course click (from suggestions)
  const handleCourseClick = (courseId: string, courseName: string) => {
    saveRecentSearch(courseName, courseId);
    router.push(`/courses/${courseId}`);
    onClose();
    setSearchQuery("");
  };

  // Handle recent search click
  const handleRecentSearchClick = (search: RecentSearch) => {
    if (search.courseId) {
      // Direct navigation to course detail page
      router.push(`/courses/${search.courseId}`);
      onClose();
      setSearchQuery("");
    } else {
      // Navigate to search results page
      saveRecentSearch(search.query);
      router.push(`/courses?q=${encodeURIComponent(search.query.trim())}`);
      onClose();
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-4xl bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input */}
          <div className="relative border-b border-border">
            <div className="flex items-center gap-3 px-4 py-3">
              <svg
                className="w-5 h-5 text-muted-foreground flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(searchQuery);
                  }
                }}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
              />
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1.5 hover:bg-muted rounded-xl transition-colors"
              >
                <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 bg-muted rounded border border-border">
                  ESC
                </span>
              </button>
            </div>
          </div>

          {/* Course Suggestions */}
          {searchQuery && suggestions.length > 0 && (
            <div className="p-3 max-h-[400px] overflow-y-auto">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">COURSES</div>
              <div className="space-y-1">
                {suggestions.map((course: any) => (
                  <button
                    key={course.id}
                    onClick={() => handleCourseClick(course.id, course.name)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted rounded-xl transition-colors text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
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
                        </div>
                      )}
                    </div>
                    <div className="flex item-center min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{course.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches (when no search query) */}
          {!searchQuery && recentSearches.length > 0 && (
            <div className="p-3 border-t border-border">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">
                RECENT SEARCHES
              </div>
              <div className="space-y-1">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted rounded-lg transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-4 h-4 text-muted-foreground"
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
                      <span className="text-sm text-foreground">{search.query}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(search.timestamp)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {searchQuery && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">
                No courses found for &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Helper function to format timestamp
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
