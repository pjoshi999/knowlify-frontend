/**
 * Prefetch Link Component
 *
 * Enhanced Link component that prefetches route-specific modules on hover.
 * This improves perceived performance by loading code before navigation.
 *
 * Validates: Requirements 18.7, 18.10, 18.21
 */

"use client";

import Link from "next/link";
import { useCallback, type ComponentProps } from "react";
import { preloadRouteModules, prefetchResources } from "@/app/lib/utils/dynamic-imports";

interface PrefetchLinkProps extends ComponentProps<typeof Link> {
  /**
   * Whether to prefetch route modules on hover
   * @default true
   */
  prefetchModules?: boolean;

  /**
   * Additional resources to prefetch (images, scripts, etc.)
   * These will be prefetched when the user hovers over the link
   */
  prefetchResources?: string[];

  /**
   * Priority for resource prefetching
   * @default 'low'
   */
  prefetchPriority?: "high" | "low";
}

/**
 * Link component with intelligent module and resource prefetching
 *
 * Automatically prefetches route-specific code chunks and related resources
 * when user hovers, making navigation feel instant.
 */
export function PrefetchLink({
  href,
  prefetchModules = true,
  prefetchResources: resourcesToPrefetch,
  prefetchPriority = "low",
  onMouseEnter,
  children,
  ...props
}: PrefetchLinkProps) {
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      // Call original onMouseEnter if provided
      onMouseEnter?.(event);

      // Prefetch route modules if enabled
      if (prefetchModules && typeof href === "string") {
        preloadRouteModules(href);
      }

      // Prefetch additional resources if provided
      if (resourcesToPrefetch && resourcesToPrefetch.length > 0) {
        prefetchResources(resourcesToPrefetch, prefetchPriority);
      }
    },
    [href, prefetchModules, resourcesToPrefetch, prefetchPriority, onMouseEnter]
  );

  return (
    <Link href={href} onMouseEnter={handleMouseEnter} {...props}>
      {children}
    </Link>
  );
}

/**
 * Example usage:
 *
 * // Basic usage - automatically prefetches modules on hover
 * <PrefetchLink href="/upload">
 *   Upload Course
 * </PrefetchLink>
 *
 * // Disable prefetching for specific links
 * <PrefetchLink href="/about" prefetchModules={false}>
 *   About
 * </PrefetchLink>
 *
 * // With custom hover handler
 * <PrefetchLink
 *   href="/courses"
 *   onMouseEnter={(e) => console.log('Hovering over courses link')}
 * >
 *   Browse Courses
 * </PrefetchLink>
 *
 * // Prefetch related resources (images, videos, etc.)
 * <PrefetchLink
 *   href="/courses/123"
 *   prefetchResources={[
 *     '/course-thumbnails/course-123.jpg',
 *     '/instructor-avatars/instructor-456.jpg',
 *   ]}
 *   prefetchPriority="high"
 * >
 *   View Course
 * </PrefetchLink>
 */
