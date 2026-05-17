import { test, expect } from "../../fixtures/base";

/**
 * Browser smoke for the /podpora donation flow.
 *
 * What it covers (intentionally narrow):
 *   - the form submits cleanly with valid input
 *   - /api/create-checkout-session returns a Stripe test-mode Checkout URL
 *   - the browser is redirected to that hosted URL
 *
 * What it does NOT cover (by design):
 *   - filling Stripe's hosted card UI — that page is Stripe-owned and
 *     A/B tested, so automating it is brittle. Card entry happens in
 *     the manual smoke checklist in tasks/E10-webhook-runbook.md.
 *   - the post-payment redirect back to /podakovanie/$sessionId — that
 *     path is exercised by the webhook integration spec, which writes a
 *     signed checkout.session.completed event directly.
 *
 * Pre-requisites to run (local-only — see runbook):
 *   1. .dev.vars filled in with TEST mode STRIPE_SECRET_KEY
 *      (sk_test_…) and SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
 *   2. In a separate terminal: `npm run dev:stripe`
 *      (this boots wrangler on :8788 and stripe listen)
 *   3. Then: `npm run e2e:stripe`
 *
 * BASE_URL pin: this spec targets the wrangler dev port (:8788), not the
 * vite dev port (:8080), because /api/* functions only exist under
 * wrangler. STRIPE_E2E_BASE_URL overrides if your local port differs.
 */
test.use({
  baseURL: process.env.STRIPE_E2E_BASE_URL ?? "http://localhost:8788",
});

test.describe("/podpora — Stripe Checkout redirect (test mode)", () => {
  test("oneoff donation submits and redirects to a Stripe test Checkout session", async ({
    page,
    podpora,
  }) => {
    await test.step("open /podpora and fill the form with valid oneoff input", async () => {
      await podpora.open();
      await expect(podpora.form).toBeVisible();
      await podpora.fillAndSubmit({
        mode: "oneoff",
        amountEur: 5,
        email: "playwright-smoke@subenai-e2e.local",
        name: "Playwright Smoke",
      });
    });

    await test.step("browser redirects to checkout.stripe.com with a cs_test_ session id", async () => {
      await page.waitForURL(/checkout\.stripe\.com\/c\/pay\/cs_test_/i, {
        timeout: 15_000,
      });
      const url = page.url();
      expect(url).toContain("checkout.stripe.com");
      expect(url).toMatch(/cs_test_/);
      expect(url).not.toMatch(/cs_live_/);
    });
  });

  test("/podpora?cancelled=1 surfaces the cancellation banner without an error", async ({
    podpora,
  }) => {
    await podpora.open({ cancelled: true });
    await expect(podpora.cancelledBanner).toBeVisible();
    await expect(podpora.errorBanner).toBeHidden();
  });
});
