import type { ChecksumRequest, ChecksumResponse } from "../types/video-upload";

/**
 * Service wrapper for checksum calculation using Web Worker
 * Provides a clean API for calculating SHA-256 checksums without blocking the UI
 */
export class ChecksumCalculator {
  private worker: Worker | null = null;
  private pendingCalculations = new Map<
    number | undefined,
    {
      resolve: (checksum: string) => void;
      reject: (error: Error) => void;
    }
  >();

  constructor() {
    this.initializeWorker();
  }

  /**
   * Initialize the Web Worker
   */
  private initializeWorker(): void {
    try {
      // Create worker from the checksum-worker.ts file
      this.worker = new Worker(new URL("../workers/checksum-worker.ts", import.meta.url), {
        type: "module",
      });

      // Listen for messages from the worker
      this.worker.addEventListener("message", this.handleWorkerMessage.bind(this));

      // Listen for worker errors
      this.worker.addEventListener("error", this.handleWorkerError.bind(this));
    } catch (error) {
      console.error("Failed to initialize checksum worker:", error);
      throw new Error("Failed to initialize checksum calculator");
    }
  }

  /**
   * Handle messages from the Web Worker
   */
  private handleWorkerMessage(event: MessageEvent<ChecksumResponse>): void {
    const { type, checksum, chunkNumber, error } = event.data;

    const pending = this.pendingCalculations.get(chunkNumber);
    if (!pending) {
      console.warn("Received response for unknown calculation:", chunkNumber);
      return;
    }

    // Remove from pending calculations
    this.pendingCalculations.delete(chunkNumber);

    if (type === "result" && checksum) {
      pending.resolve(checksum);
    } else if (type === "error") {
      pending.reject(new Error(error || "Checksum calculation failed"));
    }
  }

  /**
   * Handle worker errors
   */
  private handleWorkerError(error: ErrorEvent): void {
    console.error("Worker error:", error);

    // Reject all pending calculations
    this.pendingCalculations.forEach(({ reject }) => {
      reject(new Error("Worker error occurred"));
    });
    this.pendingCalculations.clear();
  }

  /**
   * Calculate SHA-256 checksum for a file or chunk
   * @param data - Blob or File to calculate checksum for
   * @param chunkNumber - Optional chunk number for tracking
   * @returns Promise that resolves to the hex-encoded checksum
   */
  async calculate(data: Blob, chunkNumber?: number): Promise<string> {
    if (!this.worker) {
      throw new Error("Worker not initialized");
    }

    // Convert Blob to ArrayBuffer
    const arrayBuffer = await data.arrayBuffer();

    // Create promise for this calculation
    return new Promise<string>((resolve, reject) => {
      // Store promise callbacks
      this.pendingCalculations.set(chunkNumber, { resolve, reject });

      // Send calculation request to worker
      const request: ChecksumRequest = {
        type: "calculate",
        data: arrayBuffer,
        chunkNumber,
      };

      this.worker!.postMessage(request);
    });
  }

  /**
   * Terminate the Web Worker and clean up resources
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending calculations
    this.pendingCalculations.forEach(({ reject }) => {
      reject(new Error("Calculator terminated"));
    });
    this.pendingCalculations.clear();
  }

  /**
   * Check if the calculator is ready to use
   */
  isReady(): boolean {
    return this.worker !== null;
  }
}

// Singleton instance for reuse across the application
let calculatorInstance: ChecksumCalculator | null = null;

/**
 * Get or create the singleton ChecksumCalculator instance
 */
export function getChecksumCalculator(): ChecksumCalculator {
  if (!calculatorInstance) {
    calculatorInstance = new ChecksumCalculator();
  }
  return calculatorInstance;
}

/**
 * Clean up the singleton instance
 */
export function cleanupChecksumCalculator(): void {
  if (calculatorInstance) {
    calculatorInstance.terminate();
    calculatorInstance = null;
  }
}
