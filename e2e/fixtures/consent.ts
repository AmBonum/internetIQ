import type { BrowserContext } from "@playwright/test";

/**
 * Pre-seed the cookie consent decision so a test that doesn't care
 * about the banner can skip past it without a click.
 *
 * Usage:
 *   import { test } from "@/e2e/fixtures/base";
 *   import { primeConsent } from "@/e2e/fixtures/consent";
 *
 *   test.beforeEach(async ({ context }) => {
 *     await primeConsent(context, "all");   // or "necessary-only"
 *   });
 *
 * The shape mirrors what the app writes to localStorage (see
 * `src/lib/consent.ts`). Keep the version + categories in lock-step
 * with that file or the banner will re-show on the next CONSENT_VERSION
 * bump.
 */
export type ConsentPreset = "all" | "necessary-only";

const CONSENT_STORAGE_KEY = "iiq_consent";
const CONSENT_VERSION = "1.3.0"; // KEEP IN SYNC with src/lib/consent.ts

export async function primeConsent(context: BrowserContext, preset: ConsentPreset): Promise<void> {
  const granted = preset === "all";
  const record = {
    version: CONSENT_VERSION,
    timestamp: new Date().toISOString(),
    categories: {
      necessary: true,
      preferences: granted,
      analytics: granted,
      marketing: granted,
    },
  };
  await context.addInitScript(
    ({ key, value }: { key: string; value: string }) => {
      window.localStorage.setItem(key, value);
    },
    { key: CONSENT_STORAGE_KEY, value: JSON.stringify(record) },
  );
}
