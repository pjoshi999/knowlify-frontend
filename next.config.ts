import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Optimize bundle splitting and chunking
  experimental: {
    // Enable optimized package imports for better tree-shaking
    optimizePackageImports: ["framer-motion", "@tanstack/react-query", "zustand", "dexie"],
  },

  // Enable compression
  compress: true,

  // Production source maps for debugging (can be disabled for smaller builds)
  productionBrowserSourceMaps: false,

  // Image optimization configuration
  images: {
    // Enable modern image formats (WebP, AVIF)
    formats: ["image/webp", "image/avif"],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for different use cases
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Quality setting for image optimization (75 for good balance)
    // Requirement 18.19: Compress images to max 200KB
    minimumCacheTTL: 31536000, // 1 year cache (Requirement 18.23)

    // Allow images from external domains (add your domains here)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
