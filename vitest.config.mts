import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    exclude: ["e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      include: [
        "lib/assessment/level-engine.ts",
        "lib/reports/{docx,export,format,routes,xlsx}.ts",
      ],
      thresholds: {
        statements: 75,
        branches: 75,
        functions: 75,
        lines: 75,
        "lib/assessment/level-engine.ts": {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
        "lib/reports/routes.ts": {
          statements: 90,
          branches: 90,
          functions: 90,
          lines: 90,
        },
      },
    },
  },
});
