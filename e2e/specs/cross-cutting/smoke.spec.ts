import { test, expect } from "@playwright/test";

// Minimal smoke test — verifies the local stack is reachable and the
// app shell renders. The agents (planner, generator, healer) will write
// the real coverage; this one keeps the pipeline alive.
test("home page renders the hero heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("h1").first()).toBeVisible();
});
