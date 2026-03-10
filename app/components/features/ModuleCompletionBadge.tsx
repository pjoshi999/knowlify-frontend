"use client";

import { useEffect } from "react";

interface ModuleCompletionBadgeProps {
  moduleTitle: string;
  moduleId: string;
  onClose: () => void;
}

export function ModuleCompletionBadge({
  moduleTitle,
  moduleId: _moduleId,
  onClose,
}: ModuleCompletionBadgeProps) {
  useEffect(() => {
    // Auto-close after 4 seconds
    const timeout = setTimeout(() => {
      onClose();
    }, 4000);

    return () => {
      clearTimeout(timeout);
    };
  }, [onClose]);

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] animate-scale-in">
      <div className="bg-surface border-2 border-primary rounded-xl shadow-2xl p-8 min-w-[400px] text-center">
        <div className="mb-4 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center animate-bounce-slow">
            <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">Module Complete! 🎊</h3>
        <p className="text-foreground-secondary mb-4">{moduleTitle}</p>
        <p className="text-sm text-primary font-medium">Keep up the great work!</p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Continue Learning
        </button>
      </div>
    </div>
  );
}
