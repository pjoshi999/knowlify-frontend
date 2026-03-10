/**
 * Resource Prefetching Hook
 *
 * Custom hook for prefetching resources based on user behavior.
 * Helps improve perceived performance by loading resources before they're needed.
 *
 * Validates: Requirements 18.21
 */

"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  prefetchImages,
  preloadCriticalImages,
  prefetchNextPage,
  prefetchResources,
} from "@/app/lib/utils/dynamic-imports";

interface UsePrefetchOptions {
  /**
   * Enable automatic prefetching on mount
   * @default false
   */
  prefetchOnMount?: boolean;

  /**
   * Delay before prefetching (in milliseconds)
   * @default 0
   */
  delay?: number;
}

/**
 * Hook for prefetching images
 *
 * @example
 * ```tsx
 * function CourseList({ courses }) {
 *   const { prefetch } = usePrefetchImages();
 *
 *   useEffect(() => {
 *     // Prefetch thumbnails for next page
 *     const thumbnails = courses.map(c => c.thumbnailUrl);
 *     prefetch(thumbnails);
 *   }, [courses, prefetch]);
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePrefetchImages(options: UsePrefetchOptions = {}) {
  const { delay = 0 } = options;
  const prefetchedRef = useRef(new Set<string>());

  const prefetch = useCallback(
    (imageUrls: string[]) => {
      // Filter out already prefetched images
      const newImages = imageUrls.filter((url) => !prefetchedRef.current.has(url));

      if (newImages.length === 0) return;

      const doPrefetch = () => {
        prefetchImages(newImages);
        newImages.forEach((url) => prefetchedRef.current.add(url));
      };

      if (delay > 0) {
        setTimeout(doPrefetch, delay);
      } else {
        doPrefetch();
      }
    },
    [delay]
  );

  const preload = useCallback((imageUrls: string[]) => {
    preloadCriticalImages(imageUrls);
    imageUrls.forEach((url) => prefetchedRef.current.add(url));
  }, []);

  return { prefetch, preload };
}

/**
 * Hook for prefetching next page in pagination
 * Automatically prefetches when user scrolls near bottom
 *
 * @example
 * ```tsx
 * function CourseList({ currentPage }) {
 *   usePrefetchNextPage({
 *     currentPage,
 *     baseUrl: '/courses',
 *     threshold: 0.8, // Prefetch when 80% scrolled
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePrefetchNextPage({
  currentPage,
  baseUrl,
  threshold = 0.8,
  enabled = true,
}: {
  currentPage: number;
  baseUrl: string;
  threshold?: number;
  enabled?: boolean;
}) {
  const prefetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled || prefetchedRef.current) return;

    const handleScroll = () => {
      const scrollPercentage =
        (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;

      if (scrollPercentage >= threshold) {
        prefetchNextPage(currentPage, baseUrl);
        prefetchedRef.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPage, baseUrl, threshold, enabled]);
}

/**
 * Hook for prefetching arbitrary resources
 *
 * @example
 * ```tsx
 * function VideoPlayer({ videoUrl, thumbnailUrl }) {
 *   const { prefetch } = usePrefetchResources();
 *
 *   const handleMouseEnter = () => {
 *     // Prefetch video when user hovers over play button
 *     prefetch([videoUrl], 'high');
 *   };
 *
 *   return (
 *     <div onMouseEnter={handleMouseEnter}>
 *       <img src={thumbnailUrl} alt="Video thumbnail" />
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrefetchResources() {
  const prefetchedRef = useRef(new Set<string>());

  const prefetch = useCallback((urls: string[], priority: "high" | "low" = "low") => {
    const newUrls = urls.filter((url) => !prefetchedRef.current.has(url));

    if (newUrls.length === 0) return;

    prefetchResources(newUrls, priority);
    newUrls.forEach((url) => prefetchedRef.current.add(url));
  }, []);

  return { prefetch };
}

/**
 * Hook for intelligent prefetching based on viewport visibility
 * Prefetches resources when they're about to enter the viewport
 *
 * @example
 * ```tsx
 * function CourseCard({ course }) {
 *   const cardRef = useRef<HTMLDivElement>(null);
 *
 *   useIntersectionPrefetch({
 *     ref: cardRef,
 *     resources: [course.thumbnailUrl],
 *     rootMargin: '200px', // Prefetch 200px before entering viewport
 *   });
 *
 *   return <div ref={cardRef}>...</div>;
 * }
 * ```
 */
export function useIntersectionPrefetch({
  ref,
  resources,
  rootMargin = "200px",
  enabled = true,
}: {
  ref: React.RefObject<Element>;
  resources: string[];
  rootMargin?: string;
  enabled?: boolean;
}) {
  const prefetchedRef = useRef(false);

  useEffect(() => {
    if (!enabled || prefetchedRef.current || !ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !prefetchedRef.current) {
            prefetchImages(resources);
            prefetchedRef.current = true;
          }
        });
      },
      { rootMargin }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, resources, rootMargin, enabled]);
}

/**
 * Hook for prefetching on idle
 * Prefetches resources when browser is idle
 *
 * @example
 * ```tsx
 * function App() {
 *   usePrefetchOnIdle({
 *     resources: [
 *       '/images/logo.png',
 *       '/images/hero.jpg',
 *     ],
 *   });
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function usePrefetchOnIdle({
  resources,
  enabled = true,
}: {
  resources: string[];
  enabled?: boolean;
}) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const prefetch = () => {
      prefetchImages(resources);
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(prefetch);
      return () => window.cancelIdleCallback(id);
    } else {
      const timeout = setTimeout(prefetch, 1000);
      return () => clearTimeout(timeout);
    }
  }, [resources, enabled]);
}
