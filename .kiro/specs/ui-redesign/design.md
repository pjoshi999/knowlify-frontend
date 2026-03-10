# UI Redesign - Design Document

## Design System

### Typography Scale

```
- Heading 1: 48px (3rem) - font-bold
- Heading 2: 36px (2.25rem) - font-bold
- Heading 3: 30px (1.875rem) - font-semibold
- Heading 4: 24px (1.5rem) - font-semibold
- Body Large: 18px (1.125rem) - font-normal
- Body: 16px (1rem) - font-normal
- Body Small: 14px (0.875rem) - font-normal
- Caption: 12px (0.75rem) - font-normal
```

### Spacing Scale

```
- xs: 4px (0.25rem)
- sm: 8px (0.5rem)
- md: 16px (1rem)
- lg: 24px (1.5rem)
- xl: 32px (2rem)
- 2xl: 48px (3rem)
- 3xl: 64px (4rem)
```

### Component Specifications

#### Button Component

```tsx
// Primary Button
className="px-6 py-3 bg-white text-black rounded-full font-medium
           hover:bg-zinc-100 transition-colors duration-200
           border border-zinc-200"

// Secondary Button
className="px-6 py-3 bg-zinc-800 text-white rounded-full font-medium
           hover:bg-zinc-700 transition-colors duration-200
           border border-zinc-700"

// Ghost Button
className="px-6 py-3 bg-transparent text-white rounded-full font-medium
           hover:bg-zinc-800 transition-colors duration-200
           border border-transparent hover:border-zinc-700"
```

#### Card Component

```tsx
className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden
           hover:border-zinc-700 transition-colors duration-200"
```

#### Input Component

```tsx
// Search Input (Large)
className="w-full h-14 px-6 bg-white text-black rounded-full
           focus:outline-none focus:ring-2 focus:ring-blue-500"

// Form Input
className="w-full px-4 py-3 bg-zinc-900 text-white rounded-lg
           border border-zinc-800 focus:border-zinc-700
           focus:outline-none transition-colors duration-200"
```

## Page Layouts

### Courses Marketplace Layout

```
┌─────────────────────────────────────────────────────────┐
│ Header (Navbar)                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Hero Section (bg-zinc-900)                            │
│  ┌─────────────────────────────────────────────────┐  │
│  │ Learn Without Limits                            │  │
│  │ Large Search Bar (56px, rounded-full)           │  │
│  │ [Programming] [Design] [Business] ...           │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Content Area                                          │
│  ┌─────────────────────────────────────────────────┐  │
│  │ X courses | [Filters ▼] [Sort ▼]                │  │
│  ├─────────────────────────────────────────────────┤  │
│  │                                                  │  │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │  │
│  │  │Card│ │Card│ │Card│ │Card│                   │  │
│  │  └────┘ └────┘ └────┘ └────┘                   │  │
│  │                                                  │  │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐                   │  │
│  │  │Card│ │Card│ │Card│ │Card│                   │  │
│  │  └────┘ └────┘ └────┘ └────┘                   │  │
│  │                                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Course Card Design

```
┌─────────────────────────┐
│                         │
│   Thumbnail (16:9)      │
│                         │
├─────────────────────────┤
│ Course Title            │
│ (2 lines max)           │
│                         │
│ Instructor Name         │
│                         │
│ ★★★★☆ 4.5 (1,234)      │
│                         │
│ $49.99                  │
└─────────────────────────┘

Hover State:
- Border color: zinc-700
- No scale transform
- Smooth transition
```

### Upload Page with Particles

```
┌─────────────────────────────────────────────────────────┐
│ Header                                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Particle Background (animated dots)                   │
│  · · ·  ·   ·  · ·   ·  ·   · ·                       │
│   ·  ·   · ·  ·   ·  ·  ·   ·  ·                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │  Chat Interface                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ Assistant: Upload your video...            │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  │  ┌────────────────────────────────────────────┐ │  │
│  │  │ User: [File selected]                      │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  │                                                  │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Animation Specifications

### Hover Animations

