/**
 * Dynamic Import Utilities
 *
 * Utilities for dynamically importing large libraries only when needed.
 * This reduces the initial bundle size by deferring non-critical imports.
 *
 * Validates: Requirements 18.7, 18.10
 */

/**
 * Dynamically import Framer Motion only when animations are needed
 * This saves ~50KB from the initial bundle
 */
export async function loadFramerMotion() {
  const { motion, AnimatePresence } = await import("framer-motion");
  return { motion, AnimatePresence };
}

/**
 * Dynamically import Stripe.js only when payment is needed
 * This saves ~80KB from the initial bundle
 */
export async function loadStripe() {
  const { loadStripe } = await import("@stripe/stripe-js");
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || "");
  return stripePromise;
}

/**
 * Dynamically import Stripe React components only when needed
 */
export async function loadStripeReact() {
  const { Elements, CardElement, useStripe, useElements } = await import("@stripe/react-stripe-js");
  return { Elements, CardElement, useStripe, useElements };
}

/**
 * Dynamically import Dexie (IndexedDB) only when offline storage is needed
 * This saves ~30KB from the initial bundle
 */
export async function loadDexie() {
  const Dexie = await import("dexie");
  return Dexie.default;
}

/**
 * Dynamically import Zod validation only when complex validation is needed
 * This saves ~20KB from the initial bundle
 */
export async function loadZod() {
  const z = await import("zod");
  return z;
}

/**
 * Dynamically import Axios only when HTTP requests are needed
 * Note: For most cases, use the pre-configured API client instead
 */
export async function loadAxios() {
  const axios = await import("axios");
  return axios.default;
}

/**
 * Preload a module in the background without blocking
 * Useful for predictable user flows
 */
export function preloadModule(importFn: () => Promise<any>) {
  // Use requestIdleCallback if available, otherwise use setTimeout
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    window.requestIdleCallback(() => {
      importFn().catch(() => {
        // Silently fail - module will be loaded when actually needed
      });
    });
  } else {
    setTimeout(() => {
      importFn().catch(() => {
        // Silently fail - module will be loaded when actually needed
      });
    }, 1);
  }
}

/**
 * Preload critical modules for a specific route
 * Call this when user hovers over a navigation link
 */
export function preloadRouteModules(route: string) {
  switch (route) {
    case "/upload":
      preloadModule(() => import("@/app/components/features/upload/upload-components-lazy"));
      break;
    case "/checkout":
      preloadModule(() => import("@/app/components/features/payment/payment-components-lazy"));
      break;
    case "/learn":
      preloadModule(() => import("@/app/components/templates/video-lazy"));
      break;
    case "/instructor/dashboard":
      preloadModule(() => import("@/app/components/features/revenue-breakdown-lazy"));
      break;
  }
}

/**
 * Prefetch resources for likely next navigation
 * This includes images, scripts, and other assets
 */
export function prefetchResources(urls: string[], priority: "high" | "low" = "low") {
  if (typeof window === "undefined") return;

  urls.forEach((url) => {
    // Determine resource type from URL
    const resourceType = getResourceType(url);

    // Create link element for prefetching
    const link = document.createElement("link");
    link.rel = priority === "high" ? "preload" : "prefetch";

    // Set appropriate attributes based on resource type
    if (resourceType === "image") {
      link.as = "image";
      // Add fetchpriority for high priority images
      if (priority === "high") {
        link.setAttribute("fetchpriority", "high");
      }
    } else if (resourceType === "script") {
      link.as = "script";
    } else if (resourceType === "style") {
      link.as = "style";
    } else if (resourceType === "font") {
      link.as = "font";
      link.crossOrigin = "anonymous";
    } else if (resourceType === "video") {
      link.as = "video";
    }

    link.href = url;

    // Avoid duplicate prefetch links
    const existingLink = document.querySelector(`link[href="${url}"]`);
    if (!existingLink) {
      document.head.appendChild(link);
    }
  });
}

/**
 * Determine resource type from URL
 */
function getResourceType(url: string): "image" | "script" | "style" | "font" | "video" | "unknown" {
  const extension = url.split(".").pop()?.toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp", "avif", "svg"].includes(extension || "")) {
    return "image";
  }
  if (["js", "mjs"].includes(extension || "")) {
    return "script";
  }
  if (extension === "css") {
    return "style";
  }
  if (["woff", "woff2", "ttf", "otf"].includes(extension || "")) {
    return "font";
  }
  if (["mp4", "webm", "ogg"].includes(extension || "")) {
    return "video";
  }

  return "unknown";
}

/**
 * Prefetch images that are likely to be viewed next
 * Useful for course thumbnails, instructor avatars, etc.
 */
export function prefetchImages(imageUrls: string[]) {
  prefetchResources(imageUrls, "low");
}

/**
 * Preload critical images that will definitely be shown
 * Use for above-the-fold images
 */
export function preloadCriticalImages(imageUrls: string[]) {
  prefetchResources(imageUrls, "high");
}

/**
 * Prefetch next page in pagination
 * Call when user is near the end of current page
 */
export function prefetchNextPage(currentPage: number, baseUrl: string) {
  const nextPageUrl = `${baseUrl}?page=${currentPage + 1}`;

  if (typeof window !== "undefined") {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = nextPageUrl;

    const existingLink = document.querySelector(`link[href="${nextPageUrl}"]`);
    if (!existingLink) {
      document.head.appendChild(link);
    }
  }
}

/**
 * Check if a module is already loaded
 * Useful for avoiding duplicate loads
 */
export function isModuleLoaded(moduleName: string): boolean {
  if (typeof window === "undefined") return false;

  // Check if module exists in webpack's module cache
  // This is a heuristic and may not work in all cases
  return (window as any).__webpack_modules__?.[moduleName] !== undefined;
}

/**
 * Load multiple modules in parallel
 * More efficient than sequential loading
 */
export async function loadModules<T extends Record<string, () => Promise<any>>>(
  modules: T
): Promise<{ [K in keyof T]: Awaited<ReturnType<T[K]>> }> {
  const entries = Object.entries(modules);
  const results = await Promise.all(entries.map(([_, loader]) => loader()));

  return Object.fromEntries(entries.map(([key], index) => [key, results[index]])) as any;
}

/**
 * Example usage:
 *
 * // Load single module
 * const stripe = await loadStripe();
 *
 * // Preload on hover
 * <Link href="/upload" onMouseEnter={() => preloadRouteModules('/upload')}>
 *   Upload Course
 * </Link>
 *
 * // Load multiple modules
 * const { stripe, motion } = await loadModules({
 *   stripe: loadStripe,
 *   motion: loadFramerMotion,
 * });
 *
 * // Prefetch images for next page
 * prefetchImages([
 *   '/course-thumbnails/course-1.jpg',
 *   '/course-thumbnails/course-2.jpg',
 * ]);
 *
 * // Preload critical above-the-fold images
 * preloadCriticalImages(['/hero-image.jpg']);
 *
 * // Prefetch next page when user scrolls near bottom
 * prefetchNextPage(currentPage, '/courses');
 */
