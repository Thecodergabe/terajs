import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // Added .spec.js and .test.js just in case some compiled files are being picked up
    include: ["packages/**/*.{test,spec}.{ts,js}"],
    exclude: ["**/dist/**"],
    environment: "jsdom",
    globals: true,
    alias: {
      // Mapping to /src allows Vitest to resolve any file within the package
      "@nebula/reactivity": path.resolve(__dirname, "./packages/reactivity/src"),
      "@nebula/renderer": path.resolve(__dirname, "./packages/renderer/src"),
      "@nebula/shared": path.resolve(__dirname, "./packages/shared/src"),
      "@nebula/sfc": path.resolve(__dirname, "./packages/sfc/src"),
      "@nebula/runtime": path.resolve(__dirname, "./packages/runtime/src")
    }
  }
});