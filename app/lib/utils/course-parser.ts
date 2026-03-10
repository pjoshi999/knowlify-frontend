/**
 * Client-Side Course Parser Utility
 *
 * Analyzes uploaded files and extracts course structure locally
 * before sending to the server for final processing.
 *
 * Validates: Requirements 4.3, 4.4, 4.5, 4.6, 4.7, 21.1, 21.2
 */

import type {
  CourseAsset,
  ParsedSection,
  CourseOutline,
  ParseError,
  AssetType,
} from "../api/service-types";

const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm"];
const DOCUMENT_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];
const QUIZ_EXTENSIONS = [".json"];
const EXAM_EXTENSIONS = [".json"];

/**
 * Determine asset type from file extension
 */
function getAssetType(filename: string): AssetType | null {
  const ext = "." + filename.split(".").pop()?.toLowerCase();

  if (VIDEO_EXTENSIONS.includes(ext)) return "video";
  if (DOCUMENT_EXTENSIONS.includes(ext)) return "document";
  if (filename.toLowerCase().includes("quiz") && QUIZ_EXTENSIONS.includes(ext)) return "quiz";
  if (filename.toLowerCase().includes("exam") && EXAM_EXTENSIONS.includes(ext)) return "exam";

  return null;
}

/**
 * Extract section name from file path
 */
function extractSectionName(path: string): string {
  const parts = path.split("/");
  if (parts.length > 1) {
    // Use the parent folder name as section name
    return parts[parts.length - 2] || "Main Content";
  }
  return "Main Content";
}

/**
 * Parse uploaded files and generate course structure
 */
export async function parseUploadedFiles(files: File[]): Promise<{
  outline: CourseOutline;
  errors: ParseError[];
}> {
  const errors: ParseError[] = [];
  const sectionsMap = new Map<string, ParsedSection>();
  let totalDuration = 0;

  // Process each file
  for (const file of files) {
    const assetType = getAssetType(file.name);

    if (!assetType) {
      errors.push({
        filename: file.name,
        error: "Unsupported file type",
        type: "unsupported",
      });
      continue;
    }

    // Extract section from file path
    const path = (file as any).webkitRelativePath || file.name;
    const sectionName = extractSectionName(path);

    // Get or create section
    if (!sectionsMap.has(sectionName)) {
      sectionsMap.set(sectionName, {
        title: sectionName,
        orderIndex: sectionsMap.size,
        assets: [],
      });
    }

    const section = sectionsMap.get(sectionName)!;

    // Create asset
    const asset: CourseAsset = {
      id: `${Date.now()}-${Math.random()}`,
      type: assetType,
      filename: file.name,
      path,
      size: file.size,
      metadata: {
        mimeType: file.type,
      },
    };

    // Try to extract video duration (if video)
    if (assetType === "video") {
      try {
        const duration = await getVideoDuration(file);
        asset.metadata.duration = duration;
        totalDuration += duration;
      } catch {
        // Duration extraction failed, continue without it
      }
    }

    section.assets.push(asset);
  }

  // Convert sections map to array
  const sections = Array.from(sectionsMap.values()).sort((a, b) => a.orderIndex - b.orderIndex);

  const outline: CourseOutline = {
    sections,
    totalAssets: files.length - errors.length,
    totalDuration: totalDuration > 0 ? totalDuration : undefined,
  };

  return { outline, errors };
}

/**
 * Get video duration from file
 */
function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };

    video.onerror = () => {
      reject(new Error("Failed to load video metadata"));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

/**
 * Validate course structure
 */
export function validateCourseStructure(outline: CourseOutline): ParseError[] {
  const errors: ParseError[] = [];

  // Check if there are any sections
  if (outline.sections.length === 0) {
    errors.push({
      filename: "",
      error: "No valid sections found in uploaded files",
      type: "validation",
    });
  }

  // Check if each section has at least one asset
  outline.sections.forEach((section) => {
    if (section.assets.length === 0) {
      errors.push({
        filename: section.title,
        error: `Section "${section.title}" has no valid assets`,
        type: "validation",
      });
    }
  });

  return errors;
}
