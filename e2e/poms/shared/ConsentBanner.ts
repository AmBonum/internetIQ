import type { Page } from "@playwright/test";

/**
 * Cookie consent banner. Composed via fixtures (not inheritance) — every
 * page may show or hide it depending on localStorage state, and tests
 * frequently want to dismiss it before the actual feature interaction.
 *
 * Locators target stable IDs / accessible names so they survive style
 * refactors. If you change the underlying selectors, update them HERE,
 * not in the spec files.
 */
export class ConsentBanner {
  constructor(private readonly page: Page) {}

  private get root() {
    return this.page.locator("#consent-banner-title").locator("..").locator("..");
  }

  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  async acceptAll(): Promise<void> {
    await this.page.getByRole("button", { name: /Prijať všetko/i }).click();
    await this.root.waitFor({ state: "hidden" });
  }

  async rejectAll(): Promise<void> {
    await this.page.getByRole("button", { name: /Odmietnuť všetko/i }).click();
    await this.root.waitFor({ state: "hidden" });
  }

  async openPreferences(): Promise<void> {
    await this.page.getByRole("button", { name: /Nastavenia/i }).click();
  }
}
