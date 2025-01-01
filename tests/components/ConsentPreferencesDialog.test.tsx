import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  // Anchor without `href` keeps jsdom from logging "navigation not
  // implemented" while preserving the link role so RTL queries match.
  // `data-to` exposes the destination for assertions if ever needed.
  Link: ({ to, children, ...rest }: { to: unknown; children: ReactNode } & ComponentProps<"a">) => (
    <a role="link" data-to={typeof to === "string" ? to : ""} {...rest}>
      {children}
    </a>
  ),
}));

import { ConsentProvider, useConsent } from "@/hooks/useConsent";
import { ConsentPreferencesDialog } from "@/components/ConsentPreferencesDialog";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

function Harness() {
  const { openPreferences } = useConsent();
  return (
    <>
      <button type="button" onClick={openPreferences}>
        open dialog
      </button>
      <ConsentPreferencesDialog />
    </>
  );
}

function renderHarness() {
  return render(
    <ConsentProvider>
      <Harness />
    </ConsentProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("ConsentPreferencesDialog — link closes dialog (E1.1)", () => {
  it("closes the dialog when the cookies-policy link is clicked", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: /open dialog/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /zásadách cookies/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the dialog when the privacy-policy link is clicked", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: /open dialog/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: /zásadách ochrany súkromia/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("discards draft toggles when the dialog is closed via a policy link", () => {
    renderHarness();
    const openButton = screen.getByRole("button", { name: /open dialog/i });

    fireEvent.click(openButton);
    const analytics = screen.getByRole("switch", { name: /analytika/i });
    expect(analytics).toHaveAttribute("data-state", "unchecked");

    fireEvent.click(analytics);
    expect(analytics).toHaveAttribute("data-state", "checked");

    fireEvent.click(screen.getByRole("link", { name: /zásadách cookies/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();

    fireEvent.click(openButton);
    const analyticsAfter = screen.getByRole("switch", { name: /analytika/i });
    expect(analyticsAfter).toHaveAttribute("data-state", "unchecked");
  });
});
