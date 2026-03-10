"use client";

import { useThemeStore } from "../../lib/stores/theme";

interface BackgroundGridProps {
  className?: string;
}

export function BackgroundGrid({ className = "" }: BackgroundGridProps) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`} style={{ zIndex: 0 }}>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${resolvedTheme === "light" ? "rgba(228, 228, 231, 0.3)" : "rgba(39, 39, 42, 0.3)"} 1px, transparent 1px),
            linear-gradient(to bottom, ${resolvedTheme === "light" ? "rgba(228, 228, 231, 0.3)" : "rgba(39, 39, 42, 0.3)"} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            resolvedTheme === "light"
              ? "radial-gradient(circle at 50% 0%, rgba(250, 250, 250, 0) 0%, rgba(250, 250, 250, 1) 100%)"
              : "radial-gradient(circle at 50% 0%, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 100%)",
        }}
      />
    </div>
  );
}
