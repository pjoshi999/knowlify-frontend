"use client";

interface UploadQueueProps {
  queuePosition: number;
  estimatedStartTime: string;
  onCancel?: () => void;
}

/**
 * UploadQueue component for displaying queued upload status
 * Shows queue position and estimated start time
 */
export function UploadQueue({ queuePosition, estimatedStartTime, onCancel }: UploadQueueProps) {
  return (
    <div className="w-full p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Queue icon */}
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <h3 className="text-lg font-semibold text-yellow-800">Upload Queued</h3>
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-yellow-700 bg-white border border-yellow-300 rounded-md hover:bg-yellow-50 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            aria-label="Cancel queued upload"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="space-y-3">
        {/* Queue position */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-yellow-700">Position in queue:</span>
          <span className="text-lg font-bold text-yellow-800">{queuePosition}</span>
        </div>

        {/* Estimated start time */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-yellow-700">Estimated start:</span>
          <span className="text-sm font-semibold text-yellow-800">
            {new Date(estimatedStartTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Info message */}
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <p className="text-sm text-yellow-700">
            Your upload is queued due to high system load. It will start automatically when capacity
            is available.
          </p>
        </div>
      </div>

      {/* ARIA live region for screen readers */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        Upload queued. Position {queuePosition} in queue. Estimated start time:{" "}
        {new Date(estimatedStartTime).toLocaleTimeString()}.
      </div>
    </div>
  );
}