```css
/* Card Hover */
.card {
  transition: border-color 200ms ease-in-out;
}
.card:hover {
  border-color: #3f3f46; /* zinc-700 */
}

/* Button Hover */
.button {
  transition: background-color 200ms ease-in-out;
}
.button:hover {
  background-color: #f4f4f5; /* zinc-100 for white buttons */
}

/* NO SCALE TRANSFORMS */
/* ❌ transform: scale(1.05) */
/* ✅ opacity: 0.9 */
```

### Loading Animations

```css
/* Skeleton Pulse */
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Fade In */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Slide Up */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### Particle Configuration

```typescript
{
  particles: {
    number: {
      value: 50,
      density: {
        enable: true,
        value_area: 800
      }
    },
    color: {
      value: "#71717a" // zinc-500
    },
    shape: {
      type: "circle"
    },
    opacity: {
      value: 0.3,
      random: true
    },
    size: {
      value: 2,
      random: true
    },
    move: {
      enable: true,
      speed: 0.5,
      direction: "none",
      random: true,
      out_mode: "out",
      attract: {
        enable: true,
        rotateX: 600,
        rotateY: 1200
      }
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "attract"
      }
    }
  }
}
```

## Component Architecture

### New Components to Create

1. **`components/ui/modern-button.tsx`**
   - Primary, Secondary, Ghost variants
   - Size variants (sm, md, lg)
   - Loading state
   - Icon support

2. **`components/ui/modern-card.tsx`**
   - Base card with hover effects
   - Course card variant
   - Dashboard card variant

3. **`components/ui/modern-input.tsx`**
   - Search input (large, rounded-full)
   - Form input (standard)
   - Textarea variant

4. **`components/ui/particle-background.tsx`**
   - Configurable particle system
   - Cursor interaction
   - Performance optimized

5. **`components/layouts/modern-container.tsx`**
   - Max-width container
   - Responsive padding
   - Consistent spacing

### Updated Components

1. **`components/features/course-card.tsx`**
   - Remove scale hover
   - Update border styles
   - Smooth transitions

2. **`components/features/filter-sidebar.tsx`**
   - Convert to modal/dropdown
   - Mobile-first design
   - Smooth animations

3. **`components/ui/button.tsx`**
   - Update to match new design system
   - Remove scale transforms
   - Add new variants

## Mobile Responsiveness

### Breakpoints

```typescript
const breakpoints = {
  sm: "640px", // Mobile landscape
  md: "768px", // Tablet
  lg: "1024px", // Desktop
  xl: "1280px", // Large desktop
  "2xl": "1536px", // Extra large
};
```

### Mobile Adaptations

**Courses Page:**

- Hero: Reduce padding, smaller text
- Search: Full width, maintain 56px height
- Categories: Horizontal scroll
- Grid: 1 column mobile, 2 tablet, 4 desktop
- Filters: Bottom sheet modal

**Upload Page:**

- Particles: Reduce count on mobile
- Chat: Full width, reduce padding
- Buttons: Full width on mobile

## Accessibility

### Focus States

```css
.focusable:focus-visible {
  outline: 2px solid #3b82f6; /* blue-500 */
  outline-offset: 2px;
}
```

### ARIA Labels

- All interactive elements have labels
- Form inputs have associated labels
- Buttons describe their action
- Images have alt text

### Keyboard Navigation

- Tab order follows visual order
- Enter/Space activate buttons
- Escape closes modals
- Arrow keys for dropdowns

## Performance Optimization

### Image Optimization

- Use Next.js Image component
- Lazy load below fold
- Responsive images
- WebP format with fallback

### Code Splitting

- Lazy load heavy components
- Dynamic imports for modals
- Route-based splitting

### Animation Performance

- Use transform and opacity only
- Avoid layout thrashing
- RequestAnimationFrame for particles
- Debounce scroll events

## Testing Checklist

- [ ] All pages render correctly
- [ ] Buttons match design system
- [ ] No scale transforms on hover
- [ ] Smooth animations
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Screen reader compatible
- [ ] Fast load times
- [ ] Works in all browsers
- [ ] Particles perform well
