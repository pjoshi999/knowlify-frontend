/**
 * Video utility functions
 */

/**
 * Format seconds into MM:SS or HH:MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted timestamp string
 */
export function formatTimestamp(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Parse timestamp string (MM:SS or HH:MM:SS) into seconds
 * @param timestamp - Formatted timestamp string
 * @returns Time in seconds
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(":").map(Number);

  if (parts.length === 2) {
    // MM:SS
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  } else if (parts.length === 3) {
    // HH:MM:SS
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }

  return 0;
}
