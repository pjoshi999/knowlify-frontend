/**
 * Design System Tokens
 *
 * Centralized design tokens for the Knowlify platform redesign.
 * Based on modern AI platform aesthetics with a focus on clean, professional design.
 */

// ============================================================================
// COLORS
// ============================================================================

export const colors = {
  // Background colors
  background: {
    primary: "#000000", // Black
    secondary: "#18181b", // Zinc-900
    tertiary: "#27272a", // Zinc-800
  },

  // Surface colors
  surface: {
    primary: "#18181b", // Zinc-900
    secondary: "#27272a", // Zinc-800
  },

  // Border colors
  border: {
    primary: "#27272a", // Zinc-800
    secondary: "#3f3f46", // Zinc-700
  },

  // Text colors
  text: {
    primary: "#ffffff", // White
    secondary: "#a1a1aa", // Zinc-400
    tertiary: "#71717a", // Zinc-500
  },

  // Accent colors
  accent: {
    primary: "#3b82f6", // Blue-500
  },
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  // Font sizes
  fontSize: {
    h1: "3rem", // 48px
    h2: "2.25rem", // 36px
    h3: "1.875rem", // 30px
    h4: "1.5rem", // 24px
    bodyLarge: "1.125rem", // 18px
    body: "1rem", // 16px
    bodySmall: "0.875rem", // 14px
    caption: "0.75rem", // 12px
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px
  "2xl": "3rem", // 48px
  "3xl": "4rem", // 64px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const borderRadius = {
  sm: "0.5rem", // 8px - rounded-lg
  md: "0.75rem", // 12px - rounded-xl
  lg: "1rem", // 16px - rounded-2xl
  full: "9999px", // rounded-full
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const transitions = {
  duration: {
    fast: "200ms",
    normal: "300ms",
  },
  timing: {
    ease: "ease-in-out",
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  sm: "640px", // Mobile landscape
  md: "768px", // Tablet
  lg: "1024px", // Desktop
  xl: "1280px", // Large desktop
  "2xl": "1536px", // Extra large
} as const;

// ============================================================================
// COMPONENT TOKENS
// ============================================================================

export const components = {
  button: {
    height: {
      sm: "2rem", // 32px
      md: "2.5rem", // 40px
      lg: "3rem", // 48px
    },
    padding: {
      sm: "0.75rem 1rem",
      md: "0.75rem 1.5rem",
      lg: "1rem 2rem",
    },
  },

  input: {
    height: {
      sm: "2.5rem", // 40px
      md: "3rem", // 48px
      lg: "3.5rem", // 56px
    },
  },

  card: {
    padding: {
      sm: spacing.md,
      md: spacing.lg,
      lg: spacing.xl,
    },
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Colors = typeof colors;
export type Typography = typeof typography;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Transitions = typeof transitions;
export type Breakpoints = typeof breakpoints;
export type Components = typeof components;
