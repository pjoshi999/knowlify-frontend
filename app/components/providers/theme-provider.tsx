"use client";

import { useEffect } from "react";
import { useThemeStore } from "../../lib/stores/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme, setSystemTheme } = useThemeStore();

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateSystemTheme = () => {
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      setSystemTheme(systemTheme);
    };

    // Set initial system theme
    updateSystemTheme();

    // Listen for system theme changes
    mediaQuery.addEventListener("change", updateSystemTheme);

    return () => {
      mediaQuery.removeEventListener("change", updateSystemTheme);
    };
  }, [setSystemTheme]);

  // Apply resolved theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
    root.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  return <>{children}</>;
}
