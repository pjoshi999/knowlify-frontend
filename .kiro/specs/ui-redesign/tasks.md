# UI Redesign - Implementation Tasks

## Phase 1: Foundation & Setup

### 1.1 Install Dependencies

- [ ] Install Aceternity UI: `npm install aceternity-ui`
- [ ] Install Shadcn components:
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button
  npx shadcn-ui@latest add card
  npx shadcn-ui@latest add dialog
  npx shadcn-ui@latest add dropdown-menu
  npx shadcn-ui@latest add input
  npx shadcn-ui@latest add skeleton
  ```
- [ ] Install particle library: `npm install @tsparticles/react @tsparticles/slim`
- [ ] Install framer-motion (if not already): `npm install framer-motion`

### 1.2 Create Design System Tokens

- [x] Create `app/lib/design-tokens.ts` with colors, spacing, typography
- [x] Update `tailwind.config.ts` with custom theme
- [x] Create CSS variables in `app/globals.css`

### 1.3 Create Base Components

- [x] `components/ui/modern-button.tsx` - New button component
- [x] `components/ui/modern-card.tsx` - New card component
- [x] `components/ui/modern-input.tsx` - New input component
- [x] `components/ui/particle-background.tsx` - Particle system
- [x] `components/layouts/modern-container.tsx` - Container component

## Phase 2: Courses Marketplace Page

### 2.1 Hero Section

- [x] Create hero component with black/zinc-900 background
- [x] Add large heading "Learn Without Limits"
- [x] Implement 56px search bar (rounded-full, white background)
- [x] Add search icon button (blue-500, rounded-full)
- [x] Create category pills (horizontal scroll on mobile)
- [x] Add "Upload Course" button for instructors

### 2.2 Remove Left Sidebar

- [x] Delete `FilterSidebar` from main layout
- [x] Create filter modal/dropdown component
- [x] Add "Filters" button in top bar
- [x] Implement filter chips (removable)

### 2.3 Course Grid

- [x] Update grid: 4 columns desktop, 3 tablet, 2 mobile, 1 mobile-sm
- [x] Reduce gap to `gap-4` or `gap-6`
- [x] Update course cards with new design

### 2.4 Course Card Redesign

- [x] Remove scale hover effect
- [x] Update border: `border-zinc-800` default, `border-zinc-700` hover
- [x] Use `rounded-xl` for cards
- [x] Smooth transition: `transition-colors duration-200`
- [x] Update thumbnail aspect ratio (16:9)
- [x] Clean typography hierarchy

### 2.5 Sort & Filter Bar

- [x] Create top bar with course count and sort dropdown
- [x] Style sort dropdown to match design system
- [x] Add filter button (mobile)
- [x] Implement filter modal with smooth animation

### 2.6 Navbar Enhancements

- [x] Make navbar floating on scroll with backdrop blur
- [x] Fix View More buttons to redirect to category pages
- [x] Create dynamic category pages (e.g., /programming, /design, /business)
- [x] Fix searchbar alignment in navbar
- [x] Make page light theme compatible with CSS variables
- [x] Replace hardcoded dark colors with theme variables

### 2.7 Search Modal

- [x] Add search icon in navbar beside theme toggle
- [x] Create search modal component
- [x] Implement Cmd/Ctrl+K keyboard shortcut
- [x] Add search suggestions with course thumbnails
- [x] Store recent searches in localStorage
- [x] Make suggestions clickable to navigate to course pages
- [x] Add quick actions section
- [x] Make modal fully responsive

## Phase 3: Upload Page Enhancements

### 3.1 Particle Background

- [x] Create `ParticleBackground` component
- [x] Configure particles (50 dots, zinc-500 color, 0.3 opacity)
- [x] Implement cursor-following behavior
- [x] Add slow random movement when idle
- [x] Optimize performance (requestAnimationFrame)

### 3.2 Button Updates

- [x] Update all buttons to match new design system
- [x] Remove any scale transforms
- [x] Add smooth hover transitions

### 3.3 Progress Animations

- [x] Smooth progress bar transitions
- [x] Pulse animation for loading states
- [x] Fade in/out for messages

### 3.4 Error States

- [x] Clean error message display
- [x] Error icon with subtle animation
- [x] Retry button with new styling

## Phase 4: Course Detail Page

### 4.1 Hero Section

- [x] Video preview with play button
- [x] Course title and subtitle
- [x] Instructor info
- [x] Rating and student count

### 4.2 Pricing Card

- [x] Sticky sidebar on desktop
- [x] Price display
- [x] "Enroll Now" button (new style)
- [x] What's included list

### 4.3 Content Sections

- [x] Module accordion with smooth animations
- [x] Review section with rating distribution
- [x] Instructor profile card
- [x] Related courses

## Phase 5: Dashboard Pages

### 5.1 Instructor Dashboard

- [x] Remove revenue section
- [x] Course management cards
- [x] Upload analytics
- [x] Student engagement metrics
- [x] Clean card layout

### 5.2 Student Dashboard

- [x] Continue learning section
- [x] Progress tracking cards
- [x] Recommended courses
- [x] Achievement badges

## Phase 6: Authentication Pages

### 6.1 Login Page

- [ ] Center card layout
- [ ] Clean form inputs (new style)
- [ ] Google OAuth button (match reference)
- [ ] "Don't have an account?" link
- [ ] Smooth transitions

### 6.2 Signup Page

- [ ] Similar layout to login
- [ ] Form validation with clean errors
- [ ] Terms and conditions checkbox
- [ ] Smooth animations

### 6.3 Password Reset

- [ ] Clean form layout
- [ ] Success/error states
- [ ] Back to login link

## Phase 7: Global Components

### 7.1 Navigation Bar

- [ ] Update logo and branding
- [ ] Clean navigation links
- [ ] User menu dropdown (new style)
- [ ] Search bar (if applicable)
- [ ] Mobile menu with smooth animation

### 7.2 Footer

- [ ] Clean layout with links
- [ ] Social media icons
- [ ] Copyright info
- [ ] Newsletter signup (optional)

### 7.3 Loading States

- [ ] Global page loader (replace current)
- [ ] Skeleton loaders for cards
- [ ] Spinner component (new style)
- [ ] Progress indicators

### 7.4 Modals & Dialogs

- [x] Update modal styling (`rounded-2xl`)
- [x] Smooth fade in/out
- [x] Backdrop blur effect
- [x] Close button styling

## Phase 8: Polish & Refinement

### 8.1 Hover Effects

- [ ] Audit all hover effects
- [ ] Remove ALL scale transforms
- [ ] Implement opacity/color changes
- [ ] Smooth transitions (200-300ms)

### 8.2 Animations

- [ ] Page transitions
- [ ] Card entrance animations
- [ ] Button click feedback
- [ ] Loading animations

### 8.3 Mobile Responsiveness

- [ ] Test all pages on mobile
- [ ] Adjust spacing and sizing
- [ ] Touch-friendly targets (44px min)
- [ ] Horizontal scroll for categories

### 8.4 Accessibility

- [ ] Add ARIA labels
- [ ] Test keyboard navigation
- [ ] Focus states for all interactive elements
- [ ] Screen reader testing

### 8.5 Performance

- [ ] Lazy load images
- [ ] Code split heavy components
- [ ] Optimize animations
- [ ] Reduce bundle size

## Phase 9: Testing & QA

### 9.1 Visual Testing

- [ ] Compare with reference site
- [ ] Check all button styles
- [ ] Verify border radius consistency
- [ ] Confirm color theme

### 9.2 Functional Testing

- [ ] All links work
- [ ] Forms submit correctly
- [ ] Filters work properly
- [ ] Search functions correctly

### 9.3 Cross-Browser Testing

- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### 9.4 Device Testing

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

## Phase 10: Documentation

### 10.1 Component Documentation

- [ ] Document new components
- [ ] Usage examples
- [ ] Props and variants

### 10.2 Design System Guide

- [ ] Color palette
- [ ] Typography scale
- [ ] Spacing system
- [ ] Component library

### 10.3 Migration Guide

- [ ] Old vs new components
- [ ] Breaking changes
- [ ] Update instructions

## Priority Order

**High Priority (Do First):**

1. Phase 1: Foundation & Setup
2. Phase 2: Courses Marketplace Page
3. Phase 3: Upload Page Enhancements

**Medium Priority:** 4. Phase 4: Course Detail Page 5. Phase 5: Dashboard Pages 6. Phase 7: Global Components

**Low Priority (Polish):** 7. Phase 6: Authentication Pages 8. Phase 8: Polish & Refinement 9. Phase 9: Testing & QA 10. Phase 10: Documentation

## Estimated Time

- **Phase 1**: 2-3 hours
- **Phase 2**: 3-4 hours
- **Phase 3**: 1-2 hours
- **Phase 4**: 2-3 hours
- **Phase 5**: 2-3 hours
- **Phase 6**: 1-2 hours
- **Phase 7**: 2-3 hours
- **Phase 8**: 2-3 hours
- **Phase 9**: 1-2 hours
- **Phase 10**: 1 hour

**Total**: 17-26 hours

## Notes

- Start with Phase 1 to establish foundation
- Phase 2 (Courses page) is the most visible change
- Phase 3 (Upload page) adds the "wow" factor with particles
- Test frequently during development
- Get user feedback after each phase
- Iterate based on feedback
