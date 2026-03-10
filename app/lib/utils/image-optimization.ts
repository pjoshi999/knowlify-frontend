/**
 * Image Optimization Utilities
 *
 * Provides utilities for image optimization including:
 * - Size validation
 * - Format conversion helpers
 * - Responsive image srcset generation
 * - Image compression recommendations
 *
 * Requirements: 18.16, 18.17, 18.18, 18.19, 18.20
 */

export const IMAGE_CONSTRAINTS = {
  MAX_SIZE_BYTES: 200 * 1024, // 200KB max per requirement 18.19
  SUPPORTED_FORMATS: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  RECOMMENDED_QUALITY: 75, // Balance between quality and file size
  RECOMMENDED_FORMATS: ["image/webp", "image/jpeg"], // WebP with JPEG fallback
} as const;

export const RESPONSIVE_BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1920,
} as const;

/**
 * Validates if an image file meets size requirements
 * @param file - The image file to validate
 * @returns true if file size is within limits
 */
export function validateImageSize(file: File): boolean {
  return file.size <= IMAGE_CONSTRAINTS.MAX_SIZE_BYTES;
}

/**
 * Validates if an image file is a supported format
 * @param file - The image file to validate
 * @returns true if file format is supported
 */
export function validateImageFormat(file: File): boolean {
  return IMAGE_CONSTRAINTS.SUPPORTED_FORMATS.includes(file.type as any);
}

/**
 * Gets a human-readable error message for image validation failures
 * @param file - The image file that failed validation
 * @returns Error message string
 */
export function getImageValidationError(file: File): string | null {
  if (!validateImageFormat(file)) {
    return `Unsupported image format: ${file.type}. Please use JPEG, PNG, WebP, or GIF.`;
  }

  if (!validateImageSize(file)) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const maxSizeMB = (IMAGE_CONSTRAINTS.MAX_SIZE_BYTES / (1024 * 1024)).toFixed(2);
    return `Image size (${sizeMB}MB) exceeds maximum allowed size of ${maxSizeMB}MB. Please compress the image.`;
  }

  return null;
}

/**
 * Generates responsive image sizes string for Next.js Image component
 * @param breakpoints - Custom breakpoints (optional)
 * @returns sizes string for responsive images
 */
export function generateResponsiveSizes(
  breakpoints?: Partial<typeof RESPONSIVE_BREAKPOINTS>
): string {
  const bp = { ...RESPONSIVE_BREAKPOINTS, ...breakpoints };

  return `(max-width: ${bp.mobile}px) 100vw, (max-width: ${bp.tablet}px) 50vw, 33vw`;
}

/**
 * Generates srcset for responsive images
 * @param baseUrl - Base URL of the image
 * @param widths - Array of widths to generate
 * @returns srcset string
 */
export function generateSrcSet(baseUrl: string, widths: number[]): string {
  return widths.map((width) => `${baseUrl}?w=${width} ${width}w`).join(", ");
}

/**
 * Gets recommended image dimensions based on usage context
 */
export const IMAGE_DIMENSIONS = {
  thumbnail: { width: 400, height: 300 },
  card: { width: 600, height: 400 },
  hero: { width: 1200, height: 600 },
  avatar: { width: 200, height: 200 },
  preview: { width: 800, height: 450 },
} as const;

/**
 * Calculates optimal quality setting based on image dimensions
 * @param width - Image width
 * @param height - Image height
 * @returns Recommended quality (1-100)
 */
export function calculateOptimalQuality(width: number, height: number): number {
  const pixels = width * height;

  // Larger images can use lower quality without noticeable degradation
  if (pixels > 1000000) return 70; // > 1MP
  if (pixels > 500000) return 75; // > 0.5MP
  return 80; // Smaller images
}

/**
 * Checks if an image should be lazy loaded based on its position
 * @param isAboveFold - Whether the image is above the fold
 * @param isPriority - Whether the image is marked as priority
 * @returns true if image should be lazy loaded
 */
export function shouldLazyLoad(isAboveFold: boolean, isPriority: boolean): boolean {
  // Requirement 18.16: Lazy-load all images below the fold
  return !isAboveFold && !isPriority;
}

/**
 * Compresses an image file (client-side)
 * @param file - The image file to compress
 * @param maxSizeBytes - Maximum size in bytes
 * @param quality - Compression quality (0-1)
 * @returns Promise resolving to compressed file
 */
export async function compressImage(
  file: File,
  maxSizeBytes: number = IMAGE_CONSTRAINTS.MAX_SIZE_BYTES,
  quality: number = 0.75
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new window.Image();

      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        // Calculate dimensions maintaining aspect ratio
        let { width, height } = img;
        const maxDimension = 1920; // Max dimension for any side

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            // Check if compressed size is acceptable
            if (blob.size <= maxSizeBytes) {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // Try with lower quality
              const lowerQuality = quality * 0.8;
              if (lowerQuality < 0.1) {
                reject(new Error("Unable to compress image to required size"));
                return;
              }
              compressImage(file, maxSizeBytes, lowerQuality).then(resolve).catch(reject);
            }
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Gets image metadata without loading the full image
 * @param file - The image file
 * @returns Promise resolving to image dimensions
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new window.Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
