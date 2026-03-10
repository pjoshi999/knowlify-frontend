import type { ValidationOptions, ValidationResult } from "../types/video-upload";

// Allowed video MIME types
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo"] as const;

// File size constraints
const MIN_FILE_SIZE = 1024; // 1KB
const MAX_FILE_SIZE = 50 * 1024 * 1024 * 1024; // 50GB

// File name validation regex (alphanumeric, hyphens, underscores, dots)
const FILE_NAME_REGEX = /^[a-zA-Z0-9._-]+$/;

/**
 * Validate file type against allowed video MIME types
 */
export function validateFileType(
  file: File,
  acceptedTypes: string[] = ALLOWED_VIDEO_TYPES as unknown as string[]
): boolean {
  return acceptedTypes.includes(file.type);
}

/**
 * Validate file size is within allowed range
 */
export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size >= MIN_FILE_SIZE && file.size <= maxSize;
}

/**
 * Sanitize file name by replacing invalid characters
 */
export function sanitizeFileName(fileName: string): string {
  // Replace spaces with hyphens
  // Remove any characters that aren't alphanumeric, hyphens, underscores, or dots
  return fileName
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-zA-Z0-9._-]/g, "") // Remove invalid characters
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Validate file name contains only allowed characters
 */
export function validateFileName(fileName: string): boolean {
  return FILE_NAME_REGEX.test(fileName);
}

/**
 * Comprehensive video file validation
 * Returns validation result with specific error messages
 */
export function validateVideoFile(file: File, options?: ValidationOptions): ValidationResult {
  const errors: string[] = [];
  const maxSize = options?.maxSize ?? MAX_FILE_SIZE;
  const acceptedTypes = options?.acceptedTypes ?? (ALLOWED_VIDEO_TYPES as unknown as string[]);

  // Validate file type
  if (!validateFileType(file, acceptedTypes)) {
    errors.push(`Invalid file type: ${file.type}. Allowed types: ${acceptedTypes.join(", ")}`);
  }

  // Validate file size
  if (file.size < MIN_FILE_SIZE) {
    errors.push(`File size is too small (minimum ${formatBytes(MIN_FILE_SIZE)})`);
  } else if (file.size > maxSize) {
    errors.push(`File size exceeds maximum of ${formatBytes(maxSize)}`);
  }

  // Validate file name
  if (!validateFileName(file.name)) {
    errors.push(
      "Invalid file name. Use only alphanumeric characters, hyphens, underscores, and dots."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

// Export constants for testing
export { ALLOWED_VIDEO_TYPES, MIN_FILE_SIZE, MAX_FILE_SIZE, FILE_NAME_REGEX };
