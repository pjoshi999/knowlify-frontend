/**
 * WebSocket Client for Real-Time Analysis Progress
 *
 * Manages Socket.IO connection for receiving analysis job updates
 */

import { io, Socket } from "socket.io-client";

export interface AnalysisProgressEvent {
  jobId: string;
  lessonId: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  error?: string;
}

export interface CourseProgressEvent {
  courseId: string;
  completedJobs: number;
  totalJobs: number;
  progress: number; // 0-100
}

type AnalysisProgressCallback = (event: AnalysisProgressEvent) => void;
type CourseProgressCallback = (event: CourseProgressEvent) => void;
type ConnectionCallback = () => void;
type ErrorCallback = (error: Error) => void;

class AnalysisSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Connect to WebSocket server
   */
  connect(url: string, token?: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(url, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ["websocket", "polling"],
    });

    this.socket.on("connect", () => {
      console.log("[AnalysisSocket] Connected");
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
    });

    this.socket.on("disconnect", (reason: string) => {
      console.log("[AnalysisSocket] Disconnected:", reason);
    });

    this.socket.on("connect_error", (error: Error) => {
      console.error("[AnalysisSocket] Connection error:", error);
      this.reconnectAttempts++;

      // Exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Subscribe to analysis progress updates for a specific lesson
   */
  onAnalysisProgress(callback: AnalysisProgressCallback): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected. Call connect() first.");
    }

    this.socket.on("analysis:progress", callback);

    // Return unsubscribe function
    return () => {
      this.socket?.off("analysis:progress", callback);
    };
  }

  /**
   * Subscribe to course-level progress updates
   */
  onCourseProgress(callback: CourseProgressCallback): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected. Call connect() first.");
    }

    this.socket.on("course:progress", callback);

    // Return unsubscribe function
    return () => {
      this.socket?.off("course:progress", callback);
    };
  }

  /**
   * Subscribe to connection events
   */
  onConnect(callback: ConnectionCallback): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected. Call connect() first.");
    }

    this.socket.on("connect", callback);

    return () => {
      this.socket?.off("connect", callback);
    };
  }

  /**
   * Subscribe to disconnection events
   */
  onDisconnect(callback: ConnectionCallback): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected. Call connect() first.");
    }

    this.socket.on("disconnect", callback);

    return () => {
      this.socket?.off("disconnect", callback);
    };
  }

  /**
   * Subscribe to error events
   */
  onError(callback: ErrorCallback): () => void {
    if (!this.socket) {
      throw new Error("Socket not connected. Call connect() first.");
    }

    this.socket.on("error", callback);

    return () => {
      this.socket?.off("error", callback);
    };
  }

  /**
   * Join a room to receive updates for a specific course
   */
  joinCourseRoom(courseId: string): void {
    if (!this.socket) {
      throw new Error("Socket not connected. Call connect() first.");
    }

    this.socket.emit("join:course", { courseId });
  }

  /**
   * Leave a course room
   */
  leaveCourseRoom(courseId: string): void {
    if (!this.socket) {
      throw new Error("Socket not connected. Call connect() first.");
    }

    this.socket.emit("leave:course", { courseId });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Export singleton instance
export const analysisSocket = new AnalysisSocketClient();
