import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", ".next/", "out/", "build/", "**/*.config.*", "**/types/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/components": path.resolve(__dirname, "./app/components"),
      "@/lib": path.resolve(__dirname, "./app/lib"),
      "@/app": path.resolve(__dirname, "./app"),
      "@/styles": path.resolve(__dirname, "./app/styles"),
      "@/types": path.resolve(__dirname, "./app/types"),
    },
  },
});
