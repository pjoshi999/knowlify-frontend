import { useCallback } from "react";
import { SessionManager } from "../services/session-manager";
import type { UploadSessionState, SessionFilters } from "../types/video-upload";

interface UseUploadSessionReturn {
  saveSession: (session: UploadSessionState) => Promise<void>;
  getSession: (sessionId: string) => Promise<UploadSessionState | null>;
  listSessions: (instructorId: string, filters?: SessionFilters) => Promise<UploadSessionState[]>;
  deleteSession: (sessionId: string) => Promise<void>;
  findIncompleteSession: (
    instructorId: string,
    fileName: string,
    fileSize: number
  ) => Promise<UploadSessionState | null>;
  cleanupOldSessions: () => Promise<number>;
}

/**
 * Hook for managing upload session persistence in IndexedDB
 * Provides methods to save, retrieve, and manage upload sessions
 */
export function useUploadSession(): UseUploadSessionReturn {
  /**
   * Save or update an upload session
   */
  const saveSession = useCallback(async (session: UploadSessionState): Promise<void> => {
    try {
      await SessionManager.saveSession(session);
    } catch (error) {
      console.error("Failed to save session:", error);
      throw error;
    }
  }, []);

  /**
   * Get an upload session by ID
   */
  const getSession = useCallback(async (sessionId: string): Promise<UploadSessionState | null> => {
    try {
      return await SessionManager.getSession(sessionId);
    } catch (error) {
      console.error("Failed to get session:", error);
      throw error;
    }
  }, []);

  /**
   * List upload sessions with optional filters
   */
  const listSessions = useCallback(
    async (instructorId: string, filters?: SessionFilters): Promise<UploadSessionState[]> => {
      try {
        return await SessionManager.listSessions(instructorId, filters);
      } catch (error) {
        console.error("Failed to list sessions:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Delete an upload session
   */
  const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
    try {
      await SessionManager.deleteSession(sessionId);
    } catch (error) {
      console.error("Failed to delete session:", error);
      throw error;
    }
  }, []);

  /**
   * Find an incomplete upload session for a specific file
   * Used for resuming uploads after page refresh
   */
  const findIncompleteSession = useCallback(
    async (
      instructorId: string,
      fileName: string,
      fileSize: number
    ): Promise<UploadSessionState | null> => {
      try {
        return await SessionManager.findIncompleteSession(instructorId, fileName, fileSize);
      } catch (error) {
        console.error("Failed to find incomplete session:", error);
        throw error;
      }
    },
    []
  );

  /**
   * Clean up old sessions (older than 7 days)
   */
  const cleanupOldSessions = useCallback(async (): Promise<number> => {
    try {
      return await SessionManager.cleanupOldSessions();
    } catch (error) {
      console.error("Failed to cleanup old sessions:", error);
      throw error;
    }
  }, []);

  return {
    saveSession,
    getSession,
    listSessions,
    deleteSession,
    findIncompleteSession,
    cleanupOldSessions,
  };
}
