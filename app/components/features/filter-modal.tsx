"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModernButton } from "@/app/components/ui/modern-button";
import { ModernCard } from "@/app/components/ui/modern-card";
import { usdToCents, centsToUSD } from "@/app/lib/utils/price";
import type { SearchFilters } from "@/app/lib/api/service-types";

export interface FilterModalProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FilterModal Component - Modern Design
 *
 * Modal with filter sections:
 * - Price checkboxes
 * - Rating filter with stars
 * - Level filter
 * - Category filter with checkboxes
 * - Duration filter
 */
export function FilterModal({ filters, onFilterChange, isOpen, onClose }: FilterModalProps) {
  // Local state for filters - store in USD for user display
  const [priceMin, setPriceMin] = useState<number>(
    filters.priceRange?.[0] ? centsToUSD(filters.priceRange[0]) : 0
  );
  const [priceMax, setPriceMax] = useState<number>(
    filters.priceRange?.[1] === Infinity
      ? 500
      : filters.priceRange?.[1]
        ? centsToUSD(filters.priceRange[1])
        : 500
  );
  const [minRating, setMinRating] = useState<number | undefined>(filters.rating);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.category ? [filters.category] : []
  );

  // Available categories
  const categories = [
    { id: "programming", label: "Programming" },
    { id: "design", label: "Design" },
    { id: "business", label: "Business" },
    { id: "marketing", label: "Marketing" },
    { id: "photography", label: "Photography" },
    { id: "music", label: "Music" },
  ];

  // Handle category toggle
  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  // Apply filters
  const handleApplyFilters = () => {
    const newFilters: SearchFilters = {};

    // Convert USD to cents for backend
    if (priceMin > 0 || priceMax < 500) {
      newFilters.priceRange = [
        usdToCents(priceMin),
        priceMax === 500 ? Infinity : usdToCents(priceMax),
      ];
    }

    if (minRating) {
      newFilters.rating = minRating;
    }

    if (selectedCategories.length > 0) {
      newFilters.category = selectedCategories[0];
    }

    onFilterChange(newFilters);
    onClose();
  };

  // Clear all filters
  const handleClearFilters = () => {
    setPriceMin(0);
    setPriceMax(500);
    setMinRating(undefined);
    setSelectedCategories([]);
    onFilterChange({});
    onClose();
  };

  const hasActiveFilters =
    priceMin > 0 || priceMax < 500 || minRating !== undefined || selectedCategories.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-4 top-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-4xl lg:max-w-5xl z-50 max-h-[80vh] overflow-hidden"
          >
            <ModernCard className="flex flex-col max-h-[80vh]">
              {/* Header */}
              <div className="p-6 border-b border-zinc-800 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold text-white">Filters</h2>
                  <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-white transition-colors"
                    aria-label="Close filters"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Filter Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price Range */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">Price</h3>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priceMin === 0 && priceMax < 50}
                          onChange={() => {
                            setPriceMin(0);
                            setPriceMax(50);
                          }}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-zinc-300">Free</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priceMin === 0 && priceMax >= 50 && priceMax < 100}
                          onChange={() => {
                            setPriceMin(0);
                            setPriceMax(100);
                          }}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-zinc-300">Under $100</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={priceMin === 100 && priceMax >= 200}
                          onChange={() => {
                            setPriceMin(100);
                            setPriceMax(200);
                          }}
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-zinc-300">$100 - $200</span>
                      </label>
                    </div>
                  </div>

                  {/* Rating Filter */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">Rating</h3>
                    <div className="space-y-2">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <label
                          key={rating}
                          className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={minRating === rating}
                            onChange={() => setMinRating(minRating === rating ? undefined : rating)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <svg
                                key={index}
                                className={`w-3 h-3 ${
                                  index < rating
                                    ? "text-yellow-500 fill-current"
                                    : "text-zinc-600 fill-current"
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="text-sm text-zinc-300 ml-1">& up</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Level Filter */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">Level</h3>
                    <div className="space-y-2">
                      {["Beginner", "Intermediate", "Advanced", "All Levels"].map((level) => (
                        <label key={level} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-zinc-300">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <h3 className="font-semibold text-white mb-3">Category</h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.id)}
                            onChange={() => handleCategoryToggle(category.id)}
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-zinc-300">{category.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Duration Filter */}
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-white mb-3">Duration</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {["0-2 Hours", "3-6 Hours", "7-16 Hours", "17+ Hours"].map((duration) => (
                        <label key={duration} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-zinc-300">{duration}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-zinc-800 flex gap-3 flex-shrink-0">
                <ModernButton
                  variant="secondary"
                  size="default"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancel
                </ModernButton>
                <ModernButton
                  variant="primary"
                  size="default"
                  onClick={handleApplyFilters}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                >
                  Apply Filters
                </ModernButton>
              </div>
            </ModernCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
