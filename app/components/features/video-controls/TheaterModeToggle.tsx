"use client";

interface TheaterModeToggleProps {
  isTheaterMode: boolean;
  onToggle: () => void;
}

export function TheaterModeToggle({ isTheaterMode, onToggle }: TheaterModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="p-2 text-white hover:bg-white/20 rounded transition-colors"
      aria-label={isTheaterMode ? "Exit theater mode" : "Enter theater mode"}
      title={isTheaterMode ? "Exit theater mode" : "Enter theater mode"}
    >
      {isTheaterMode ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      )}
    </button>
  );
}
