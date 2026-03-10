/**
 * Lazy-loaded Revenue Breakdown Component
 *
 * Dynamically imports the heavy chart component to reduce initial bundle size.
 * Shows a loading skeleton while the component is being loaded.
 *
 * Validates: Requirements 18.7, 18.10
 */

"use client";

import { lazy, Suspense } from "react";
import type { CourseStats } from "@/app/lib/api/service-types";

// Lazy load the revenue breakdown component
const RevenueBreakdown = lazy(() =>
  import("./revenue-breakdown").then((module) => ({ default: module.RevenueBreakdown }))
);

// Loading skeleton for revenue breakdown
function RevenueBreakdownSkeleton() {
  return (
    <div className="space-y-6">
      {/* Revenue Chart Skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="h-6 bg-muted rounded w-1/3 mb-2 animate-pulse" />
        <div className="h-4 bg-muted rounded w-1/2 mb-6 animate-pulse" />

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-16 animate-pulse" />
              </div>
              <div className="h-8 bg-muted rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History Skeleton */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="h-6 bg-muted rounded w-48 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-64 animate-pulse" />
          </div>
          <div className="h-9 bg-muted rounded w-24 animate-pulse" />
        </div>

        {/* Filter buttons skeleton */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-muted rounded w-24 animate-pulse" />
          ))}
        </div>

        {/* Table skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RevenueBreakdownLazyProps {
  courseStats: CourseStats[];
}

/**
 * Lazy-loaded Revenue Breakdown with Suspense boundary
 */
export function RevenueBreakdownLazy(props: RevenueBreakdownLazyProps) {
  return (
    <Suspense fallback={<RevenueBreakdownSkeleton />}>
      <RevenueBreakdown {...props} />
    </Suspense>
  );
}
