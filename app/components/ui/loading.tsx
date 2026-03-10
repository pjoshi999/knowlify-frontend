"use client";

import { HTMLAttributes } from "react";

export type SpinnerSize = "sm" | "md" | "lg" | "xl";

export interface SpinnerProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  size?: SpinnerSize;
  className?: string;
}

export function Spinner({ size = "md", className = "", ...props }: SpinnerProps) {
  const sizeStyles: Record<SpinnerSize, string> = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-white border-t-transparent ${sizeStyles[size]} ${className}`.trim()}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export interface SkeletonProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
  ...props
}: SkeletonProps) {
  const variantStyles: Record<string, string> = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height ? (typeof height === "number" ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`animate-pulse bg-muted ${variantStyles[variant]} ${className}`.trim()}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`.trim()}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={16}
          className={i === lines - 1 ? "w-3/4" : "w-full"}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`border border-border rounded-xl p-6 ${className}`.trim()}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" height={20} className="w-3/4" />
          <Skeleton variant="text" height={16} className="w-full" />
          <Skeleton variant="text" height={16} className="w-5/6" />
        </div>
      </div>
    </div>
  );
}
