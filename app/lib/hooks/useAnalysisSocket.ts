/**
 * React Hook for WebSocket Analysis Progress
 *
 * Manages WebSocket connection lifecycle and provides real-time updates
 */

import { useEffect, useState, useCallback } from "react";
import {
  analysisSocket,
  AnalysisProgressEvent,
  CourseProgressEvent,
} from "../websocket/analysis-socket";

interface UseAnalysisSocketOptions {
  url?: string;
  token?: string;
  autoConnect?: boolean;
}

interface UseAnalysisSocketReturn {
  isConnected: boolean;
  analysisProgress: Map<string, AnalysisProgressEvent>;
  courseProgress: Map<string, CourseProgressEvent>;
  joinCourse: (courseId: string) => void;
  leaveCourse: (courseId: string) => void;
  connect: () => void;
  disconnect: () => void;
}

/**
 * Hook to manage WebSocket connection for analysis progress updates
 */
export const useAnalysisSocket = (
  options: UseAnalysisSocketOptions = {}
): UseAnalysisSocketReturn => {
  const {
    url = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001",
    token,
    autoConnect = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<Map<string, AnalysisProgressEvent>>(
    new Map()
  );
  const [courseProgress, setCourseProgress] = useState<Map<string, CourseProgressEvent>>(new Map());

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!analysisSocket.isConnected()) {
      analysisSocket.connect(url, token);
    }
  }, [url, token]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    analysisSocket.disconnect();
  }, []);

  // Join course room
  const joinCourse = useCallback((courseId: string) => {
    if (analysisSocket.isConnected()) {
      analysisSocket.joinCourseRoom(courseId);
    }
  }, []);

  // Leave course room
  const leaveCourse = useCallback((courseId: string) => {
    if (analysisSocket.isConnected()) {
      analysisSocket.leaveCourseRoom(courseId);
    }
  }, []);

  useEffect(() => {
    // Auto-connect if enabled
    if (autoConnect) {
      connect();
    }

    // Subscribe to connection events
    const unsubscribeConnect = analysisSocket.onConnect(() => {
      setIsConnected(true);
    });

    const unsubscribeDisconnect = analysisSocket.onDisconnect(() => {
      setIsConnected(false);
    });

    // Subscribe to analysis progress
    const unsubscribeAnalysisProgress = analysisSocket.onAnalysisProgress(
      (event: AnalysisProgressEvent) => {
        setAnalysisProgress((prev) => {
          const next = new Map(prev);
          next.set(event.lessonId, event);
          return next;
        });
      }
    );

    // Subscribe to course progress
    const unsubscribeCourseProgress = analysisSocket.onCourseProgress(
      (event: CourseProgressEvent) => {
        setCourseProgress((prev) => {
          const next = new Map(prev);
          next.set(event.courseId, event);
          return next;
        });
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribeConnect();
      unsubscribeDisconnect();
      unsubscribeAnalysisProgress();
      unsubscribeCourseProgress();

      if (autoConnect) {
        disconnect();
      }
    };
  }, [autoConnect, connect, disconnect]);

  return {
    isConnected,
    analysisProgress,
    courseProgress,
    joinCourse,
    leaveCourse,
    connect,
    disconnect,
  };
};

/**
 * Hook to track analysis progress for a specific lesson
 */
export const useLessonAnalysisProgress = (lessonId: string) => {
  const { analysisProgress, isConnected } = useAnalysisSocket();

  return {
    progress: analysisProgress.get(lessonId),
    isConnected,
  };
};

/**
 * Hook to track analysis progress for a specific course
 */
export const useCourseAnalysisProgress = (courseId: string) => {
  const { courseProgress, isConnected, joinCourse, leaveCourse } = useAnalysisSocket();

  useEffect(() => {
    if (isConnected && courseId) {
      joinCourse(courseId);
    }

    return () => {
      if (courseId) {
        leaveCourse(courseId);
      }
    };
  }, [courseId, isConnected, joinCourse, leaveCourse]);

  return {
    progress: courseProgress.get(courseId),
    isConnected,
  };
};
