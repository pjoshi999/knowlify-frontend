# Bug Condition Exploration - Counterexamples

This document records the counterexamples found when running bug exploration tests on the **UNFIXED** code. These failures confirm that all four bugs exist.

## Test Execution Summary

**Date**: Task 1 Execution
**Status**: All 4 tests FAILED (as expected)
**Conclusion**: All four bugs are confirmed to exist in the unfixed code

---

## Bug 1: Navbar Does Not Become Floating on Scroll

**Test**: Bug 1: Navbar should become floating on scroll past 500px

**Expected Behavior**:

- When scrolling past 500px, the navbar should become floating with:
  - `backdrop-blur-md` class
  - `bg-background/95` class
  - `border-b` class
  - `shadow-sm` class

**Actual Behavior (Counterexample)**:

- No `<header>` element found in the rendered page
- The page does not use the EnhancedHeader component
- The navbar remains transparent without floating styles
- Scroll events do not trigger any navbar state changes

**Root Cause Confirmed**:
The courses page does not integrate the EnhancedHeader component. Instead, it has a custom hero section with `-mt-20` negative margin that overlaps where the navbar should be.

---

## Bug 2: View More Buttons Navigate to Query Params

**Test**: Bug 2: View More button should navigate to category page, not query params

**Expected Behavior**:

- Clicking "View more" on Featured Courses should navigate to a category page like `/programming`, `/design`, or `/business`

**Actual Behavior (Counterexample)**:

- Navigation URL: `/courses?featured=true`
- The URL contains query parameters (`?featured=true`)
- The URL is NOT a category-specific route

**Root Cause Confirmed**:
The View More buttons use hardcoded query parameters:

- Line 397: `router.push("/courses?featured=true")`
- Line 405: `router.push("/courses?sort=popular")`
- Line 413: `router.push("/courses?sort=date")`

These should map to actual category routes instead.

---

## Bug 3: Searchbar in Hero Section, Not Navbar

**Test**: Bug 3: Searchbar should be in navbar (EnhancedHeader), not hero section

**Expected Behavior**:

- Searchbar should be inside a `<header>` element (part of the navbar)
- Searchbar should NOT be in the hero section

**Actual Behavior (Counterexample)**:

- `isInHeader`: `false` (searchbar is NOT in a header element)
- `isInHeroSection`: `true` (searchbar IS in the hero section)
- The searchbar is found in a div with classes `py-32 sm:py-40` (hero section styling)

**Root Cause Confirmed**:
The searchbar is embedded in the hero section (lines 248-268 of page.tsx) instead of being integrated into the EnhancedHeader component.

---

## Bug 4: Hardcoded Dark Colors Instead of CSS Variables

**Test**: Bug 4: Page should use CSS variable theme colors, not hardcoded dark colors

**Expected Behavior**:

- Page should use CSS variable-based theme colors:
  - `bg-background` instead of `bg-black`
  - `text-foreground` instead of `text-zinc-*`
  - `border-border` instead of `border-zinc-*`

**Actual Behavior (Counterexample)**:

- Main container has `bg-black` class (hardcoded black background)
- Hero section has `bg-black` class
- Multiple elements use `bg-zinc-900`, `text-zinc-400`, `border-zinc-800` classes
- NO CSS variable-based theme classes found (`bg-background`, `text-foreground`, `border-border`)

**Root Cause Confirmed**:
The entire page uses Tailwind's hardcoded color classes:

- `bg-black` for backgrounds
- `bg-zinc-900/50`, `bg-zinc-900/30` for card backgrounds
- `text-zinc-400`, `text-zinc-500` for text colors
- `border-zinc-900`, `border-zinc-800/50` for borders

This makes the page incompatible with light theme mode.

---

## Conclusion

All four bugs have been confirmed through automated testing:

1. ✅ **Navbar scroll bug exists**: No floating navbar behavior on scroll
2. ✅ **Navigation bug exists**: View More buttons use query params instead of category routes
3. ✅ **Searchbar location bug exists**: Searchbar is in hero section, not navbar
4. ✅ **Theme compatibility bug exists**: Page uses hardcoded dark colors, not CSS variables

These counterexamples validate the bug analysis in the bugfix.md document and provide concrete evidence for the fixes needed in subsequent tasks.
