"use client";

import { useState, useRef, useEffect } from "react";

export interface CaptionSettingsType {
  size: "small" | "medium" | "large";
  opacity: number; // 0, 0.5, 0.75, 1
}

interface CaptionSettingsProps {
  settings: CaptionSettingsType;
  onSettingsChange: (settings: CaptionSettingsType) => void;
  className?: string;
}

export function CaptionSettings({
  settings,
  onSettingsChange,
  className = "",
}: CaptionSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSizeChange = (size: "small" | "medium" | "large") => {
    onSettingsChange({ ...settings, size });
  };

  const handleOpacityChange = (opacity: number) => {
    onSettingsChange({ ...settings, opacity });
  };

  const opacityOptions = [
    { value: 0, label: "0%" },
    { value: 0.5, label: "50%" },
    { value: 0.75, label: "75%" },
    { value: 1, label: "100%" },
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white hover:bg-white/20 rounded transition-colors"
        aria-label="Caption customization settings"
        title="Caption customization"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94L14.4 2.81c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg shadow-lg py-2 min-w-[220px] z-50">
          {/* Caption Size */}
          <div className="px-3 py-2">
            <div className="text-xs text-gray-400 font-semibold uppercase mb-2">Caption Size</div>
            <div className="space-y-1">
              {(["small", "medium", "large"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeChange(size)}
                  className={`w-full px-3 py-2 text-left text-sm rounded hover:bg-white/10 transition-colors ${
                    settings.size === size ? "text-primary bg-white/5" : "text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="capitalize">{size}</span>
                    {settings.size === size && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 my-2"></div>

          {/* Caption Background Opacity */}
          <div className="px-3 py-2">
            <div className="text-xs text-gray-400 font-semibold uppercase mb-2">
              Background Opacity
            </div>
            <div className="space-y-1">
              {opacityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleOpacityChange(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm rounded hover:bg-white/10 transition-colors ${
                    settings.opacity === option.value ? "text-primary bg-white/5" : "text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {settings.opacity === option.value && (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
