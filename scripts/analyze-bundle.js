#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 *
 * Analyzes the Next.js build output to ensure bundle size requirements are met.
 *
 * Requirements:
 * - Initial JS bundle < 200KB gzipped (Requirement 18.7)
 * - Total JS bundle < 500KB gzipped (Requirement 18.8)
 * - No route chunk > 150KB gzipped (Requirement 18.10)
 *
 * Usage:
 *   npm run build
 *   node scripts/analyze-bundle.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { gzipSync } = require("zlib");
/* eslint-enable @typescript-eslint/no-require-imports */

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  bold: "\x1b[1m",
};

// Size limits (in bytes)
const LIMITS = {
  INITIAL_JS: 200 * 1024, // 200KB
  TOTAL_JS: 500 * 1024, // 500KB
  ROUTE_CHUNK: 150 * 1024, // 150KB
};

/**
 * Get gzipped size of a file
 */
function getGzipSize(filePath) {
  const content = fs.readFileSync(filePath);
  const gzipped = gzipSync(content);
  return gzipped.length;
}

/**
 * Format bytes to human-readable size
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

/**
 * Get color based on size vs limit
 */
function getColor(size, limit) {
  const percentage = (size / limit) * 100;
  if (percentage > 100) return colors.red;
  if (percentage > 90) return colors.yellow;
  return colors.green;
}

/**
 * Analyze Next.js build output
 */
function analyzeBuild() {
  const buildDir = path.join(process.cwd(), ".next");

  if (!fs.existsSync(buildDir)) {
    console.error(
      `${colors.red}Error: Build directory not found. Run 'npm run build' first.${colors.reset}`
    );
    process.exit(1);
  }

  console.log(`${colors.bold}${colors.blue}📦 Bundle Size Analysis${colors.reset}\n`);

  // Find all JS files in the build
  const staticDir = path.join(buildDir, "static");
  const chunks = [];
  let totalSize = 0;
  let initialSize = 0;

  function scanDirectory(dir, prefix = "") {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath, `${prefix}${file}/`);
      } else if (file.endsWith(".js")) {
        const size = stat.size;
        const gzipSize = getGzipSize(filePath);
        const relativePath = `${prefix}${file}`;

        chunks.push({
          path: relativePath,
          size,
          gzipSize,
          isInitial: relativePath.includes("main-") || relativePath.includes("webpack-"),
        });

        totalSize += gzipSize;
        if (relativePath.includes("main-") || relativePath.includes("webpack-")) {
          initialSize += gzipSize;
        }
      }
    }
  }

  scanDirectory(staticDir);

  // Sort chunks by gzipped size (largest first)
  chunks.sort((a, b) => b.gzipSize - a.gzipSize);

  // Display results
  console.log(`${colors.bold}Chunk Sizes (gzipped):${colors.reset}\n`);

  chunks.forEach((chunk) => {
    const color = getColor(chunk.gzipSize, LIMITS.ROUTE_CHUNK);
    const status = chunk.gzipSize > LIMITS.ROUTE_CHUNK ? "❌" : "✅";
    const label = chunk.isInitial ? "[INITIAL]" : "";

    console.log(
      `${status} ${color}${formatSize(chunk.gzipSize).padEnd(10)}${colors.reset} ${label} ${chunk.path}`
    );
  });

  // Summary
  console.log(`\n${colors.bold}Summary:${colors.reset}\n`);

  // Initial bundle size
  const initialColor = getColor(initialSize, LIMITS.INITIAL_JS);
  const initialStatus = initialSize <= LIMITS.INITIAL_JS ? "✅" : "❌";
  console.log(
    `${initialStatus} Initial JS Bundle: ${initialColor}${formatSize(initialSize)}${colors.reset} / ${formatSize(LIMITS.INITIAL_JS)} (${((initialSize / LIMITS.INITIAL_JS) * 100).toFixed(1)}%)`
  );

  // Total bundle size
  const totalColor = getColor(totalSize, LIMITS.TOTAL_JS);
  const totalStatus = totalSize <= LIMITS.TOTAL_JS ? "✅" : "❌";
  console.log(
    `${totalStatus} Total JS Bundle:   ${totalColor}${formatSize(totalSize)}${colors.reset} / ${formatSize(LIMITS.TOTAL_JS)} (${((totalSize / LIMITS.TOTAL_JS) * 100).toFixed(1)}%)`
  );

  // Largest chunk
  const largestChunk = chunks[0];
  const largestColor = getColor(largestChunk.gzipSize, LIMITS.ROUTE_CHUNK);
  const largestStatus = largestChunk.gzipSize <= LIMITS.ROUTE_CHUNK ? "✅" : "❌";
  console.log(
    `${largestStatus} Largest Chunk:     ${largestColor}${formatSize(largestChunk.gzipSize)}${colors.reset} / ${formatSize(LIMITS.ROUTE_CHUNK)} (${((largestChunk.gzipSize / LIMITS.ROUTE_CHUNK) * 100).toFixed(1)}%)`
  );

  // Check for violations
  const violations = [];

  if (initialSize > LIMITS.INITIAL_JS) {
    violations.push(
      `Initial bundle exceeds limit by ${formatSize(initialSize - LIMITS.INITIAL_JS)}`
    );
  }

  if (totalSize > LIMITS.TOTAL_JS) {
    violations.push(`Total bundle exceeds limit by ${formatSize(totalSize - LIMITS.TOTAL_JS)}`);
  }

  const oversizedChunks = chunks.filter((c) => c.gzipSize > LIMITS.ROUTE_CHUNK);
  if (oversizedChunks.length > 0) {
    violations.push(`${oversizedChunks.length} chunk(s) exceed 150KB limit`);
  }

  // Final verdict
  console.log();
  if (violations.length > 0) {
    console.log(`${colors.red}${colors.bold}❌ Bundle size requirements NOT met:${colors.reset}`);
    violations.forEach((v) => console.log(`   ${colors.red}• ${v}${colors.reset}`));
    console.log();
    console.log(`${colors.yellow}Suggestions:${colors.reset}`);
    console.log(`   • Use lazy loading for heavy components`);
    console.log(`   • Split large vendor libraries into separate chunks`);
    console.log(`   • Remove unused dependencies`);
    console.log(`   • Use dynamic imports for route-specific code`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bold}✅ All bundle size requirements met!${colors.reset}`);
    process.exit(0);
  }
}

// Run analysis
try {
  analyzeBuild();
} catch (error) {
  console.error(`${colors.red}Error analyzing bundle:${colors.reset}`, error.message);
  process.exit(1);
}
