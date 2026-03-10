/**
 * React Query hooks for modules and lessons
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getModules,
  createModule,
  updateModule,
  deleteModule,
  reorderModules,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
  getLessonAnalysis,
  reanalyzeLesson,
  type CreateModuleRequest,
  type UpdateModuleRequest,
  type CreateLessonRequest,
  type UpdateLessonRequest,
} from "../api/modules.api";

/**
 * Hook for fetching modules
 */
export const useModules = (courseId: string) => {
  return useQuery({
    queryKey: ["modules", courseId],
    queryFn: () => getModules(courseId),
    enabled: !!courseId,
  });
};

/**
 * Hook for creating module
 */
export const useCreateModule = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateModuleRequest) => createModule(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });
};

/**
 * Hook for updating module
 */
export const useUpdateModule = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: UpdateModuleRequest }) =>
      updateModule(moduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });
};

/**
 * Hook for deleting module
 */
export const useDeleteModule = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) => deleteModule(moduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });
};

/**
 * Hook for reordering modules
 */
export const useReorderModules = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleOrders: { id: string; order: number }[]) =>
      reorderModules(courseId, moduleOrders),
    onMutate: async (moduleOrders) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["modules", courseId] });

      // Snapshot previous value
      const previousModules = queryClient.getQueryData(["modules", courseId]);

      // Optimistically update
      queryClient.setQueryData(["modules", courseId], (old: any) => {
        if (!old) return old;
        const reordered = [...old];
        moduleOrders.forEach(({ id, order }) => {
          const index = reordered.findIndex((m) => m.id === id);
          if (index !== -1) {
            reordered[index] = { ...reordered[index], order };
          }
        });
        return reordered.sort((a, b) => a.order - b.order);
      });

      return { previousModules };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousModules) {
        queryClient.setQueryData(["modules", courseId], context.previousModules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });
};

/**
 * Hook for creating lesson
 */
export const useCreateLesson = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, data }: { moduleId: string; data: CreateLessonRequest }) =>
      createLesson(moduleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });
};

/**
 * Hook for updating lesson
 */
export const useUpdateLesson = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: string; data: UpdateLessonRequest }) =>
      updateLesson(lessonId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });
};

/**
 * Hook for deleting lesson
 */
export const useDeleteLesson = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => deleteLesson(lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });
};

/**
 * Hook for reordering lessons
 */
export const useReorderLessons = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      lessonOrders,
    }: {
      moduleId: string;
      lessonOrders: { id: string; order: number }[];
    }) => reorderLessons(moduleId, lessonOrders),
    onMutate: async ({ moduleId, lessonOrders }) => {
      await queryClient.cancelQueries({ queryKey: ["modules", courseId] });

      const previousModules = queryClient.getQueryData(["modules", courseId]);

      queryClient.setQueryData(["modules", courseId], (old: any) => {
        if (!old) return old;
        return old.map((module: any) => {
          if (module.id !== moduleId) return module;
          const reorderedLessons = [...module.lessons];
          lessonOrders.forEach(({ id, order }) => {
            const index = reorderedLessons.findIndex((l) => l.id === id);
            if (index !== -1) {
              reorderedLessons[index] = { ...reorderedLessons[index], order };
            }
          });
          return {
            ...module,
            lessons: reorderedLessons.sort((a, b) => a.order - b.order),
          };
        });
      });

      return { previousModules };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousModules) {
        queryClient.setQueryData(["modules", courseId], context.previousModules);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["modules", courseId] });
    },
  });
};

/**
 * Hook for fetching lesson analysis
 */
export const useLessonAnalysis = (lessonId: string) => {
  return useQuery({
    queryKey: ["lesson-analysis", lessonId],
    queryFn: () => getLessonAnalysis(lessonId),
    enabled: !!lessonId,
  });
};

/**
 * Hook for re-analyzing lesson
 */
export const useReanalyzeLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => reanalyzeLesson(lessonId),
    onSuccess: (_data, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["lesson-analysis", lessonId] });
    },
  });
};
