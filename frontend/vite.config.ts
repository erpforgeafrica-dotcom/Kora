import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  cacheDir: "node_modules/.vite-runtime-stable",
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/jest-dom-setup.ts", "./src/test/setup.ts"],
    // Vitest on Windows + Node 25 can spike memory with default parallelism.
    // Keep the suite reliable in CI/dev by running a single worker.
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: "c8",
      reporter: ["text", "html"],
      statements: 95,
      branches: 90,
      functions: 95,
      lines: 95
    }
  }
});
