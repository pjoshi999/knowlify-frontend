import apiClient, { unwrapApiData } from "./client";
import type {
  UploadSession,
  InitiateUploadParams,
  ChunkUploadResult,
  UploadProgress,
  SessionFilters,
} from "../types/video-upload";

/**
 * VideoUploadAPI service for communicating with the backend video upload API
 * Handles all HTTP requests related to video uploads
 *
 * Uses the centralized apiClient which provides:
 * - Automatic authentication token injection
 * - Request/response interceptors
 * - Retry logic with exponential backoff
 * - Error handling with monitoring
 */
export class VideoUploadAPI {
  /**
   * Initiate a new video upload session
   */
  static async initiateUpload(params: InitiateUploadParams): Promise<UploadSession> {
    const response = await apiClient.post("/video-uploads/initiate", params);
    return unwrapApiData<UploadSession>(response.data);
  }

  /**
   * Report that a chunk has been successfully uploaded to S3
   */
  static async reportChunkComplete(
    sessionId: string,
    chunkNumber: number,
    etag: string,
    checksum: string
  ): Promise<ChunkUploadResult> {
    const response = await apiClient.post(`/video-uploads/${sessionId}/chunks/${chunkNumber}`, {
      etag,
      checksum,
    });
    return unwrapApiData<ChunkUploadResult>(response.data);
  }

  /**
   * Refresh a pre-signed URL for a specific chunk
   * Used when the URL expires during upload
   */
  static async refreshUrl(sessionId: string, chunkNumber: number): Promise<string> {
    const response = await apiClient.post<{ uploadUrl: string }>(
      `/video-uploads/${sessionId}/refresh-url`,
      { chunkNumber }
    );
    const data = unwrapApiData<{ uploadUrl: string }>(response.data);
    return data.uploadUrl;
  }

  /**
   * Cancel an ongoing upload session
   */
  static async cancelUpload(sessionId: string): Promise<void> {
    await apiClient.delete(`/video-uploads/${sessionId}`);
  }

  /**
   * Get the current status of an upload session
   */
  static async getUploadStatus(sessionId: string): Promise<UploadProgress> {
    const response = await apiClient.get(`/video-uploads/${sessionId}/progress`);
    return unwrapApiData<UploadProgress>(response.data);
  }

  /**
   * List upload sessions for an instructor
   */
  static async listSessions(
    instructorId: string,
    filters?: SessionFilters
  ): Promise<{ sessions: UploadSession[]; total: number; page: number; totalPages: number }> {
    const params: Record<string, string | number> = {
      instructorId,
    };

    if (filters?.status) {
      params.status = filters.status;
    }
    if (filters?.page !== undefined) {
      params.page = filters.page;
    }
    if (filters?.limit !== undefined) {
      params.limit = filters.limit;
    }

    const response = await apiClient.get("/video-uploads", { params });
    return unwrapApiData<{
      sessions: UploadSession[];
      total: number;
      page: number;
      totalPages: number;
    }>(response.data);
  }
}
