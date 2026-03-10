/**
 * useCourseAssets Hook
 *
 * Custom hook for fetching course assets (videos, PDFs, etc.)
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getCourseAssets } from "../api/courses";
import { queryKeys } from "../query/invalidation";

export interface CourseAsset {
  id: string;
  courseId: string;
  assetType: "VIDEO" | "PDF" | "QUIZ" | "EXAM" | "NOTE" | "OTHER";
  fileName: string;
  fileSize: number;
  storagePath: string;
  mimeType: string;
  duration?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Hook for fetching course assets
 *
 * @param courseId - The ID of the course
 * @returns Query result with course assets
 *
 * @example
 * ```tsx
 * const { data: assets, isLoading, error } = useCourseAssets(courseId);
 *
 * if (assets) {
 *   const videos = assets.filter(a => a.assetType === 'VIDEO');
 *   console.log('Videos:', videos);
 * }
 * ```
 */
export function useCourseAssets(
  courseId: string | undefined
): UseQueryResult<CourseAsset[], Error> {
  return useQuery({
    queryKey: queryKeys.courses.detail(courseId ?? ""),
    queryFn: async () => {
      if (!courseId) {
        throw new Error("Course ID is required");
      }
      const assets = await getCourseAssets(courseId);
      return assets.map((asset: any) => ({
        id: String(asset?.id ?? ""),
        courseId: String(asset?.courseId ?? asset?.course_id ?? ""),
        assetType: String(
          asset?.assetType ?? asset?.asset_type ?? "OTHER"
        ).toUpperCase() as CourseAsset["assetType"],
        fileName: String(asset?.fileName ?? asset?.file_name ?? ""),
        fileSize: Number(asset?.fileSize ?? asset?.file_size ?? 0),
        storagePath: String(asset?.storagePath ?? asset?.storage_path ?? ""),
        mimeType: String(asset?.mimeType ?? asset?.mime_type ?? ""),
        duration: asset?.duration ? Number(asset.duration) : undefined,
        metadata: asset?.metadata ?? {},
        createdAt: new Date(asset?.createdAt ?? asset?.created_at ?? Date.now()),
      }));
    },
    enabled: !!courseId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
