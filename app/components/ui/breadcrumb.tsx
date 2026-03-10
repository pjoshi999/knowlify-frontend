"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BreadcrumbProps {
  className?: string;
  customLabels?: Record<string, string>;
}

/**
 * Breadcrumb navigation component
 *
 * Features:
 * - Automatically generates breadcrumbs from current route
 * - Displays location hierarchy
 * - Clickable navigation to parent pages
 * - ARIA attributes for accessibility
 * - Supports custom labels for routes
 *
 * Validates: Requirements 19.1 (keyboard navigation and ARIA labels)
 */
export function Breadcrumb({ className = "", customLabels = {} }: BreadcrumbProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Don't show breadcrumbs on home page
    if (!pathname || pathname === "/") {
      return [];
    }

    // Split pathname into segments
    const segments = pathname.split("/").filter(Boolean);

    // Build breadcrumb items
    const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

    let currentPath = "";
    segments.forEach((segment, _index) => {
      currentPath += `/${segment}`;

      // Generate label from segment
      let label = segment;

      // Check for custom label
      if (customLabels[currentPath]) {
        label = customLabels[currentPath]!;
      }
      // Check if segment is a UUID or ID (common pattern)
      else if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
        label = "Details";
      }
      // Convert kebab-case or snake_case to Title Case
      else {
        label = segment
          .replace(/[-_]/g, " ")
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      items.push({
        label,
        href: currentPath,
      });
    });

    return items;
  }, [pathname, customLabels]);

  // Don't render if no breadcrumbs
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center space-x-2 text-sm ${className}`}>
      <ol className="flex items-center space-x-2" role="list">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={item.href} className="flex items-center space-x-2">
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-foreground-secondary flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}

              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-foreground-secondary hover:text-foreground transition-colors"
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
