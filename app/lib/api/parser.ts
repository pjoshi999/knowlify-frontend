/**
 * Course Parser API Service
 *
 * Service layer for parsing uploaded course files and extracting structure
 */

import apiClient from "./client";
import { unwrapApiData } from "./client";
import type {
  ParseCourseResponse,
  CreateUploadSessionResponse,
  ChatMessageResponse,
} from "./service-types";

/**
 * Create a new upload session
 */
export async function createUploadSession(): Promise<CreateUploadSessionResponse> {
  const response = await apiClient.post("/chat/sessions");
  const payload = unwrapApiData<any>(response.data);
  return { sessionId: String(payload?.id) };
}

/**
 * Upload files to a session
 */
export async function uploadFiles(
  sessionId: string,
  files: File[]
): Promise<{
  uploadedFiles: string[];
  errors: string[];
  fileCount?: number;
  analysis?: any;
}> {
  const zipFile = files.find(
    (file) =>
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed" ||
      file.name.toLowerCase().endsWith(".zip")
  );

  if (!zipFile) {
    throw new Error("Please upload your course folder as a ZIP file.");
  }

  console.log("[API] Uploading ZIP file:", zipFile.name, zipFile.size);

  const formData = new FormData();
  formData.append("file", zipFile);

  const response = await apiClient.post(`/chat/sessions/${sessionId}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  const data = unwrapApiData<any>(response.data);
  console.log("[API] Upload response:", data);

  return {
    uploadedFiles: [zipFile.name],
    errors: [],
    fileCount: data?.fileCount,
    analysis: data?.analysis,
  };
}

/**
 * Parse uploaded course files
 */
export async function parseCourse(sessionId: string): Promise<ParseCourseResponse> {
  void sessionId;
  return {
    outline: {
      sections: [],
      totalAssets: 0,
    },
    errors: [],
    status: "success",
  };
}

/**
 * Send a chat message to the AI assistant
 */
export async function sendChatMessage(
  sessionId: string,
  message: string
): Promise<ChatMessageResponse> {
  const response = await apiClient.post(`/chat/sessions/${sessionId}/messages`, {
    content: message,
  });
  const payload = unwrapApiData<any>(response.data);
  return {
    response: String(payload?.content || ""),
  };
}

/**
 * Generate and publish a course from uploaded files and metadata
 * The finalize endpoint now handles everything: asset upload, course creation, and manifest
 */
export async function generateCourse(
  sessionId: string,
  metadata: {
    name: string;
    description: string;
    price: number;
    category?: string;
    thumbnailUrl?: string;
    thumbnailFile?: File;
  }
): Promise<{ courseId: string; shareableLink: string }> {
  console.log("[API] generateCourse called with:", { sessionId, metadata });

  let thumbnailUrl = metadata.thumbnailUrl;

  // Upload thumbnail if file is provided
  if (metadata.thumbnailFile) {
    console.log("[API] Uploading thumbnail file...");
    const formData = new FormData();
    formData.append("thumbnail", metadata.thumbnailFile);

    try {
      const uploadResponse = await apiClient.post(
        `/chat/sessions/${sessionId}/thumbnail`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      const uploadData = unwrapApiData<any>(uploadResponse.data);
      thumbnailUrl = uploadData?.url || uploadData?.thumbnailUrl || thumbnailUrl;
      console.log("[API] Thumbnail uploaded:", thumbnailUrl);
    } catch (error) {
      console.error("[API] Thumbnail upload failed:", error);
      // Continue without thumbnail - don't block course creation
    }
  }

  // Finalize course - this now handles EVERYTHING:
  // 1. Creates course record
  // 2. Uploads all assets to S3
  // 3. Inserts assets into course_assets table
  // 4. Builds manifest with S3 URLs
  // 5. Updates course with manifest
  console.log("[API] Finalizing course (uploads assets, creates course, builds manifest)...");
  const finalizeResponse = await apiClient.post(`/chat/sessions/${sessionId}/finalize`, {
    courseName: metadata.name,
    courseDescription: metadata.description,
    courseCategory: metadata.category || "General",
    coursePrice: metadata.price, // Send price in dollars, backend will convert to cents
    thumbnailUrl: thumbnailUrl,
  });
  const finalizeData = unwrapApiData<any>(finalizeResponse.data);
  console.log("[API] Course finalized:", finalizeData);

  const { courseId, shareableLink } = finalizeData;

  // Publish immediately so it appears in marketplace
  console.log("[API] Publishing course...");
  await apiClient.post(`/courses/${courseId}/publish`);
  console.log("[API] Course published");

  return {
    courseId: String(courseId),
    shareableLink: shareableLink || `/courses/${courseId}`,
  };
}
