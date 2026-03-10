import type { Config } from "tailwindcss";

/**
 * Tailwind CSS v4 Configuration
 *
 * Note: Tailwind v4 uses CSS-based configuration via @theme in globals.css
 * This file provides TypeScript types and extends the default theme.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Background colors
        background: "var(--color-background)",
        "background-secondary": "var(--color-background-secondary)",
        "background-tertiary": "var(--color-background-tertiary)",

        // Foreground colors
        foreground: "var(--color-foreground)",
        "foreground-secondary": "var(--color-foreground-secondary)",
        "foreground-tertiary": "var(--color-foreground-tertiary)",

        // Primary colors
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          foreground: "var(--color-primary-foreground)",
        },

        // Secondary colors
        secondary: {
          DEFAULT: "var(--color-secondary)",
          hover: "var(--color-secondary-hover)",
          foreground: "var(--color-secondary-foreground)",
        },

        // Accent colors
        accent: {
          DEFAULT: "var(--color-accent)",
          hover: "var(--color-accent-hover)",
          foreground: "var(--color-accent-foreground)",
        },

        // Border colors
        border: {
          DEFAULT: "var(--color-border)",
          secondary: "var(--color-border-secondary)",
        },

        // Card colors
        card: {
          DEFAULT: "var(--color-card)",
          hover: "var(--color-card-hover)",
        },

        // Muted colors
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },

        // Status colors
        success: {
          DEFAULT: "var(--color-success)",
          foreground: "var(--color-success-foreground)",
        },
        error: {
          DEFAULT: "var(--color-error)",
          foreground: "var(--color-error-foreground)",
        },
        warning: {
          DEFAULT: "var(--color-warning)",
          foreground: "var(--color-warning-foreground)",
        },
        info: {
          DEFAULT: "var(--color-info)",
          foreground: "var(--color-info-foreground)",
        },

        // Input colors
        input: {
          DEFAULT: "var(--color-input)",
          border: "var(--color-input-border)",
          focus: "var(--color-input-focus)",
        },
      },

      spacing: {
        xs: "var(--spacing-xs)",
        sm: "var(--spacing-sm)",
        md: "var(--spacing-md)",
        lg: "var(--spacing-lg)",
        xl: "var(--spacing-xl)",
        "2xl": "var(--spacing-2xl)",
        "3xl": "var(--spacing-3xl)",
      },

      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },

      transitionDuration: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
      },

      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },

      fontSize: {
        h1: "3rem", // 48px
        h2: "2.25rem", // 36px
        h3: "1.875rem", // 30px
        h4: "1.5rem", // 24px
        "body-lg": "1.125rem", // 18px
        body: "1rem", // 16px
        "body-sm": "0.875rem", // 14px
        caption: "0.75rem", // 12px
      },

      boxShadow: {
        DEFAULT: "0 1px 3px var(--shadow)",
        lg: "0 10px 15px var(--shadow-lg)",
      },

      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-in-out",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
