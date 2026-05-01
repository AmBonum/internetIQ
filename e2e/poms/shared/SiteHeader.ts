import type { Locator, Page } from "@playwright/test";

export type NavSlug = "testy" | "skolenia" | "podpora" | "kontakt";

/**
 * Site header POM. Every element the spec asserts on has a getter or
 * method here — specs MUST NOT call `page.locator(...)` /
 * `page.getByTestId(...)` directly (per `.claude/CLAUDE.md` § Test IDs).
 *
 * Locator strategy is `data-testid` first, role/name second.
 */
export class SiteHeader {
  constructor(private readonly page: Page) {}

  // ---------------------------------------------------------------------------
  // Structural locators
  // ---------------------------------------------------------------------------

  get root(): Locator {
    return this.page.getByTestId("header-root");
  }

  get nav(): Locator {
    return this.page.getByTestId("header-nav");
  }

  /**
   * The accessible "Hlavná navigácia" landmark — exposed for TCs that
   * specifically verify ARIA semantics (screen-reader landmark nav).
   * Uses role + name on purpose.
   */
  get navByRole(): Locator {
    return this.page.getByRole("navigation", { name: /Hlavná navigácia/i });
  }

  // ---------------------------------------------------------------------------
  // Desktop nav
  // ---------------------------------------------------------------------------

  get logoLink(): Locator {
    return this.page.getByTestId("header-logo-link");
  }

  get desktopNav(): Locator {
    return this.page.getByTestId("header-desktop-nav");
  }

  navLink(slug: NavSlug): Locator {
    return this.page.getByTestId(`header-nav-link-${slug}`);
  }

  get ctaPill(): Locator {
    return this.page.getByTestId("header-cta-pill");
  }

  /** Long-form suffix ("rýchly ") visible only at lg breakpoints. */
  get ctaPillLongSuffix(): Locator {
    return this.page.getByTestId("header-cta-pill-long-suffix");
  }

  // ---------------------------------------------------------------------------
  // Mobile sheet
  // ---------------------------------------------------------------------------

  get hamburgerTrigger(): Locator {
    return this.page.getByTestId("header-mobile-trigger");
  }

  /** Decorative hamburger icon inside the trigger button. */
  get hamburgerIcon(): Locator {
    return this.hamburgerTrigger.locator("svg");
  }

  get sheet(): Locator {
    return this.page.getByTestId("header-mobile-sheet");
  }

  get sheetCloseButton(): Locator {
    return this.page.getByTestId("header-mobile-close");
  }

  get sheetLogoLink(): Locator {
    return this.page.getByTestId("header-mobile-logo-link");
  }

  sheetNavLink(slug: NavSlug): Locator {
    return this.page.getByTestId(`header-mobile-nav-link-${slug}`);
  }

  get sheetCtaLink(): Locator {
    return this.page.getByTestId("header-mobile-cta");
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async openMobileMenu(): Promise<void> {
    await this.hamburgerTrigger.click();
    await this.sheet.waitFor({ state: "visible" });
  }

  async closeMobileMenu(): Promise<void> {
    await this.sheetCloseButton.click();
    await this.sheet.waitFor({ state: "hidden" });
  }

  // ---------------------------------------------------------------------------
  // Computed-state helpers (return values, never assertions)
  // ---------------------------------------------------------------------------

  /** Computed CSS for sticky-position assertions. */
  async rootComputedStyle(): Promise<{ position: string; top: string; zIndex: string }> {
    return this.root.evaluate((el) => {
      const cs = window.getComputedStyle(el);
      return { position: cs.position, top: cs.top, zIndex: cs.zIndex };
    });
  }
}
