/**
 * Lazy-loaded Upload Components
 *
 * Dynamically imports heavy upload-related components to reduce initial bundle size.
 * These components are only needed on the upload page.
 *
 * Validates: Requirements 18.7, 18.10
 */

"use client";

import { lazy, Suspense } from "react";
import type { CourseOutline, ParseError } from "@/app/lib/api/service-types";
import type { CourseMetadata } from "./MetadataForm";

// Lazy load upload components
const FileUploadZone = lazy(() =>
  import("./FileUploadZone").then((module) => ({ default: module.FileUploadZone }))
);

const CourseStructurePreview = lazy(() =>
  import("./CourseStructurePreview").then((module) => ({ default: module.CourseStructurePreview }))
);

const MetadataForm = lazy(() =>
  import("./MetadataForm").then((module) => ({ default: module.MetadataForm }))
);

const CourseSuccessView = lazy(() =>
  import("./CourseSuccessView").then((module) => ({ default: module.CourseSuccessView }))
);

// Loading skeletons
function FileUploadZoneSkeleton() {
  return (
    <div className="border-2 border-dashed border-border rounded-lg p-12 text-center bg-muted/50 animate-pulse">
      <div className="w-16 h-16 mx-auto mb-4 bg-muted-foreground/20 rounded-full" />
      <div className="h-6 bg-muted-foreground/20 rounded w-64 mx-auto mb-2" />
      <div className="h-4 bg-muted-foreground/20 rounded w-48 mx-auto" />
    </div>
  );
}

function CourseStructurePreviewSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    </div>
  );
}

function MetadataFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 bg-muted rounded" />
      <div className="h-24 bg-muted rounded" />
      <div className="h-10 bg-muted rounded" />
      <div className="flex gap-2">
        <div className="h-10 bg-muted rounded flex-1" />
        <div className="h-10 bg-muted rounded flex-1" />
      </div>
    </div>
  );
}

function CourseSuccessViewSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-6 animate-pulse">
      <div className="h-8 bg-muted rounded w-2/3 mx-auto mb-4" />
      <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-6" />
      <div className="flex gap-2 justify-center">
        <div className="h-10 bg-muted rounded w-32" />
        <div className="h-10 bg-muted rounded w-32" />
      </div>
    </div>
  );
}

// Lazy-loaded components with Suspense boundaries
interface FileUploadZoneLazyProps {
  onFilesSelected: (files: File[]) => void;
}

export function FileUploadZoneLazy(props: FileUploadZoneLazyProps) {
  return (
    <Suspense fallback={<FileUploadZoneSkeleton />}>
      <FileUploadZone {...props} />
    </Suspense>
  );
}

interface CourseStructurePreviewLazyProps {
  outline: CourseOutline | null;
  errors: ParseError[];
  isLoading: boolean;
}

export function CourseStructurePreviewLazy(props: CourseStructurePreviewLazyProps) {
  return (
    <Suspense fallback={<CourseStructurePreviewSkeleton />}>
      <CourseStructurePreview {...props} />
    </Suspense>
  );
}

interface MetadataFormLazyProps {
  onSubmit: (metadata: CourseMetadata) => void;
  onCancel: () => void;
}

export function MetadataFormLazy(props: MetadataFormLazyProps) {
  return (
    <Suspense fallback={<MetadataFormSkeleton />}>
      <MetadataForm {...props} />
    </Suspense>
  );
}

interface CourseSuccessViewLazyProps {
  courseId: string;
  courseName: string;
  shareableLink: string;
}

export function CourseSuccessViewLazy(props: CourseSuccessViewLazyProps) {
  return (
    <Suspense fallback={<CourseSuccessViewSkeleton />}>
      <CourseSuccessView {...props} />
    </Suspense>
  );
}
