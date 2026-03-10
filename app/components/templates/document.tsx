/**
 * Document Viewer Template Component
 *
 * PDF and document viewer with download functionality, navigation controls,
 * and metadata display. Supports responsive design for mobile, tablet, desktop.
 *
 * Validates: Requirements 9.4, 9.6, 22.3, 22.4, 15.7
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/app/components/ui/button";

export interface DocumentMetadata {
  pageCount?: number;
  fileSize?: string;
  format?: string;
  author?: string;
  lastModified?: Date;
}

export interface DocumentTemplateProps {
  documentUrl: string;
  title: string;
  description?: string;
  metadata?: DocumentMetadata;
  onComplete?: () => void;
}

export function DocumentTemplate({
  documentUrl,
  title,
  description,
  metadata,
  onComplete,
}: DocumentTemplateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle document load
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [documentUrl]);

  // Handle download
  const handleDownload = async () => {
    try {
      setIsDownloading(true);

      // Fetch the document
      const response = await fetch(documentUrl);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = title.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".pdf";
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download document. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Navigation controls
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (metadata?.pageCount && currentPage < metadata.pageCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Mark as complete when document is viewed
  useEffect(() => {
    if (!isLoading && !hasError) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 5000); // Mark complete after 5 seconds of viewing

      return () => clearTimeout(timer);
    }
  }, [isLoading, hasError, onComplete]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Document Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
            {description && <p className="text-foreground-secondary">{description}</p>}
          </div>

          {/* Download Button */}
          <Button
            variant="primary"
            size="md"
            onClick={handleDownload}
            loading={isDownloading}
            className="flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </Button>
        </div>

        {/* Document Metadata */}
        {metadata && (
          <div className="flex flex-wrap gap-4 text-sm text-foreground-secondary">
            {metadata.pageCount && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>{metadata.pageCount} pages</span>
              </div>
            )}
            {metadata.fileSize && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <span>{metadata.fileSize}</span>
              </div>
            )}
            {metadata.format && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
                <span>{metadata.format.toUpperCase()}</span>
              </div>
            )}
            {metadata.author && (
              <div className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{metadata.author}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Viewer Container */}
      <div className="relative bg-muted rounded-lg overflow-hidden shadow-xl">
        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-muted z-10"
              style={{ minHeight: "600px" }}
            >
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                <p className="text-foreground-secondary">Loading document...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-muted z-10"
              style={{ minHeight: "600px" }}
            >
              <div className="text-center max-w-md px-4">
                <svg
                  className="w-16 h-16 text-error mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Failed to Load Document
                </h3>
                <p className="text-foreground-secondary mb-4">
                  The document could not be loaded. Please try downloading it instead.
                </p>
                <Button variant="primary" onClick={handleDownload} loading={isDownloading}>
                  Download Document
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PDF Viewer (iframe) */}
        <iframe
          src={`${documentUrl}#page=${currentPage}`}
          className="w-full border-0"
          style={{ minHeight: "600px", height: "80vh" }}
          title={title}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>

      {/* Navigation Controls */}
      {metadata?.pageCount && metadata.pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Previous
          </Button>

          <div className="text-sm text-foreground-secondary">
            Page {currentPage} of {metadata.pageCount}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === metadata.pageCount}
            className="flex items-center gap-2"
          >
            Next
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      )}

      {/* Document Info */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h3 className="text-sm font-semibold text-foreground mb-2">Document Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-foreground-secondary">
          <div>Use the navigation buttons to move between pages</div>
          <div>Click the download button to save a copy</div>
          <div>Use your browser&apos;s zoom controls to adjust size</div>
          <div>Right-click is disabled to protect content</div>
        </div>
      </div>
    </div>
  );
}
