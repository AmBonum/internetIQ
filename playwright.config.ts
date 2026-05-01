import { defineConfig, devices } from "@playwright/test";

/**
 * E2E config — separate from Vitest (`tests/` is for unit tests).
 * Playwright tests live in `e2e/` so vitest's vitest.config.ts and this
 * playwright.config.ts don't collide on the same directory.
 *
 * Run against the local Vite + Wrangler stack (npm run dev + npm run dev:api).
 * If you want to run against staging or prod, override BASE_URL:
 *   BASE_URL=https://subenai.sk npx playwright test
 */
const BASE_URL = process.env.BASE_URL ?? "http://localhost:8080";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Uncomment when you want Playwright to spin Vite on its own. For day-to-day
  // testing keep it commented and start the stack manually (npm run dev:api +
  // npm run dev) — that way HMR + console output stay in your terminals.
  // webServer: {
  //   command: "npm run dev",
  //   url: BASE_URL,
  //   reuseExistingServer: !process.env.CI,
  // },
});
