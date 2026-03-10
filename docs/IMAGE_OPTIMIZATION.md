# Image Optimization Guide

This document outlines the image optimization strategy for the Course Marketplace Platform, ensuring compliance with performance requirements 18.16-18.20.

## Overview

The platform implements comprehensive image optimization to achieve:

- Fast page loads (LCP < 2.5s)
- Minimal bandwidth usage
- Excellent user experience across all devices
- Automatic format conversion (WebP with JPEG fallback)

## Requirements Compliance

### Requirement 18.16: Lazy Loading

**Status:** ✅ Implemented

All images below the fold are automatically lazy-loaded using Next.js Image component's built-in lazy loading.

```tsx
// Images are lazy-loaded by default unless marked as priority
<OptimizedImage src="/course-thumbnail.jpg" alt="Course thumbnail" width={600} height={400} />
```

### Requirement 18.17: Video Lazy Loading

**Status:** ✅ Implemented

Video content is lazy-loaded and only loads when user initiates playback. See video player implementation in `app/components/templates/video-template.tsx`.

### Requirement 18.18: WebP Format with JPEG Fallback

**Status:** ✅ Implemented

Next.js automatically converts images to WebP format with JPEG fallback based on browser support. Configuration in `next.config.ts`:

```typescript
images: {
  formats: ['image/webp', 'image/avif'],
}
```

### Requirement 18.19: Image Size Limit (200KB)

**Status:** ✅ Implemented

- Client-side validation enforces 200KB limit
- Compression utilities available for oversized images
- Quality setting optimized to 75 for good balance

### Requirement 18.20: Responsive Images with srcset

**Status:** ✅ Implemented

All images use responsive srcset for different viewport sizes:

```tsx
<OptimizedImage
  src="/image.jpg"
  alt="Description"
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

## Components

### OptimizedImage Component

Location: `app/components/ui/optimized-image.tsx`

A wrapper around Next.js Image component with built-in optimizations:

```tsx
import { OptimizedImage } from '@/app/components/ui/optimized-image';

// Basic usage
<OptimizedImage
  src="/course-thumbnail.jpg"
  alt="Course thumbnail"
  width={600}
  height={400}
/>

// Fill container
<OptimizedImage
  src="/hero-image.jpg"
  alt="Hero"
  fill
  sizes="100vw"
  priority // Above the fold
/>

// Custom quality
<OptimizedImage
  src="/high-quality.jpg"
  alt="High quality image"
  width={1200}
  height={800}
  quality={85}
/>
```

#### Props

| Prop        | Type    | Default  | Description                                |
| ----------- | ------- | -------- | ------------------------------------------ |
| `src`       | string  | required | Image source URL                           |
| `alt`       | string  | required | Alt text for accessibility                 |
| `width`     | number  | optional | Image width (required if not using fill)   |
| `height`    | number  | optional | Image height (required if not using fill)  |
| `fill`      | boolean | false    | Fill parent container                      |
| `sizes`     | string  | auto     | Responsive sizes string                    |
| `quality`   | number  | 75       | Image quality (1-100)                      |
| `priority`  | boolean | false    | Load image with high priority (above fold) |
| `className` | string  | ''       | CSS classes                                |
| `objectFit` | string  | 'cover'  | Object fit style                           |

### Image Optimization Utilities

Location: `app/lib/utils/image-optimization.ts`

#### Validation

```typescript
import {
  validateImageSize,
  validateImageFormat,
  getImageValidationError,
} from "@/app/lib/utils/image-optimization";

// Validate image file
const file = event.target.files[0];

if (!validateImageFormat(file)) {
  console.error("Invalid format");
}

if (!validateImageSize(file)) {
  console.error("File too large");
}

// Get error message
const error = getImageValidationError(file);
if (error) {
  alert(error);
}
```

#### Compression

```typescript
import { compressImage } from "@/app/lib/utils/image-optimization";

// Compress image to meet size requirements
const file = event.target.files[0];
const compressed = await compressImage(file);

// Upload compressed file
await uploadImage(compressed);
```

#### Responsive Sizes

```typescript
import { generateResponsiveSizes } from "@/app/lib/utils/image-optimization";

// Generate sizes string
const sizes = generateResponsiveSizes();
// Result: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"

// Custom breakpoints
const customSizes = generateResponsiveSizes({
  mobile: 768,
  tablet: 1280,
});
```

## Best Practices

### 1. Always Use OptimizedImage Component

❌ **Don't:**

```tsx
<img src="/image.jpg" alt="Image" />
```

✅ **Do:**

```tsx
<OptimizedImage src="/image.jpg" alt="Image" width={600} height={400} />
```

### 2. Set Priority for Above-the-Fold Images

Images visible on initial page load should be marked as priority:

```tsx
<OptimizedImage
  src="/hero.jpg"
  alt="Hero"
  fill
  priority // Loads immediately
