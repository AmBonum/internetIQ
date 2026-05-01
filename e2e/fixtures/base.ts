import { test as base } from "@playwright/test";
import { ConsentBanner } from "../poms/shared/ConsentBanner";
import { SiteHeader } from "../poms/shared/SiteHeader";
import { SiteFooter } from "../poms/shared/SiteFooter";
import { NotFoundPage } from "../poms/shared/NotFoundPage";
import { HomePage } from "../poms/quiz/HomePage";

/**
 * Composed test fixture — the canonical way to access POMs and shared
 * mocks across this suite.
 *
 * Spec files import `test` from here, NOT from "@playwright/test":
 *
 *   import { test, expect } from "../../fixtures/base";
 *
 *   test("CTA opens the quiz", async ({ home, consent }) => {
 *     await home.open();
 *     if (await consent.isVisible()) await consent.acceptAll();
 *     await home.clickStart();
 *     await expect(...).toBeVisible();
 *   });
 *
 * Why fixtures and not `new HomePage(page)` per test:
 *   - fixtures are lazy — `home` is only constructed if the test names it
 *   - they unify async setup/teardown (auth tokens, seeded data)
 *   - they keep specs short — no boilerplate POM wiring per test
 */
type Fixtures = {
  home: HomePage;
  consent: ConsentBanner;
  header: SiteHeader;
  footer: SiteFooter;
  notFound: NotFoundPage;
};

export const test = base.extend<Fixtures>({
  home: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  consent: async ({ page }, use) => {
    await use(new ConsentBanner(page));
  },
  header: async ({ page }, use) => {
    await use(new SiteHeader(page));
  },
  footer: async ({ page }, use) => {
    await use(new SiteFooter(page));
  },
  notFound: async ({ page }, use) => {
    await use(new NotFoundPage(page));
  },
});

export { expect } from "@playwright/test";
