/**
 * ProgressBar Component
 *
 * Displays course completion progress with percentage
 */

"use client";

export interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Progress bar component for displaying course completion
 *
 * @example
 * ```tsx
 * <ProgressBar progress={65} showPercentage />
 * ```
 */
export function ProgressBar({
  progress,
  showPercentage = true,
  size = "md",
  className = "",
}: ProgressBarProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={`w-full ${className}`}>
      {showPercentage && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Progress</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {clampedProgress}%
          </span>
        </div>
      )}
      <div
        className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size]}`}
      >
        <div
          className="h-full bg-white transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Course progress: ${clampedProgress}%`}
        />
      </div>
    </div>
  );
}

/**
 * Circular progress indicator
 */
export interface CircularProgressProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function CircularProgress({
  progress,
  size = 48,
  strokeWidth = 4,
  className = "",
}: CircularProgressProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-white transition-all duration-300"
        />
      </svg>
      <span className="absolute text-xs font-medium text-gray-900 dark:text-gray-100">
        {clampedProgress}%
      </span>
    </div>
  );
}
