"use client";

/**
 * FileUploadZone Component
 *
 * Drag-and-drop file upload zone with file browser button.
 * Supports folder upload and displays upload progress.
 *
 * Validates: Requirements 4.2, 24.23, 24.24
 */

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Button } from "@/app/components/ui/button";

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
}

interface FileWithProgress {
  file: File;
  progress: number;
  error?: string;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB (matches backend limit)

export function FileUploadZone({
  onFilesSelected,
  onUploadProgress: _onUploadProgress,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`;
    }

    // Check if it's a ZIP file
    const isZip =
      file.name.toLowerCase().endsWith(".zip") ||
      file.type === "application/zip" ||
      file.type === "application/x-zip-compressed";
    if (!isZip) {
      return `Please upload a ZIP file containing your course materials`;
    }

    return null;
  };

  const processFiles = (fileList: FileList | File[]) => {
    const filesArray = Array.from(fileList);

    // Only allow one ZIP file at a time
    if (filesArray.length > 1) {
      alert("Please upload only one ZIP file at a time");
      return;
    }

    const processedFiles: FileWithProgress[] = filesArray.map((file) => ({
      file,
      progress: 0,
      error: validateFile(file) || undefined,
    }));

    // Replace existing files (only one ZIP allowed)
    setFiles(processedFiles);

    // Notify parent of valid files
    const validFiles = processedFiles.filter((f) => !f.error).map((f) => f.file);

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
  };

  const handleBrowseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-white bg-gray-900" : "border-border hover:border-gray-400"
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          {/* Upload Icon */}
          <svg
            className="w-12 h-12 text-foreground-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div>
            <p className="text-foreground mb-2">Drag and drop your course ZIP file here</p>
            <p className="text-sm text-foreground-secondary mb-2">
              Your ZIP file should contain all course materials organized in folders
            </p>
            <p className="text-xs text-foreground-secondary">
              Supported content: videos (.mp4, .mov, .avi, .webm), documents (.pdf, .doc, .docx),
              and other course materials
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleBrowseFiles}>
              Browse ZIP File
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".zip,application/zip,application/x-zip-compressed"
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Uploaded ZIP File</h3>
          <div className="space-y-2">
            {files.map((fileWithProgress, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg"
              >
                {/* ZIP Icon */}
                <div className="shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {fileWithProgress.file.name}
                  </p>
                  <p className="text-xs text-foreground-secondary">
                    {formatFileSize(fileWithProgress.file.size)}
                  </p>
                  {fileWithProgress.error && (
                    <p className="text-xs text-white mt-1">{fileWithProgress.error}</p>
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="shrink-0 p-1 hover:bg-surface rounded transition-colors"
                  aria-label="Remove file"
                >
                  <svg
                    className="w-5 h-5 text-foreground-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
