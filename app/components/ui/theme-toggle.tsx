"use client";

import { useThemeStore } from "../../lib/stores/theme";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - using layout effect to avoid setState in effect warning
  useEffect(() => {
    // This is intentional for hydration - we need to wait for client mount
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="relative h-10 w-10 rounded-full border-2 border-border bg-card p-2 hover:bg-card-hover shadow-sm"
        aria-label="Toggle theme"
      >
        <div className="h-full w-full" />
      </button>
    );
  }

  // Use resolvedTheme for more accurate theme detection
  const isDark = resolvedTheme === "dark";

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative h-10 w-10 rounded-full border-2 border-border bg-card p-2 hover:bg-card-hover hover:border-border-secondary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 shadow-sm transition-all duration-200"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={false}
    >
      <motion.div
        className="relative h-full w-full"
        animate={{
          rotate: isDark ? 180 : 0,
        }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
        }}
      >
        {/* Sun icon - visible in light theme */}
        <motion.svg
          className="absolute inset-0 h-full w-full text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          animate={{
            opacity: isDark ? 0 : 1,
            scale: isDark ? 0.5 : 1,
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </motion.svg>

        {/* Moon icon - visible in dark theme */}
        <motion.svg
          className="absolute inset-0 h-full w-full text-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
          animate={{
            opacity: isDark ? 1 : 0,
            scale: isDark ? 1 : 0.5,
          }}
          transition={{
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </motion.svg>
      </motion.div>

      {/* Animated background circle */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-full bg-foreground/20"
        initial={false}
        animate={{
          scale: 0,
          opacity: 0,
        }}
        whileTap={{
          scale: [0, 1.5],
          opacity: [0.3, 0],
        }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
        }}
      />
    </motion.button>
  );
}
