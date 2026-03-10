/**
 * React Query hooks for course upload
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadFolder,
  analyzeStructure,
  createCourseWithStructure,
  type CreateCourseWithStructureRequest,
} from "../api/course-upload.api";
import { retryWithBackoff, logError } from "../utils/error-handler";

/**
 * Hook for uploading folder
 */
export const useUploadFolder = () => {
  return useMutation({
    mutationFn: ({ files, folderStructure }: { files: File[]; folderStructure?: any }) =>
      retryWithBackoff(() => uploadFolder(files, folderStructure), {
        maxRetries: 2,
        initialDelay: 2000,
      }),
    onError: (error) => {
      logError(error, "useUploadFolder");
    },
  });
};

/**
 * Hook for analyzing structure
 */
export const useAnalyzeStructure = () => {
  return useMutation({
    mutationFn: (sessionId: string) =>
      retryWithBackoff(() => analyzeStructure(sessionId), {
        maxRetries: 3,
        initialDelay: 1000,
      }),
    onError: (error) => {
      logError(error, "useAnalyzeStructure");
    },
  });
};

/**
 * Hook for creating course with structure
 */
export const useCreateCourseWithStructure = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCourseWithStructureRequest) =>
      retryWithBackoff(() => createCourseWithStructure(data), {
        maxRetries: 2,
        initialDelay: 2000,
      }),
    onSuccess: () => {
      // Invalidate courses list
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
    onError: (error) => {
      logError(error, "useCreateCourseWithStructure");
    },
  });
};
