/**
 * Lazy-loaded Video Player Template
 *
 * Dynamically imports the heavy video player component to reduce initial bundle size.
 * Shows a loading skeleton while the component is being loaded.
 *
 * Validates: Requirements 18.7, 18.10
 */

"use client";

import { lazy, Suspense } from "react";
import type { VideoTemplateProps } from "./video";

// Lazy load the video player component
const VideoTemplate = lazy(() =>
  import("./video").then((module) => ({ default: module.VideoTemplate }))
);

// Loading skeleton for video player
function VideoPlayerSkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Title Skeleton */}
      <div className="mb-4">
        <div className="h-8 bg-muted rounded-lg w-3/4 mb-2 animate-pulse" />
        <div className="h-4 bg-muted rounded-lg w-1/2 animate-pulse" />
      </div>

      {/* Video Player Skeleton */}
      <div
        className="relative bg-muted rounded-lg overflow-hidden shadow-xl animate-pulse"
        style={{ aspectRatio: "16/9" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      </div>

      {/* Controls Skeleton */}
      <div className="mt-4 p-4 bg-muted rounded-lg">
        <div className="h-4 bg-muted-foreground/20 rounded w-1/3 mb-2 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-6 bg-muted-foreground/20 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded Video Player with Suspense boundary
 */
export function VideoTemplateLazy(props: VideoTemplateProps) {
  return (
    <Suspense fallback={<VideoPlayerSkeleton />}>
      <VideoTemplate {...props} />
    </Suspense>
  );
}
