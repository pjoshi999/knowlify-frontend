"use client";

/**
 * CourseStructurePreview Component
 *
 * Displays the parsed course structure with sections and assets.
 * Shows parsing progress and errors.
 *
 * Validates: Requirements 4.3, 4.14
 */

import { CourseOutline, ParseError } from "@/app/lib/api/service-types";
import { formatDuration } from "@/app/lib/utils/course-parser";

interface CourseStructurePreviewProps {
  outline: CourseOutline | null;
  errors: ParseError[];
  isLoading?: boolean;
}

export function CourseStructurePreview({
  outline,
  errors,
  isLoading = false,
}: CourseStructurePreviewProps) {
  if (isLoading) {
    return (
      <div className="bg-surface-secondary rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
          <p className="text-foreground">Parsing course structure...</p>
        </div>
      </div>
    );
  }

  if (!outline) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-surface-secondary rounded-lg p-4">
        <h3 className="text-lg font-semibold text-foreground mb-2">Course Structure</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-foreground-secondary">Sections</p>
            <p className="text-foreground font-medium">{outline.sections.length}</p>
          </div>
          <div>
            <p className="text-foreground-secondary">Total Assets</p>
            <p className="text-foreground font-medium">{outline.totalAssets}</p>
          </div>
          {outline.totalDuration && (
            <div>
              <p className="text-foreground-secondary">Total Duration</p>
              <p className="text-foreground font-medium">{formatDuration(outline.totalDuration)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-gray-800 border border-white rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2">
            Parsing Errors ({errors.length})
          </h4>
          <ul className="space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-white">
                {error.filename}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-3">
        {outline.sections.map((section, index) => (
          <div key={index} className="bg-surface-secondary rounded-lg p-4">
            <h4 className="text-sm font-semibold text-foreground mb-2">{section.title}</h4>
            <div className="space-y-1">
              {section.assets.map((asset, assetIndex) => (
                <div
                  key={assetIndex}
                  className="flex items-center gap-2 text-sm text-foreground-secondary"
                >
                  {/* Asset Icon */}
                  {asset.type === "video" && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                  )}
                  {asset.type === "document" && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {(asset.type === "quiz" || asset.type === "exam") && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}

                  <span className="truncate">{asset.filename}</span>

                  {asset.metadata.duration && (
                    <span className="text-xs">({formatDuration(asset.metadata.duration)})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
