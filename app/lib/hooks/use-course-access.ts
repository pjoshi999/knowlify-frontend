/**
 * Course Access Hook
 *
 * Manages course access checking, enrollment status, and asset retrieval
 * with proper state management and caching
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { checkCourseAccess, getCourseAssets } from "../api/courses";
import { queryKeys } from "../query/invalidation";
import { processManifestUrls, replaceS3WithCloudFront } from "../utils/cdn";

export interface CourseAccessData {
  hasAccess: boolean;
  reason: "enrolled" | "instructor" | "not_enrolled";
  enrollmentId?: string;
  progress?: {
    completedLessons: string[];
    watchedVideos: Record<
      string,
      {
        lastPosition: number;
        duration: number;
        completed: boolean;
        watchedAt: string;
      }
    >;
  };
  course: any;
  manifest?: any;
}

export interface CourseAsset {
  id: string;
  courseId: string;
  assetType: "VIDEO" | "PDF" | "NOTE" | "QUIZ" | "EXAM" | "OTHER";
  fileName: string;
  fileSize: number;
  storagePath: string;
  mimeType: string;
  duration?: number;
  metadata?: any;
  createdAt: string;
}

/**
 * Hook to check if user has access to a course
 * Automatically handles enrollment status and instructor ownership
 */
export function useCourseAccess(
  courseId: string | undefined,
  options?: {
    enabled?: boolean;
    onAccessDenied?: () => void;
    onAccessGranted?: (data: CourseAccessData) => void;
  }
): UseQueryResult<CourseAccessData, Error> & {
  hasAccess: boolean;
  isEnrolled: boolean;
  isInstructor: boolean;
  enrollmentId?: string;
  manifest?: any;
} {
  const query = useQuery<CourseAccessData, Error>({
    queryKey: queryKeys.courseAccess(courseId!),
    queryFn: async () => {
      if (!courseId) throw new Error("Course ID is required");
      const data = await checkCourseAccess(courseId);

      // Extract manifest from course data (may arrive as JSON string)
      const rawManifest = data.course?.manifest;
      let manifest = rawManifest;
      if (typeof rawManifest === "string") {
        try {
          manifest = JSON.parse(rawManifest);
        } catch {
          manifest = undefined;
        }
      }

      // Process manifest to replace S3 URLs with CloudFront URLs
      manifest = processManifestUrls(manifest);

      return {
        ...data,
        manifest,
      };
    },
    enabled: Boolean(courseId) && options?.enabled !== false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  // Call callbacks based on access status
  const hasAccess = query.data?.hasAccess ?? false;
  const prevHasAccess = React.useRef(hasAccess);

  React.useEffect(() => {
    if (query.isSuccess && query.data) {
      if (query.data.hasAccess && !prevHasAccess.current) {
        options?.onAccessGranted?.(query.data);
      } else if (!query.data.hasAccess) {
        options?.onAccessDenied?.();
      }
      prevHasAccess.current = query.data.hasAccess;
    }
  }, [query.isSuccess, query.data, options]);

  return {
    ...query,
    hasAccess: query.data?.hasAccess ?? false,
    isEnrolled: query.data?.reason === "enrolled",
    isInstructor: query.data?.reason === "instructor",
    enrollmentId: query.data?.enrollmentId,
    manifest: query.data?.manifest,
  };
}

/**
 * Hook to get course assets (videos, PDFs, etc.)
 * Only works if user has access to the course
 */
export function useCourseAssets(
  courseId: string | undefined,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<CourseAsset[], Error> & {
  videos: CourseAsset[];
  pdfs: CourseAsset[];
  notes: CourseAsset[];
  getAssetById: (assetId: string) => CourseAsset | undefined;
  getAssetByFileName: (fileName: string) => CourseAsset | undefined;
} {
  const query = useQuery<CourseAsset[], Error>({
    queryKey: queryKeys.courseAssets(courseId!),
    queryFn: async () => {
      if (!courseId) throw new Error("Course ID is required");
      const assets = await getCourseAssets(courseId);

      // Replace S3 URLs with CloudFront URLs in asset storage paths
      return assets.map((asset) => ({
        ...asset,
        storagePath: replaceS3WithCloudFront(asset.storagePath),
      }));
    },
    enabled: Boolean(courseId) && options?.enabled !== false,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  });

  const assets = query.data ?? [];

  return {
    ...query,
    videos: assets.filter((a) => a.assetType === "VIDEO"),
    pdfs: assets.filter((a) => a.assetType === "PDF"),
    notes: assets.filter((a) => a.assetType === "NOTE"),
    getAssetById: (assetId: string) => assets.find((a) => a.id === assetId),
    getAssetByFileName: (fileName: string) => assets.find((a) => a.fileName === fileName),
  };
}

/**
 * Combined hook for course access and assets
 * Automatically fetches assets when access is granted
 */
export function useCourseContent(
  courseId: string | undefined,
  options?: {
    onAccessDenied?: () => void;
    onAccessGranted?: (data: CourseAccessData) => void;
  }
) {
  const accessQuery = useCourseAccess(courseId, options);

  const assetsQuery = useCourseAssets(courseId, {
    enabled: accessQuery.hasAccess,
  });

  return {
    // Access data
    hasAccess: accessQuery.hasAccess,
    isEnrolled: accessQuery.isEnrolled,
    isInstructor: accessQuery.isInstructor,
    enrollmentId: accessQuery.enrollmentId,
    progress: accessQuery.data?.progress,
    manifest: accessQuery.manifest,

    // Assets data
    assets: assetsQuery.data ?? [],
    videos: assetsQuery.videos,
    pdfs: assetsQuery.pdfs,
    notes: assetsQuery.notes,
    getAssetById: assetsQuery.getAssetById,
    getAssetByFileName: assetsQuery.getAssetByFileName,

    // Loading states
    isLoadingAccess: accessQuery.isLoading,
    isLoadingAssets: assetsQuery.isLoading,
    isLoading: accessQuery.isLoading || (accessQuery.hasAccess && assetsQuery.isLoading),

    // Error states
    accessError: accessQuery.error,
    assetsError: assetsQuery.error,
    error: accessQuery.error || assetsQuery.error,

    // Refetch functions
    refetchAccess: accessQuery.refetch,
    refetchAssets: assetsQuery.refetch,
    refetchAll: async () => {
      await accessQuery.refetch();
      if (accessQuery.hasAccess) {
        await assetsQuery.refetch();
      }
    },
  };
}

// Add React import for useRef and useEffect
import React from "react";
