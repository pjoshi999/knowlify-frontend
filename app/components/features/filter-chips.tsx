"use client";

import type { SearchFilters } from "@/app/lib/api/service-types";

export interface FilterChipsProps {
  filters: SearchFilters;
  onRemoveFilter: (filterKey: keyof SearchFilters) => void;
}

/**
 * FilterChips Component
 *
 * Displays active filters as removable chips
 */
export function FilterChips({ filters, onRemoveFilter }: FilterChipsProps) {
  const chips: Array<{ key: keyof SearchFilters; label: string }> = [];

  // Price range chip
  if (filters.priceRange) {
    const [min, max] = filters.priceRange;
    let label = "";
    if (min === 0 && max < 50) {
      label = "Free";
    } else if (min === 0 && max < 100) {
      label = "Under $100";
    } else if (min === 100 && max >= 200) {
      label = "$100 - $200";
    } else {
      label = `$${min} - $${max === Infinity ? "∞" : max}`;
    }
    chips.push({ key: "priceRange", label });
  }

  // Rating chip
  if (filters.rating) {
    chips.push({ key: "rating", label: `${filters.rating}+ Stars` });
  }

  // Category chip
  if (filters.category) {
    chips.push({ key: "category", label: filters.category });
  }

  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map((chip) => (
        <div
          key={chip.key}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-sm text-foreground"
        >
          <span>{chip.label}</span>
          <button
            onClick={() => onRemoveFilter(chip.key)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label={`Remove ${chip.label} filter`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
