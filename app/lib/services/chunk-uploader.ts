import axios from "axios";

/**
 * ChunkUploader service for uploading file chunks directly to S3
 * Handles chunking, uploading, retry logic, and ETag extraction
 */
export class ChunkUploader {
  /**
   * Upload a single chunk to S3 using a pre-signed URL
   * @param chunk - The chunk data to upload
   * @param preSignedUrl - Pre-signed S3 URL
   * @param mimeType - MIME type of the video file
   * @param onProgress - Optional callback for upload progress
   * @returns The ETag from S3 response
   */
  static async uploadChunk(
    chunk: Blob,
    preSignedUrl: string,
    mimeType: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<string> {
    try {
      const response = await axios.put(preSignedUrl, chunk, {
        headers: {
          "Content-Type": mimeType,
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            onProgress(progressEvent.loaded, progressEvent.total);
          }
        },
        // Don't include default axios headers that might interfere with S3
        transformRequest: [(data) => data],
      });

      // Extract ETag from response headers
      const etag = response.headers["etag"] || response.headers["ETag"];
      if (!etag) {
        throw new Error("No ETag received from S3");
      }

      // Remove quotes from ETag if present
      // S3 returns ETags with quotes, but we store them without quotes
      // The backend will add quotes back when completing the multipart upload
      let cleanEtag = etag.trim();
      if (cleanEtag.startsWith('"') && cleanEtag.endsWith('"')) {
        cleanEtag = cleanEtag.slice(1, -1);
      }

      console.log("[ChunkUploader] Received ETag from S3:", {
        raw: etag,
        cleaned: cleanEtag,
        length: cleanEtag.length,
      });

      return cleanEtag;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;

        // Handle specific S3 errors
        if (status === 403) {
          throw new Error("S3_URL_EXPIRED");
        } else if (status === 400) {
          throw new Error("S3_BAD_REQUEST");
        } else if (status && status >= 500) {
          throw new Error("S3_SERVER_ERROR");
        }
      }

      throw error;
    }
  }

  /**
   * Upload a chunk with automatic retry logic
   * @param chunk - The chunk data to upload
   * @param preSignedUrl - Pre-signed S3 URL
   * @param mimeType - MIME type of the video file
   * @param maxRetries - Maximum number of retry attempts (default: 3)
   * @param onProgress - Optional callback for upload progress
   * @returns The ETag from S3 response
   */
  static async uploadChunkWithRetry(
    chunk: Blob,
    preSignedUrl: string,
    mimeType: string,
    maxRetries: number = 3,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadChunk(chunk, preSignedUrl, mimeType, onProgress);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        // Don't retry if URL expired (needs refresh)
        if (lastError.message === "S3_URL_EXPIRED") {
          throw lastError;
        }

        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          break;
        }

        // Calculate exponential backoff delay: 2s, 4s, 8s
        const delay = Math.pow(2, attempt + 1) * 1000;
        console.log(
          `Chunk upload failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    throw lastError || new Error("Chunk upload failed after retries");
  }

  /**
   * Split a file into chunks
   * @param file - The file to split
   * @param chunkSize - Size of each chunk in bytes
   * @returns Array of Blob chunks
   */
  static splitFile(file: File | Blob, chunkSize: number): Blob[] {
    const chunks: Blob[] = [];
    let offset = 0;

    while (offset < file.size) {
      const end = Math.min(offset + chunkSize, file.size);
      const chunk = file.slice(offset, end);
      chunks.push(chunk);
      offset = end;
    }

    return chunks;
  }

  /**
   * Read a specific chunk from a file on-demand
   * This avoids loading the entire file into memory
   * @param file - The file to read from
   * @param start - Start byte position
   * @param end - End byte position
   * @returns The chunk as a Blob
   */
  static readChunk(file: File | Blob, start: number, end: number): Blob {
    return file.slice(start, end);
  }

  /**
   * Calculate the number of chunks for a given file size
   * @param fileSize - Size of the file in bytes
   * @param chunkSize - Size of each chunk in bytes
   * @returns Total number of chunks
   */
  static calculateTotalChunks(fileSize: number, chunkSize: number): number {
    return Math.ceil(fileSize / chunkSize);
  }

  /**
   * Get chunk boundaries for a specific chunk number
   * @param chunkNumber - The chunk number (1-indexed)
   * @param chunkSize - Size of each chunk in bytes
   * @param fileSize - Total file size in bytes
   * @returns Object with start and end byte positions
   */
  static getChunkBoundaries(
    chunkNumber: number,
    chunkSize: number,
    fileSize: number
  ): { start: number; end: number; size: number } {
    const start = (chunkNumber - 1) * chunkSize;
    const end = Math.min(start + chunkSize, fileSize);
    const size = end - start;

    return { start, end, size };
  }

  /**
   * Validate chunk number is within valid range
   * @param chunkNumber - The chunk number to validate
   * @param totalChunks - Total number of chunks
   * @returns True if valid, false otherwise
   */
  static isValidChunkNumber(chunkNumber: number, totalChunks: number): boolean {
    return chunkNumber >= 1 && chunkNumber <= totalChunks;
  }
}
