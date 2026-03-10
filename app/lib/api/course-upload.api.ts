/**
 * Course Upload API Client
 *
 * API functions for AI-powered course creation
 */

import apiClient from "./client";

export interface FolderUploadResponse {
  sessionId: string;
  fileCount: number;
  totalSize: number;
  tempStoragePaths: string[];
  expiresAt: string;
}

export interface SuggestedModule {
  title: string;
  description: string;
  order: number;
  lessons: SuggestedLesson[];
}

export interface SuggestedLesson {
  title: string;
  description: string;
  type: "VIDEO" | "PDF" | "IMAGE";
  order: number;
  fileName: string;
  duration?: number;
}

export interface SuggestedStructure {
  modules: SuggestedModule[];
  metadata: {
    suggestedName: string;
    suggestedDescription: string;
    suggestedCategory: string;
  };
}

export interface AnalyzeStructureResponse {
  sessionId: string;
  suggestedStructure: SuggestedStructure;
}

export interface CreateCourseWithStructureRequest {
  sessionId: string;
  courseData: {
    name: string;
    description: string;
    category: string;
    priceAmount?: number;
    priceCurrency?: string;
    thumbnailUrl?: string;
  };
  structure: {
    modules: SuggestedModule[];
  };
}

export interface CreateCourseWithStructureResponse {
  course: {
    id: string;
    name: string;
    description: string;
  };
  moduleCount: number;
  lessonCount: number;
  analysisJobIds: string[];
}

/**
 * Upload folder with files
 */
export const uploadFolder = async (
  files: File[],
  folderStructure?: any
): Promise<FolderUploadResponse> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  if (folderStructure) {
    formData.append("folderStructure", JSON.stringify(folderStructure));
  }

  const response = await apiClient.post<FolderUploadResponse>("/courses/folder-upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/**
 * Analyze folder structure with AI
 */
export const analyzeStructure = async (sessionId: string): Promise<AnalyzeStructureResponse> => {
  const response = await apiClient.post<AnalyzeStructureResponse>("/courses/analyze-structure", {
    sessionId,
  });

  return response.data;
};

/**
 * Create course with AI-suggested structure
 */
export const createCourseWithStructure = async (
  data: CreateCourseWithStructureRequest
): Promise<CreateCourseWithStructureResponse> => {
  const response = await apiClient.post<CreateCourseWithStructureResponse>(
    "/courses/create-with-structure",
    data
  );

  return response.data;
};
