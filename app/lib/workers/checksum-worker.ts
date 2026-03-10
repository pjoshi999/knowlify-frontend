import type { ChecksumRequest, ChecksumResponse } from "../types/video-upload";

/**
 * Web Worker for calculating SHA-256 checksums
 * This runs in a separate thread to avoid blocking the main UI thread
 */

// Listen for messages from the main thread
self.addEventListener("message", async (event: MessageEvent<ChecksumRequest>) => {
  const { type, data, chunkNumber } = event.data;

  if (type !== "calculate") {
    const errorResponse: ChecksumResponse = {
      type: "error",
      error: `Unknown message type: ${type}`,
      chunkNumber,
    };
    self.postMessage(errorResponse);
    return;
  }

  try {
    // Calculate SHA-256 checksum using Web Crypto API
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    // Convert ArrayBuffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const checksum = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");

    // Send result back to main thread
    const response: ChecksumResponse = {
      type: "result",
      checksum,
      chunkNumber,
    };
    self.postMessage(response);
  } catch (error) {
    // Send error back to main thread
    const errorResponse: ChecksumResponse = {
      type: "error",
      error: error instanceof Error ? error.message : "Unknown error occurred",
      chunkNumber,
    };
    self.postMessage(errorResponse);
  }
});

// Export empty object to make TypeScript happy with module
export {};
