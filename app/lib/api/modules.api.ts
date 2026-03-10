/**
 * Modules API Client
 *
 * API functions for module and lesson management
 */

import apiClient from "./client";

export interface Module {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  type: "VIDEO" | "PDF" | "IMAGE";
  order: number;
  assetId?: string;
  duration?: number;
  aiAnalysis?: AIAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface AIAnalysis {
  id: string;
  lessonId: string;
  summary: string;
  topics: string[];
  learningObjectives: string[];
  keyPoints: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  transcription?: string;
  analyzedAt: string;
}

export interface CreateModuleRequest {
  title: string;
  description?: string;
  order?: number;
}

export interface UpdateModuleRequest {
  title?: string;
  description?: string;
  order?: number;
}

export interface CreateLessonRequest {
  title: string;
  description?: string;
  type: "VIDEO" | "PDF" | "IMAGE";
  order?: number;
  assetId?: string;
  duration?: number;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  type?: "VIDEO" | "PDF" | "IMAGE";
  order?: number;
  assetId?: string;
  duration?: number;
}

/**
 * Get all modules for a course
 */
export const getModules = async (courseId: string): Promise<Module[]> => {
  const response = await apiClient.get<{ modules: Module[] }>(`/courses/${courseId}/modules`);
  return response.data.modules;
};

/**
 * Create a new module
 */
export const createModule = async (
  courseId: string,
  data: CreateModuleRequest
): Promise<Module> => {
  const response = await apiClient.post<{ module: Module }>(`/courses/${courseId}/modules`, data);
  return response.data.module;
};

/**
 * Update a module
 */
export const updateModule = async (
  moduleId: string,
  data: UpdateModuleRequest
): Promise<Module> => {
  const response = await apiClient.patch<{ module: Module }>(`/modules/${moduleId}`, data);
  return response.data.module;
};

/**
 * Delete a module
 */
export const deleteModule = async (moduleId: string): Promise<void> => {
  await apiClient.delete(`/modules/${moduleId}`);
};

/**
 * Reorder modules
 */
export const reorderModules = async (
  courseId: string,
  moduleOrders: { id: string; order: number }[]
): Promise<Module[]> => {
  const response = await apiClient.post<{ modules: Module[] }>(
    `/courses/${courseId}/modules/reorder`,
    { moduleOrders }
  );
  return response.data.modules;
};

/**
 * Create a new lesson
 */
export const createLesson = async (
  moduleId: string,
  data: CreateLessonRequest
): Promise<Lesson> => {
  const response = await apiClient.post<{ lesson: Lesson }>(`/modules/${moduleId}/lessons`, data);
  return response.data.lesson;
};

/**
 * Update a lesson
 */
export const updateLesson = async (
  lessonId: string,
  data: UpdateLessonRequest
): Promise<Lesson> => {
  const response = await apiClient.patch<{ lesson: Lesson }>(`/lessons/${lessonId}`, data);
  return response.data.lesson;
};

/**
 * Delete a lesson
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
  await apiClient.delete(`/lessons/${lessonId}`);
};

/**
 * Reorder lessons within a module
 */
export const reorderLessons = async (
  moduleId: string,
  lessonOrders: { id: string; order: number }[]
): Promise<Lesson[]> => {
  const response = await apiClient.post<{ lessons: Lesson[] }>(
    `/modules/${moduleId}/lessons/reorder`,
    { lessonOrders }
  );
  return response.data.lessons;
};

/**
 * Get AI analysis for a lesson
 */
export const getLessonAnalysis = async (lessonId: string): Promise<AIAnalysis | null> => {
  const response = await apiClient.get<{ lesson: { aiAnalysis: AIAnalysis | null } }>(
    `/lessons/${lessonId}/analysis`
  );
  return response.data.lesson.aiAnalysis;
};

/**
 * Trigger re-analysis of a lesson
 */
export const reanalyzeLesson = async (
  lessonId: string
): Promise<{ jobId: string; status: string }> => {
  const response = await apiClient.post<{ jobId: string; status: string }>(
    `/lessons/${lessonId}/reanalyze`
  );
  return response.data;
};
