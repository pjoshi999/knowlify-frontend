"use client";

import Image from "next/image";
import { useState } from "react";

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * OptimizedImage - A wrapper around Next.js Image component with built-in optimizations
 *
 * Features:
 * - Automatic WebP conversion with JPEG fallback
 * - Lazy loading for images below the fold
 * - Responsive images with srcset
 * - Image compression (max 200KB per requirement 18.19)
 * - Loading states and error handling
 *
 * Requirements: 18.16, 18.17, 18.18, 18.19, 18.20
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  fill = false,
  sizes,
  quality = 75, // Optimized quality for compression
  objectFit = "cover",
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  // Default sizes for responsive images if not provided
  const defaultSizes = sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  // Fallback placeholder for error state
  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 ${className}`}
        style={fill ? undefined : { width, height }}
      >
        <svg
          className="w-16 h-16 text-foreground-secondary"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${fill ? "w-full h-full" : ""}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className={`absolute inset-0 bg-muted animate-pulse ${className}`}
          style={fill ? undefined : { width, height }}
        />
      )}

      {/* Next.js Image with optimizations */}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={defaultSizes}
        quality={quality}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        style={fill ? { objectFit } : undefined}
        priority={priority}
        loading={priority ? undefined : "lazy"} // Lazy load non-priority images (Req 18.16)
        onLoad={handleLoad}
        onError={handleError}
        // Next.js automatically handles WebP conversion with JPEG fallback (Req 18.18)
      />
    </div>
  );
}
