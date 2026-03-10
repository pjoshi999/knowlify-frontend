"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { useSearchSuggestions } from "@/app/lib/hooks/use-search";
import type { SearchFilters } from "@/app/lib/api/service-types";

export interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  onFilterChange?: (filters: SearchFilters) => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
}

/**
 * SearchBar Component
 *
 * Search bar with debounced input, suggestions dropdown, and filter controls
 *
 * Features:
 * - Debounced search input (300ms)
 * - Real-time search suggestions
 * - Filter controls (price range, rating, category)
 * - Keyboard navigation for suggestions
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.6, 7.7, 7.8, 7.9, 18.27
 */
export function SearchBar({
  onSearch,
  onFilterChange,
  placeholder = "Search for courses...",
  showFilters = true,
  className = "",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({});
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [minRating, setMinRating] = useState<number | undefined>();
  const [category, setCategory] = useState<string>("");

  // Get search suggestions with debouncing
  const { data: suggestionsData } = useSearchSuggestions(query, {
    enabled: query.length > 0,
    debounceMs: 300,
  });

  const suggestions = suggestionsData || [];

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowFilterPanel(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // Handle search submission
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery, filters);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    const newFilters: SearchFilters = {};

    if (priceMin || priceMax) {
      newFilters.priceRange = [
        priceMin ? parseFloat(priceMin) : 0,
        priceMax ? parseFloat(priceMax) : Infinity,
      ];
    }

    if (minRating) {
      newFilters.rating = minRating;
    }

    if (category) {
      newFilters.category = category;
    }

    setFilters(newFilters);
    onFilterChange?.(newFilters);
    onSearch(query, newFilters);
    setShowFilterPanel(false);
  };

  // Clear filters
  const handleClearFilters = () => {
    setPriceMin("");
    setPriceMax("");
    setMinRating(undefined);
    setCategory("");
    setFilters({});
    onFilterChange?.({});
    if (query) {
      onSearch(query, {});
    }
  };

  const hasActiveFilters = priceMin || priceMax || minRating !== undefined || category;

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            fullWidth
            rightIcon={
              <button
                onClick={() => handleSearch()}
                className="text-foreground-secondary hover:text-foreground transition-colors"
                aria-label="Search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            }
          />

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
              >
                <ul className="py-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <button
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-800 transition-colors ${
                          index === selectedSuggestionIndex ? "bg-gray-800" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-foreground-secondary"
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
                          <span className="text-foreground">{suggestion}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filter Button */}
        {showFilters && (
          <Button
            variant={hasActiveFilters ? "primary" : "secondary"}
            size="md"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="relative"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="ml-2 hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
            )}
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-40 right-0 mt-2 w-full sm:w-96 bg-card border border-border rounded-xl shadow-lg p-6"
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Filters</h3>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-white hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Price Range
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    min="0"
                    step="10"
                  />
                  <span className="text-foreground-secondary">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    min="0"
                    step="10"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Minimum Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setMinRating(minRating === rating ? undefined : rating)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl border transition-colors ${
                        minRating === rating
                          ? "border-white bg-gray-900 text-white"
                          : "border-border hover:border-gray-400"
                      }`}
                    >
                      <svg
                        className="w-4 h-4"
                        fill={minRating === rating ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                      <span className="text-sm">{rating}+</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-input-border bg-input text-foreground focus:outline-none focus:border-input-focus transition-colors"
                >
                  <option value="">All Categories</option>
                  <option value="programming">Programming</option>
                  <option value="design">Design</option>
                  <option value="business">Business</option>
                  <option value="marketing">Marketing</option>
                  <option value="photography">Photography</option>
                  <option value="music">Music</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button variant="primary" size="md" onClick={handleApplyFilters} fullWidth>
                  Apply Filters
                </Button>
                <Button variant="secondary" size="md" onClick={() => setShowFilterPanel(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
