"use client";

/**
 * CourseSuccessView Component
 *
 * Displays success message after course creation with shareable link
 * and action buttons.
 *
 * Validates: Requirements 4.11, 4.12, 4.13
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";

interface CourseSuccessViewProps {
  courseId: string;
  courseName: string;
  shareableLink: string;
}

export function CourseSuccessView({ courseId, courseName, shareableLink }: CourseSuccessViewProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      // Get the full URL including domain
      const fullUrl = `${window.location.origin}${shareableLink}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleViewCourse = () => {
    router.push(`/courses/${courseId}`);
  };

  const handleCreateAnother = () => {
    router.push("/upload");
  };

  return (
    <div className="bg-surface-secondary rounded-lg p-6 space-y-6">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Success Message */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground mb-2">Course Created Successfully!</h3>
        <p className="text-foreground-secondary">
          Your course &quot;{courseName}&quot; is now live and ready to share with students.
        </p>
      </div>

      {/* Shareable Link */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground">Shareable Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={shareableLink}
            readOnly
            className="flex-1 px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
          />
          <Button
            variant={copied ? "outline" : "primary"}
            onClick={handleCopyLink}
            className="shrink-0"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Link
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="primary" onClick={handleViewCourse} className="flex-1">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          View Course
        </Button>
        <Button variant="outline" onClick={handleCreateAnother} className="flex-1">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Another Course
        </Button>
      </div>

      {/* Additional Info */}
      <div className="pt-4 border-t border-border">
        <p className="text-sm text-foreground-secondary text-center">
          You can manage your courses from the{" "}
          <button
            onClick={() => router.push("/instructor/dashboard")}
            className="text-foreground hover:underline transition-colors"
          >
            Instructor Dashboard
          </button>
        </p>
      </div>
    </div>
  );
}
