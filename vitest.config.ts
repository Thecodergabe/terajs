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
      "@terajs/compiler": path.resolve(__dirname, "./packages/compiler/src"),
      "@terajs/devtools": path.resolve(__dirname, "./packages/devtools/src"),
      "@terajs/reactivity": path.resolve(__dirname, "./packages/reactivity/src"),
      "@terajs/renderer": path.resolve(__dirname, "./packages/renderer/src"),
      "@terajs/renderer-ssr": path.resolve(__dirname, "./packages/renderer-ssr/src"),
      "@terajs/renderer-web": path.resolve(__dirname, "./packages/renderer-web/src"),
      "@terajs/router": path.resolve(__dirname, "./packages/router/src"),
      "@terajs/runtime": path.resolve(__dirname, "./packages/runtime/src"),
      "@terajs/sfc": path.resolve(__dirname, "./packages/sfc/src"),
      "@terajs/shared": path.resolve(__dirname, "./packages/shared/src"),
      "@terajs/ui": path.resolve(__dirname, "./packages/ui/src"),
      "@terajs/vite-plugin": path.resolve(__dirname, "./packages/vite-plug-in/src")
    }
  }
});