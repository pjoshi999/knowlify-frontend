/**
 * CDN URL Utilities
 * Replaces S3 URLs with CloudFront URLs for better performance and caching
 */

const S3_DOMAIN = "https://kuvaka-assets.s3.ap-south-1.amazonaws.com";
const CLOUDFRONT_DOMAIN = "https://dgya6k8wie3d0.cloudfront.net";

// Enable CloudFront replacement
const USE_CLOUDFRONT = true;

/**
 * Replaces S3 URL with CloudFront URL
 * @param url - The original S3 URL
 * @returns The CloudFront URL (or S3 URL if CloudFront is disabled)
 */
export function replaceS3WithCloudFront(url: string | null | undefined): string {
  if (!url) return "";

  // If CloudFront is disabled, return original URL
  if (!USE_CLOUDFRONT) {
    if (process.env.NODE_ENV === "development") {
      console.log("[CDN] CloudFront disabled, using S3 URL:", url);
    }
    return url;
  }

  // Replace S3 domain with CloudFront domain
  const replaced = url.replace(S3_DOMAIN, CLOUDFRONT_DOMAIN);

  // Debug logging in development
  if (process.env.NODE_ENV === "development" && url !== replaced) {
    console.log("[CDN] Replaced URL:", { original: url, replaced });
  }

  return replaced;
}

/**
 * Processes an object and replaces all S3 URLs with CloudFront URLs
 * Useful for API responses containing multiple URL fields
 */
export function replaceS3UrlsInObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") return obj;

  const processed = { ...obj };

  for (const key in processed) {
    const value = processed[key];

    if (typeof value === "string" && value.includes(S3_DOMAIN)) {
      processed[key] = replaceS3WithCloudFront(value) as any;
    } else if (Array.isArray(value)) {
      processed[key] = value.map((item: any) =>
        typeof item === "object" ? replaceS3UrlsInObject(item) : item
      ) as any;
    } else if (typeof value === "object" && value !== null) {
      processed[key] = replaceS3UrlsInObject(value) as any;
    }
  }

  return processed;
}

/**
 * Processes course manifest and replaces all S3 URLs with CloudFront URLs
 * Specifically handles videoUrl fields in lessons
 */
export function processManifestUrls(manifest: any): any {
  if (!manifest) return manifest;

  const processed = { ...manifest };

  if (processed.modules && Array.isArray(processed.modules)) {
    processed.modules = processed.modules.map((module: any) => {
      if (module.lessons && Array.isArray(module.lessons)) {
        return {
          ...module,
          lessons: module.lessons.map((lesson: any) => ({
            ...lesson,
            videoUrl: lesson.videoUrl ? replaceS3WithCloudFront(lesson.videoUrl) : lesson.videoUrl,
          })),
        };
      }
      return module;
    });
  }

  return processed;
}
