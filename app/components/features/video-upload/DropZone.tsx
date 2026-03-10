"use client";

import { useCallback, useState, useRef, type DragEvent, type ChangeEvent } from "react";

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  multiple?: boolean;
}

/**
 * DropZone component for drag-and-drop file selection
 * Supports both drag-and-drop and traditional file input
 */
export function DropZone({
  onFilesSelected,
  accept = "video/mp4,video/quicktime,video/x-msvideo",
  maxSize,
  disabled = false,
  multiple = false,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Prevent default drag behavior
   */
  const preventDefaults = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  /**
   * Handle drag enter
   */
  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      preventDefaults(e);
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled, preventDefaults]
  );

  /**
   * Handle drag over
   */
  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      preventDefaults(e);
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled, preventDefaults]
  );

  /**
   * Handle drag leave
   */
  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      preventDefaults(e);
      setIsDragOver(false);
    },
    [preventDefaults]
  );

  /**
   * Validate files
   */
  const validateFiles = useCallback(
    (files: File[]): { valid: boolean; error?: string } => {
      if (files.length === 0) {
        return { valid: false, error: "No files selected" };
      }

      if (!multiple && files.length > 1) {
        return { valid: false, error: "Please select only one file" };
      }

      // Validate file types
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const invalidFiles = files.filter((file) => !acceptedTypes.includes(file.type));

      if (invalidFiles.length > 0) {
        return {
          valid: false,
          error: `Invalid file type. Accepted types: ${acceptedTypes.join(", ")}`,
        };
      }

      // Validate file sizes
      if (maxSize) {
        const oversizedFiles = files.filter((file) => file.size > maxSize);
        if (oversizedFiles.length > 0) {
          return {
            valid: false,
            error: `File size exceeds maximum of ${formatBytes(maxSize)}`,
          };
        }
      }

      return { valid: true };
    },
    [accept, maxSize, multiple]
  );

  /**
   * Handle file drop
   */
  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      preventDefaults(e);
      setIsDragOver(false);
      setError(null);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      const validation = validateFiles(files);

      if (!validation.valid) {
        setError(validation.error || "Invalid files");
        return;
      }

      onFilesSelected(files);
    },
    [disabled, preventDefaults, validateFiles, onFilesSelected]
  );

  /**
   * Handle file input change
   */
  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setError(null);

      if (!e.target.files || e.target.files.length === 0) return;

      const files = Array.from(e.target.files);
      const validation = validateFiles(files);

      if (!validation.valid) {
        setError(validation.error || "Invalid files");
        return;
      }

      onFilesSelected(files);
    },
    [validateFiles, onFilesSelected]
  );

  /**
   * Handle click to open file dialog
   */
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Drop zone for video file upload"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="File input for video upload"
        />

        <div className="flex flex-col items-center gap-4">
          {/* Upload icon */}
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          {/* Text */}
          <div>
            <p className="text-lg font-medium text-gray-700">
              {isDragOver ? "Drop your video file here" : "Drag and drop your video file here"}
            </p>
            <p className="text-sm text-gray-500 mt-1">or</p>
            <p className="text-sm text-blue-600 font-medium mt-1">Browse files</p>
          </div>

          {/* Accepted formats */}
          <p className="text-xs text-gray-500">
            Accepted formats: MP4, MOV, AVI
            {maxSize && ` • Max size: ${formatBytes(maxSize)}`}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md"
          role="alert"
          aria-live="polite"
        >
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
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
