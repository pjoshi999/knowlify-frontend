import Dexie, { type Table } from "dexie";
import type { UploadSessionState, SessionFilters } from "../types/video-upload";

/**
 * IndexedDB database for video upload sessions
 * Uses Dexie.js for a clean API over IndexedDB
 */
class UploadDatabase extends Dexie {
  sessions!: Table<UploadSessionState, string>;

  constructor() {
    super("VideoUploadDB");

    // Define database schema
    this.version(1).stores({
      sessions: "sessionId, instructorId, fileName, status, createdAt, updatedAt",
    });
  }
}

// Create database instance
const db = new UploadDatabase();

/**
 * SessionManager service for managing upload session persistence
 * Provides methods to save, retrieve, and manage upload sessions in IndexedDB
 */
export class SessionManager {
  /**
   * Save or update an upload session
   */
  static async saveSession(session: UploadSessionState): Promise<void> {
    try {
      await db.sessions.put({
        ...session,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to save session:", error);
      throw new Error("Failed to save upload session");
    }
  }

  /**
   * Get an upload session by ID
   */
  static async getSession(sessionId: string): Promise<UploadSessionState | null> {
    try {
      const session = await db.sessions.get(sessionId);
      return session || null;
    } catch (error) {
      console.error("Failed to get session:", error);
      throw new Error("Failed to retrieve upload session");
    }
  }

  /**
   * List upload sessions with optional filters
   */
  static async listSessions(
    instructorId: string,
    filters?: SessionFilters
  ): Promise<UploadSessionState[]> {
    try {
      let query = db.sessions.where("instructorId").equals(instructorId);

      // Apply status filter if provided
      if (filters?.status) {
        query = query.and((session) => session.status === filters.status);
      }

      // Get all matching sessions
      let sessions = await query.toArray();

      // Sort by updatedAt descending (most recent first)
      sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      // Apply pagination if provided
      if (filters?.page !== undefined && filters?.limit !== undefined) {
        const start = (filters.page - 1) * filters.limit;
        const end = start + filters.limit;
        sessions = sessions.slice(start, end);
      }

      return sessions;
    } catch (error) {
      console.error("Failed to list sessions:", error);
      throw new Error("Failed to list upload sessions");
    }
  }

  /**
   * Delete an upload session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      await db.sessions.delete(sessionId);
    } catch (error) {
      console.error("Failed to delete session:", error);
      throw new Error("Failed to delete upload session");
    }
  }

  /**
   * Find an incomplete upload session for a specific file
   * Used for resuming uploads after page refresh
   */
  static async findIncompleteSession(
    instructorId: string,
    fileName: string,
    fileSize: number
  ): Promise<UploadSessionState | null> {
    try {
      const session = await db.sessions
        .where("instructorId")
        .equals(instructorId)
        .and(
          (s) =>
            s.fileName === fileName &&
            s.fileSize === fileSize &&
            (s.status === "uploading" || s.status === "queued")
        )
        .first();

      return session || null;
    } catch (error) {
      console.error("Failed to find incomplete session:", error);
      throw new Error("Failed to find incomplete upload session");
    }
  }

  /**
   * Clean up old sessions (older than 7 days)
   * Returns the number of sessions deleted
   */
  static async cleanupOldSessions(): Promise<number> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoffDate = sevenDaysAgo.toISOString();

      const oldSessions = await db.sessions.where("updatedAt").below(cutoffDate).toArray();

      if (oldSessions.length > 0) {
        await db.sessions.bulkDelete(oldSessions.map((s) => s.sessionId));
      }

      return oldSessions.length;
    } catch (error) {
      console.error("Failed to cleanup old sessions:", error);
      throw new Error("Failed to cleanup old upload sessions");
    }
  }

  /**
   * Get total count of sessions for an instructor
   */
  static async getSessionCount(instructorId: string, status?: string): Promise<number> {
    try {
      let query = db.sessions.where("instructorId").equals(instructorId);

      if (status) {
        query = query.and((session) => session.status === status);
      }

      return await query.count();
    } catch (error) {
      console.error("Failed to get session count:", error);
      throw new Error("Failed to get session count");
    }
  }

  /**
   * Clear all sessions (useful for testing)
   */
  static async clearAllSessions(): Promise<void> {
    try {
      await db.sessions.clear();
    } catch (error) {
      console.error("Failed to clear sessions:", error);
      throw new Error("Failed to clear all sessions");
    }
  }
}

// Export database instance for advanced usage if needed
export { db as uploadDatabase };