/>
```

### 3. Use Appropriate Sizes

Provide accurate sizes prop for responsive images:

```tsx
// Full width on mobile, half width on tablet, third width on desktop
<OptimizedImage
  src="/image.jpg"
  alt="Image"
  fill
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
```

### 4. Optimize Quality Based on Use Case

| Use Case     | Recommended Quality |
| ------------ | ------------------- |
| Thumbnails   | 70                  |
| Course cards | 75                  |
| Hero images  | 80                  |
| Avatars      | 75                  |
| Backgrounds  | 70                  |

### 5. Validate Before Upload

Always validate images before uploading:

```tsx
const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // Validate
  const error = getImageValidationError(file);
  if (error) {
    alert(error);
    return;
  }

  // Compress if needed
  let uploadFile = file;
  if (file.size > IMAGE_CONSTRAINTS.MAX_SIZE_BYTES) {
    uploadFile = await compressImage(file);
  }

  // Upload
  await uploadImage(uploadFile);
};
```

### 6. Use Appropriate Dimensions

Refer to `IMAGE_DIMENSIONS` constant for recommended sizes:

```typescript
import { IMAGE_DIMENSIONS } from "@/app/lib/utils/image-optimization";

// Thumbnail: 400x300
// Card: 600x400
// Hero: 1200x600
// Avatar: 200x200
// Preview: 800x450
```

## Performance Monitoring

### Lighthouse Metrics

Monitor these metrics to ensure image optimization is effective:

- **LCP (Largest Contentful Paint):** < 2.5s
- **CLS (Cumulative Layout Shift):** < 0.1
- **Total Image Size:** < 500KB per page

### Tools

1. **Chrome DevTools Network Tab**
   - Check image sizes
   - Verify WebP format is served
   - Monitor lazy loading

2. **Lighthouse Audit**

   ```bash
   npm run lighthouse
   ```

3. **Next.js Image Analyzer**
   ```bash
   npm run analyze
   ```

## Common Issues and Solutions

### Issue: Images Not Lazy Loading

**Solution:** Ensure images are not marked as `priority` and are below the fold.

```tsx
// Remove priority for below-fold images
<OptimizedImage src="/image.jpg" alt="Image" width={600} height={400} />
```

### Issue: Large Image File Sizes

**Solution:** Use compression utility or reduce quality:

```tsx
// Lower quality for large images
<OptimizedImage src="/large-image.jpg" alt="Large image" width={1200} height={800} quality={70} />
```

### Issue: Layout Shift (CLS)

**Solution:** Always specify width and height or use fill with proper container:

```tsx
// Specify dimensions
<OptimizedImage src="/image.jpg" alt="Image" width={600} height={400} />

// Or use fill with sized container
<div className="relative w-full h-48">
  <OptimizedImage src="/image.jpg" alt="Image" fill />
</div>
```

### Issue: External Images Not Loading

**Solution:** Add domain to `remotePatterns` in `next.config.ts`:

```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'your-cdn.com',
    },
  ],
}
```

## Testing

### Manual Testing Checklist

- [ ] Images load with WebP format in Chrome DevTools
- [ ] Images below fold are lazy-loaded
- [ ] No layout shift when images load
- [ ] Images are responsive on mobile/tablet/desktop
- [ ] File sizes are under 200KB
- [ ] Loading states display correctly
- [ ] Error states display correctly

### Automated Testing

```typescript
// Test image validation
import { validateImageSize, validateImageFormat } from "@/app/lib/utils/image-optimization";

describe("Image Validation", () => {
  it("should reject oversized images", () => {
    const largeFile = new File([new ArrayBuffer(300 * 1024)], "large.jpg", {
      type: "image/jpeg",
    });
    expect(validateImageSize(largeFile)).toBe(false);
  });

  it("should accept valid images", () => {
    const validFile = new File([new ArrayBuffer(100 * 1024)], "valid.jpg", {
      type: "image/jpeg",
    });
    expect(validateImageSize(validFile)).toBe(true);
  });
});
```

## Migration Guide

### Migrating Existing Images

1. **Find all image usage:**

   ```bash
   grep -r "<img" app/
   ```

2. **Replace with OptimizedImage:**

   ```tsx
   // Before
   <img src="/image.jpg" alt="Image" className="w-full h-48" />

   // After
   <OptimizedImage
     src="/image.jpg"
     alt="Image"
     fill
     className="object-cover"
   />
   ```

3. **Update imports:**

   ```tsx
   import { OptimizedImage } from "@/app/components/ui/optimized-image";
   ```

4. **Test thoroughly:**
   - Visual regression testing
   - Performance testing
   - Accessibility testing

## Resources

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [WebP Format](https://developers.google.com/speed/webp)
- [Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)

## Support

For questions or issues related to image optimization:

1. Check this documentation
2. Review the component source code
3. Check Next.js Image documentation
4. Contact the development team
