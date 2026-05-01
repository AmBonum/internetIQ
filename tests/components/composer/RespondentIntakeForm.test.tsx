import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Avoid pulling the whole router (which itself wants providers); the only
// thing the form needs <Link> for is the privacy footnote.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...rest }: { children: React.ReactNode } & Record<string, unknown>) => {
    const { to: _to, ...domProps } = rest as { to?: string };
    return (
      <a href="#" {...(domProps as Record<string, unknown>)}>
        {children}
      </a>
    );
  },
}));

import { RespondentIntakeForm } from "@/components/composer/edu/intake/RespondentIntakeForm";

beforeEach(() => {
  vi.restoreAllMocks();
});

function setup(onReady = vi.fn()) {
  render(<RespondentIntakeForm setId="set-xyz" authorLabel="Pán Krátky" onReady={onReady} />);
  return { onReady, user: userEvent.setup() };
}

describe("RespondentIntakeForm", () => {
  it("renders disclosure mentioning author + 12-month retention", () => {
    setup();
    expect(screen.getByRole("heading", { name: /Pred testom: kto si/i })).toBeInTheDocument();
    expect(screen.getByText(/Pán Krátky/i)).toBeInTheDocument();
    expect(screen.getByText(/12 mesiacov/i)).toBeInTheDocument();
  });

  it("submit button is disabled until name + email + consent valid", async () => {
    const { user } = setup();
    const btn = screen.getByRole("button", { name: /Pokračovať na test/i });
    expect(btn).toBeDisabled();
    await user.type(screen.getByLabelText(/Meno a priezvisko/i), "Jana Nováková");
    expect(btn).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: /^E-mail$/i }), "jana@skola.sk");
    expect(btn).toBeDisabled();
    await user.click(screen.getByRole("checkbox"));
    expect(btn).not.toBeDisabled();
  });

  it("calls onReady with token+name+email after a successful POST", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ token: "jwt-stub" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const { onReady, user } = setup();
    await user.type(screen.getByLabelText(/Meno a priezvisko/i), "Jana Nováková");
    await user.type(screen.getByRole("textbox", { name: /^E-mail$/i }), "Jana@Skola.SK");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Pokračovať na test/i }));
    await waitFor(() => expect(onReady).toHaveBeenCalled());
    expect(onReady).toHaveBeenCalledWith({
      token: "jwt-stub",
      name: "Jana Nováková",
      email: "jana@skola.sk",
    });
    const init = fetchSpy.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(init.body as string);
    expect(body.set_id).toBe("set-xyz");
    expect(body.email).toBe("jana@skola.sk");
    expect(body.consent).toBe(true);
    expect(body.hp_url).toBe("");
  });

  it("renders an aria-live error message when server replies non-OK", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { "content-type": "application/json" },
      }),
    );
    const { user } = setup();
    await user.type(screen.getByLabelText(/Meno a priezvisko/i), "Jana Nováková");
    await user.type(screen.getByRole("textbox", { name: /^E-mail$/i }), "jana@skola.sk");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: /Pokračovať na test/i }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/Príliš veľa pokusov/i),
    );
  });

  it("honeypot input has aria-hidden, tabindex=-1 and is positioned off-screen", () => {
    setup();
    const honeypotWrapper = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    expect(honeypotWrapper).toBeTruthy();
    const hpInput = honeypotWrapper.querySelector('input[name="hp_url"]') as HTMLInputElement;
    expect(hpInput).toBeTruthy();
    expect(hpInput.tabIndex).toBe(-1);
    expect(hpInput.autocomplete).toBe("off");
    expect(honeypotWrapper.style.position).toBe("absolute");
    expect(honeypotWrapper.style.left).toBe("-9999px");
  });
});
