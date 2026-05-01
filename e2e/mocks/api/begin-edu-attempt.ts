import type { Page, Route } from "@playwright/test";

/**
 * Stub `POST /api/begin-edu-attempt` for browser specs that don't want
 * to hit the real CF Function (e.g. testing UI error states).
 *
 * Usage:
 *   import { stubBeginEduAttempt } from "../../mocks/api/begin-edu-attempt";
 *
 *   test("rate limit shows the slovak warning", async ({ page }) => {
 *     await stubBeginEduAttempt(page, { status: 429, body: { error: "rate_limited" } });
 *     await page.goto("/test/zostava/<id>");
 *     // ...
 *   });
 */
export interface BeginEduAttemptStub {
  status: number;
  body: { token?: string; error?: string };
}

export async function stubBeginEduAttempt(page: Page, stub: BeginEduAttemptStub): Promise<void> {
  await page.route("**/api/begin-edu-attempt", async (route: Route) => {
    await route.fulfill({
      status: stub.status,
      contentType: "application/json",
      body: JSON.stringify(stub.body),
    });
  });
}
