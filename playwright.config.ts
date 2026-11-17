import { defineConfig } from "@playwright/test";

/**
 * E2E sobre el servidor real.
 *
 * Los tests comparten PostgreSQL y crean datos temporales, así que se ejecutan
 * en un solo worker y sin reintentos: un reintento duplicaría las fixtures.
 * `reuseExistingServer` permite usar el `pnpm dev` que ya esté levantado.
 */
const baseURL = "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  outputDir: "test-results",
  use: {
    baseURL,
    browserName: "chromium",
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
