/**
 * Calculate upload completion percentage
 */
export function calculatePercentage(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100 * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate upload speed using moving average
 * @param bytesUploaded - Total bytes uploaded in the current measurement
 * @param timeElapsed - Time elapsed in seconds
 * @param previousSpeeds - Array of previous speed measurements (max 10)
 * @returns Average speed in bytes per second
 */
export function calculateSpeed(
  bytesUploaded: number,
  timeElapsed: number,
  previousSpeeds: number[] = []
): number {
  if (timeElapsed === 0) return 0;

  const currentSpeed = bytesUploaded / timeElapsed;

  // Add current speed to the array
  const speeds = [...previousSpeeds, currentSpeed];

  // Keep only the last 10 measurements for moving average
  const recentSpeeds = speeds.slice(-10);

  // Calculate moving average
  const sum = recentSpeeds.reduce((acc, speed) => acc + speed, 0);
  return sum / recentSpeeds.length;
}

/**
 * Calculate estimated time remaining
 * @param remainingBytes - Bytes remaining to upload
 * @param averageSpeed - Average upload speed in bytes per second
 * @returns Estimated time remaining in seconds
 */
export function calculateETA(remainingBytes: number, averageSpeed: number): number {
  if (averageSpeed === 0) return 0;
  return Math.ceil(remainingBytes / averageSpeed);
}

/**
 * Format time remaining in human-readable format
 * @param seconds - Time in seconds
 * @returns Formatted string (e.g., "2m 30s", "1h 15m", "45s")
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds === 0) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0) {
    parts.push(`${minutes}m`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs}s`);
  }

  return parts.join(" ");
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 GB", "250 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Convert bytes per second to megabytes per second
 */
export function bytesToMBps(bytesPerSecond: number): number {
  return Math.round((bytesPerSecond / (1024 * 1024)) * 100) / 100;
}
