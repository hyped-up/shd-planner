import { defineConfig } from "vitest/config";
import path from "path";

// Vitest configuration for SHD Planner tests
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
