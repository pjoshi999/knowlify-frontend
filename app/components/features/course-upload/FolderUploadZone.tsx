"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Folder, X } from "lucide-react";

interface FileWithPath extends File {
  path?: string;
}

interface FolderUploadZoneProps {
  onFilesSelected: (files: FileWithPath[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
}

const ALLOWED_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

export const FolderUploadZone: React.FC<FolderUploadZoneProps> = ({
  onFilesSelected,
  maxFiles = 100,
  maxSize = MAX_FILE_SIZE,
  acceptedTypes,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPath[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[], rejectedFiles: any[]) => {
      setError(null);

      // Check for rejected files
      if (rejectedFiles.length > 0) {
        const reasons = rejectedFiles.map((f) => f.errors[0]?.message).join(", ");
        setError(`Some files were rejected: ${reasons}`);
        return;
      }

      // Validate total size
      const totalSize = acceptedFiles.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_TOTAL_SIZE) {
        setError(`Total upload size exceeds ${MAX_TOTAL_SIZE / (1024 * 1024 * 1024)}GB limit`);
        return;
      }

      // Validate file count
      if (acceptedFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      setSelectedFiles(acceptedFiles);
      onFilesSelected(acceptedFiles);
    },
    [maxFiles, onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes ? undefined : ALLOWED_TYPES,
    maxSize,
    maxFiles,
  });

  const rootProps = getRootProps();
  const { ...safeRootProps } = rootProps as any;

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) return "🎥";
    if (file.type === "application/pdf") return "📄";
    if (file.type.startsWith("image/")) return "🖼️";
    return "📎";
  };

  return (
    <div className="w-full space-y-4">
      {/* Dropzone */}
      <motion.div
        {...safeRootProps}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragActive
              ? "border-white bg-zinc-800 scale-[1.02]"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800"
          }
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input {...getInputProps()} />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={isDragActive ? { scale: 1.2, rotate: 5 } : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isDragActive ? (
              <Folder className="w-16 h-16 text-white" />
            ) : (
              <Upload className="w-16 h-16 text-zinc-400" />
            )}
          </motion.div>

          <div className="space-y-2">
            <p className="text-lg text-white">
              {isDragActive ? "Drop your files here" : "Drag & drop your course files"}
            </p>
            <p className="text-sm text-zinc-400">or click to browse</p>
            <p className="text-xs text-zinc-500">
              Supports: MP4, MOV, AVI, PDF, JPG, PNG • Max 5GB per file • Max 10GB total
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-900/20 border border-red-800 rounded-lg p-4"
          >
            <p className="text-sm text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
              </p>
              <p className="text-sm text-zinc-400">
                Total: {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {selectedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between bg-zinc-800 rounded-lg p-3 group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-2xl flex-shrink-0">{getFileIcon(file)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{file.path || file.name}</p>
                      <p className="text-xs text-zinc-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 rounded hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X className="w-4 h-4 text-zinc-400" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
