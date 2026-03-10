/**
 * Upload Draft Hook
 *
 * Custom hook for managing upload drafts in IndexedDB.
 * Provides auto-save, resume, and cleanup functionality.
 *
 * Validates: Requirements 17.8
 */

import { useState, useEffect, useCallback } from "react";
import { uploadDraftService } from "@/app/lib/db";
import type { UploadDraft } from "@/app/lib/db/schema";
import type { CourseMetadata } from "@/app/components/features/upload/MetadataForm";
import type { CourseOutline } from "@/app/lib/api/service-types";

interface UploadDraftData {
  sessionId: string;
  uploadedFiles: File[];
  courseOutline: CourseOutline | null;
  courseMetadata: CourseMetadata | null;
  uploadStep: string;
}

export function useUploadDraft(instructorId: string) {
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [existingDraft, setExistingDraft] = useState<UploadDraft | null>(null);

  const loadExistingDraft = useCallback(async () => {
    try {
      const drafts = await uploadDraftService.getByInstructorId(instructorId);
      if (drafts.length > 0) {
        // Get the most recent draft
        const latest = drafts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
        if (latest) {
          setExistingDraft(latest);
          setDraftId(latest.id);
        }
      }
    } catch (error) {
      console.error("Failed to load existing draft:", error);
    } finally {
      setIsLoading(false);
    }
  }, [instructorId]);

  // Load existing draft on mount
  useEffect(() => {
    loadExistingDraft();
  }, [loadExistingDraft]);

  const saveDraft = useCallback(
    async (data: UploadDraftData) => {
      try {
        const id = draftId || `draft-${Date.now()}`;

        // Convert File objects to serializable format
        const uploadedFilesData = data.uploadedFiles.map((file) => ({
          filename: file.name,
          path: (file as any).webkitRelativePath || file.name,
          size: file.size,
          type: file.type,
        }));

        const draft: Omit<UploadDraft, "createdAt" | "updatedAt"> & { id: string } = {
          id,
          instructorId,
          sessionId: data.sessionId,
          status: data.uploadStep as any,
          courseName: data.courseMetadata?.name || "",
          courseDescription: data.courseMetadata?.description || "",
          coursePrice: data.courseMetadata?.price || 0,
          category: data.courseMetadata?.category,
          thumbnailUrl: data.courseMetadata?.thumbnailUrl,
          uploadedFiles: uploadedFilesData,
          parsedStructure: data.courseOutline,
        };

        await uploadDraftService.upsert(draft);
        setDraftId(id);

        return id;
      } catch (error) {
        console.error("Failed to save draft:", error);
        throw error;
      }
    },
    [draftId, instructorId]
  );

  const deleteDraft = useCallback(async () => {
    if (draftId) {
      try {
        await uploadDraftService.delete(draftId);
        setDraftId(null);
        setExistingDraft(null);
      } catch (error) {
        console.error("Failed to delete draft:", error);
        throw error;
      }
    }
  }, [draftId]);

  const clearDraft = useCallback(() => {
    setDraftId(null);
    setExistingDraft(null);
  }, []);

  return {
    draftId,
    existingDraft,
    isLoading,
    saveDraft,
    deleteDraft,
    clearDraft,
  };
}
