import React from "react";

interface GridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: "sm" | "md" | "lg" | "xl";
}

/**
 * Responsive grid system with breakpoints
 * Mobile: 320-767px, Tablet: 768-1023px, Desktop: 1024px+
 */
export function Grid({
  children,
  className = "",
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = "md",
}: GridProps) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  };

  const mobileClass = `grid-cols-${cols.mobile || 1}`;
  const tabletClass = `md:grid-cols-${cols.tablet || 2}`;
  const desktopClass = `lg:grid-cols-${cols.desktop || 3}`;

  return (
    <div
      className={`grid ${mobileClass} ${tabletClass} ${desktopClass} ${gapClasses[gap]} ${className}`}
    >
      {children}
    </div>
  );
}
