// spec: specs/cross-cutting/site-header-and-menu.md

import { test, expect } from "../../fixtures/base";
import { primeConsent } from "../../fixtures/consent";

test.describe("Site header and responsive navigation menu", () => {
  test.beforeEach(async ({ context }) => {
    await primeConsent(context, "all");
  });

  // ---------------------------------------------------------------------------
  // Happy paths
  // ---------------------------------------------------------------------------

  test.describe("Happy paths", () => {
    test("TC-01: All four desktop nav links are visible and route to their targets", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");

      await expect(header.nav).toBeVisible();
      await expect(header.navLink("testy")).toBeVisible();
      await expect(header.navLink("skolenia")).toBeVisible();
      await expect(header.navLink("podpora")).toBeVisible();
      await expect(header.navLink("kontakt")).toBeVisible();

      await header.navLink("testy").click();
      await expect(page).toHaveURL(/\/testy$/);

      await page.goto("/");
      await header.navLink("skolenia").click();
      await expect(page).toHaveURL(/\/skolenia$/);

      await page.goto("/");
      await header.navLink("podpora").click();
      await expect(page).toHaveURL(/\/podpora$/);

      await page.goto("/");
      await header.navLink("kontakt").click();
      await expect(page).toHaveURL(/\/kontakt$/);
    });

    test("TC-02: The logo links to the home page from any route", async ({ page, header }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/testy");

      await header.logoLink.click();
      await expect(page).toHaveURL(/\/$/);
      await expect(header.root).toBeVisible();
    });

    test("TC-03: The CTA pill navigates to /test and adapts its label to the viewport", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");

      await expect(header.ctaPill).toHaveAccessibleName(/Spustiť rýchly test/i);
      await expect(header.ctaPillLongSuffix).toBeVisible();

      await page.setViewportSize({ width: 900, height: 700 });
      await expect(header.ctaPillLongSuffix).toBeHidden();
      await expect(header.ctaPill).toHaveAccessibleName(/Spustiť rýchly test/i);

      await header.ctaPill.click();
      await expect(page).toHaveURL(/\/test$/);
    });

    test("TC-04: The mobile hamburger opens a Sheet containing every nav item plus the CTA", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      await expect(header.desktopNav).toBeHidden();
      await expect(header.hamburgerTrigger).toBeVisible();

      await header.openMobileMenu();

      await expect(header.sheetCloseButton).toBeVisible();
      await expect(header.sheetLogoLink).toBeVisible();
      await expect(header.sheetNavLink("testy")).toBeVisible();
      await expect(header.sheetNavLink("skolenia")).toBeVisible();
      await expect(header.sheetNavLink("podpora")).toBeVisible();
      await expect(header.sheetNavLink("kontakt")).toBeVisible();
      await expect(header.sheetCtaLink).toBeVisible();
      await expect(header.sheetCtaLink).toHaveText(/Spustiť test/);

      await header.closeMobileMenu();
      await expect(header.hamburgerTrigger).toBeVisible();
    });

    test("TC-05: Clicking a nav link inside the Sheet navigates and auto-closes the menu", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await header.openMobileMenu();

      await header.sheetNavLink("testy").click();

      await expect(page).toHaveURL(/\/testy$/);
      await expect(header.sheet).toBeHidden();
      await expect(header.hamburgerTrigger).toBeVisible();
    });

    test("TC-06: Active route is highlighted in the desktop nav", async ({ page, header }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/skolenia");

      await expect(header.navLink("skolenia")).toHaveClass(/text-foreground/);
      await expect(header.navLink("testy")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("podpora")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("kontakt")).toHaveClass(/text-muted-foreground/);

      await page.goto("/podpora");
      await expect(header.navLink("podpora")).toHaveClass(/text-foreground/);
      await expect(header.navLink("skolenia")).toHaveClass(/text-muted-foreground/);
    });

    test("TC-07: A nested route (/testy/eshop) highlights only the most-specific matching nav entry", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/testy/eshop");

      await expect(header.navLink("testy")).toHaveClass(/text-foreground/);
      await expect(header.navLink("skolenia")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("podpora")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("kontakt")).toHaveClass(/text-muted-foreground/);
    });

    test("TC-08: Active route is highlighted inside the mobile Sheet", async ({ page, header }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/skolenia");
      await header.openMobileMenu();

      await expect(header.sheetNavLink("skolenia")).toHaveClass(/bg-primary\/10/);
      await expect(header.sheetNavLink("testy")).not.toHaveClass(/bg-primary\/10/);
      await expect(header.sheetNavLink("podpora")).not.toHaveClass(/bg-primary\/10/);
      await expect(header.sheetNavLink("kontakt")).not.toHaveClass(/bg-primary\/10/);
    });
  });

  // ---------------------------------------------------------------------------
  // Negative scenarios
  // ---------------------------------------------------------------------------

  test.describe("Negative scenarios", () => {
    test("TC-09: The hamburger trigger is not visible on a desktop viewport", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");

      await expect(header.hamburgerTrigger).toBeHidden();
      await expect(header.desktopNav).toBeVisible();
    });

    test("TC-10: The desktop nav is not visible on a mobile viewport", async ({ page, header }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      await expect(header.desktopNav).toBeHidden();
      await expect(header.hamburgerTrigger).toBeVisible();
    });

    test("TC-11: The header still renders on an unknown (404) route", async ({ page, header }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/this-route-does-not-exist");

      await expect(header.root).toBeVisible();
      await expect(header.navLink("testy")).toBeVisible();
      await expect(header.navLink("skolenia")).toBeVisible();
      await expect(header.navLink("podpora")).toBeVisible();
      await expect(header.navLink("kontakt")).toBeVisible();
      await expect(header.ctaPill).toBeVisible();

      await expect(header.navLink("testy")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("skolenia")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("podpora")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("kontakt")).toHaveClass(/text-muted-foreground/);
    });

    test("TC-12: Repeatedly opening and closing the mobile Sheet does not leak state", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      for (let i = 0; i < 10; i++) {
        await header.openMobileMenu();
        await header.closeMobileMenu();
      }

      expect(errors).toHaveLength(0);
      await expect(header.hamburgerTrigger).toBeVisible();
    });

    test("TC-13: The route /test does not appear as an active nav item (CTA excluded from NAV_ITEMS)", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/test");

      await expect(header.navLink("testy")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("skolenia")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("podpora")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("kontakt")).toHaveClass(/text-muted-foreground/);
      await expect(header.ctaPill).not.toHaveClass(/bg-primary\/10/);
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  test.describe("Edge cases", () => {
    test("TC-14: Breakpoint at exactly 768 px swaps desktop nav and hamburger", async ({
      page,
      header,
    }) => {
      await page.goto("/");

      await page.setViewportSize({ width: 767, height: 800 });
      await expect(header.hamburgerTrigger).toBeVisible();
      await expect(header.desktopNav).toBeHidden();

      const logoBeforeResize = await header.logoLink.boundingBox();
      await page.setViewportSize({ width: 768, height: 800 });
      await expect(header.desktopNav).toBeVisible();
      await expect(header.hamburgerTrigger).toBeHidden();
      const logoAfterResize = await header.logoLink.boundingBox();

      expect(logoAfterResize?.x).toBeCloseTo(logoBeforeResize?.x ?? 0, -1);
    });

    test("TC-15: At 375×667 the header fits the viewport without horizontal scroll", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(375);

      await header.openMobileMenu();
      await expect(header.sheetCtaLink).toBeVisible();
    });

    test("TC-16: Keyboard tab order on the desktop header", async ({ page, header }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/");

      await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());

      await page.keyboard.press("Tab");
      await expect(header.logoLink).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(header.navLink("testy")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(header.navLink("skolenia")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(header.navLink("podpora")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(header.navLink("kontakt")).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(header.ctaPill).toBeFocused();

      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/\/test$/);
    });

    test("TC-17: Focus trap inside the mobile Sheet and Escape closes it", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await header.openMobileMenu();

      await expect(header.sheetCloseButton).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(header.sheet).toBeHidden();
      await expect(header.hamburgerTrigger).toBeFocused();
    });

    test("TC-18: Required ARIA attributes are present and correct", async ({ page, header }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");

      await expect(header.navByRole).toHaveAccessibleName(/Hlavná navigácia/i);
      await expect(header.logoLink).toHaveAccessibleName(/subenai — domov/i);
      await expect(header.hamburgerTrigger).toHaveAccessibleName(/Otvoriť menu/i);

      await header.openMobileMenu();
      await expect(header.sheetCloseButton).toHaveAccessibleName(/Zavrieť menu/i);
      await expect(header.sheetCtaLink).toHaveAccessibleName(/Spustiť rýchly test/i);

      await expect(header.hamburgerIcon).toHaveAttribute("aria-hidden", "true");
    });

    test("TC-19: Browser back button after the Sheet auto-closed on navigation", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await header.openMobileMenu();

      await header.sheetNavLink("skolenia").click();
      await expect(page).toHaveURL(/\/skolenia$/);
      await expect(header.sheet).toBeHidden();

      await page.goBack();
      await expect(page).toHaveURL(/\/$/);
      await expect(header.sheet).toBeHidden();
      await expect(header.hamburgerTrigger).toBeVisible();
    });

    test("TC-20: Hash navigation does not toggle active state", async ({ page, header }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/#section");

      await expect(header.navLink("testy")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("skolenia")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("podpora")).toHaveClass(/text-muted-foreground/);
      await expect(header.navLink("kontakt")).toHaveClass(/text-muted-foreground/);
    });

    test("TC-21: Sticky header with backdrop blur stays positioned during scroll", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/skolenia");

      await page.evaluate(() => window.scrollBy(0, 1000));

      const { position, top, zIndex } = await header.rootComputedStyle();
      expect(position).toBe("sticky");
      expect(top).toBe("0px");
      expect(Number(zIndex)).toBeGreaterThanOrEqual(40);
      await expect(header.root).toHaveClass(/backdrop-blur/);
    });

    test("TC-22: At 375 px the Sheet width does not exceed the viewport", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/");
      await header.openMobileMenu();

      const box = await header.sheet.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(375);

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(375);
    });

    test("TC-23: Path-prefix collision — /skolenia/$slug highlights only Školenia, never Testy", async ({
      page,
      header,
    }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto("/skolenia/sms-smishing");

      await expect(header.navLink("skolenia")).toHaveClass(/text-foreground/);
      await expect(header.navLink("testy")).toHaveClass(/text-muted-foreground/);

      await page.goto("/testy/eshop");
      await expect(header.navLink("testy")).toHaveClass(/text-foreground/);
      await expect(header.navLink("skolenia")).toHaveClass(/text-muted-foreground/);
    });
  });
});
