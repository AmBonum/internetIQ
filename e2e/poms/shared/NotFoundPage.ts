import type { Locator, Page } from "@playwright/test";

/**
 * 404 page POM — `__root.tsx` `NotFoundComponent`.
 *
 * Renders for any unknown route. Intentionally does NOT include
 * `<Footer>`; tests that assert footer absence on 404 use this POM
 * for the positive heading checks.
 */
export class NotFoundPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByRole("heading", { name: "404" });
  }

  get subheading(): Locator {
    return this.page.getByText("Stránka nenájdená");
  }
}
