import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: unknown; children: ReactNode } & ComponentProps<"a">) => (
    <a role="link" data-to={typeof to === "string" ? to : ""} {...rest}>
      {children}
    </a>
  ),
  createFileRoute:
    () =>
    <T,>(opts: T) =>
      opts,
}));

vi.mock("@/hooks/useConsent", () => ({
  useConsent: () => ({ openPreferences: vi.fn(), record: null }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

import { SponzoriView, type PublicSponsor } from "@/routes/sponzori";

function makeSponsor(overrides: Partial<PublicSponsor> = {}): PublicSponsor {
  return {
    id: `sponsor-${Math.random().toString(36).slice(2, 8)}`,
    display_name: "Anna Testovacia",
    display_link: null,
    display_message: null,
    created_at: "2026-04-15T10:00:00Z",
    ...overrides,
  };
}

describe("SponzoriView (/sponzori)", () => {
  it("renders the empty state with a CTA when no public sponsors exist", async () => {
    const fetchSponsors = vi.fn(async () => [] as PublicSponsor[]);
    render(<SponzoriView fetchSponsors={fetchSponsors} />);

    await waitFor(() => expect(screen.getByText(/Buď prvý/i)).toBeInTheDocument());
    const ctas = screen.getAllByRole("link", { name: /Podporiť projekt/i });
    expect(ctas.some((el) => el.getAttribute("data-to") === "/podpora")).toBe(true);
  });

  it("renders sponsor cards with name + optional link + optional message", async () => {
    const fetchSponsors = vi.fn(async () => [
      makeSponsor({ display_name: "Anna" }),
      makeSponsor({
        display_name: "Bob",
        display_link: "https://example.test/bob",
        display_message: "Vďaka za projekt!",
      }),
    ]);

    render(<SponzoriView fetchSponsors={fetchSponsors} />);

    await waitFor(() => expect(screen.getByText("Anna")).toBeInTheDocument());
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Vďaka za projekt!")).toBeInTheDocument();

    const bobLink = screen.getByRole("link", { name: "Bob" });
    expect(bobLink).toHaveAttribute("href", "https://example.test/bob");
    expect(bobLink).toHaveAttribute("target", "_blank");
    expect(bobLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("never exposes total_eur, stripe_customer_id or any payment amount", async () => {
    const fetchSponsors = vi.fn(async () => [makeSponsor({ display_name: "Anna" })]);
    render(<SponzoriView fetchSponsors={fetchSponsors} />);

    await waitFor(() => expect(screen.getByText("Anna")).toBeInTheDocument());
    expect(screen.queryByText(/€/)).not.toBeInTheDocument();
    expect(screen.queryByText(/EUR/)).not.toBeInTheDocument();
    expect(screen.queryByText(/cus_/)).not.toBeInTheDocument();
    expect(screen.queryByText(/total_eur/i)).not.toBeInTheDocument();
  });

  it("shows error state when fetch fails", async () => {
    const fetchSponsors = vi.fn(async () => {
      throw new Error("RLS denied");
    });
    render(<SponzoriView fetchSponsors={fetchSponsors} />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });

  it("includes the anonymity disclosure footnote with consent-revocation contact", async () => {
    const fetchSponsors = vi.fn(async () => [] as PublicSponsor[]);
    render(<SponzoriView fetchSponsors={fetchSponsors} />);
    await waitFor(() => expect(screen.getByText(/Buď prvý/i)).toBeInTheDocument());
    expect(screen.getByText(/anonymitu/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /segnities@gmail\.com/i })).toBeInTheDocument();
  });
});
