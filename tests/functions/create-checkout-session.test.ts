import { describe, it, expect } from "vitest";

import { validateInput } from "../../functions/api/create-checkout-session";

const VALID_BASE = {
  mode: "oneoff" as const,
  amount_eur: 10,
  email: "anna@example.test",
  name: "Anna Testovacia",
  consent_immediate_start: true,
  consent_data_processing: true,
};

describe("create-checkout-session validateInput", () => {
  it("accepts a minimal valid oneoff payload", () => {
    const result = validateInput(VALID_BASE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.clean.mode).toBe("oneoff");
    expect(result.clean.amountCents).toBe(1000);
    expect(result.clean.metadata.show_in_footer).toBe("false");
    expect(result.clean.qualifiesForFooter).toBe(false);
  });

  it("rejects amount below the 5 EUR oneoff minimum", () => {
    const result = validateInput({ ...VALID_BASE, amount_eur: 3 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("amount_out_of_range");
    expect(result.field).toBe("amount_eur");
  });

  it("rejects amount above the 500 EUR AML cap for oneoff", () => {
    const result = validateInput({ ...VALID_BASE, amount_eur: 501 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("amount_out_of_range");
  });

  it("rejects monthly amounts that are not in the allowed tier set", () => {
    const result = validateInput({ ...VALID_BASE, mode: "monthly", amount_eur: 7 });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_monthly_tier");
  });

  it("accepts monthly amounts in the 5/10/25 tier set", () => {
    for (const tier of [5, 10, 25]) {
      const result = validateInput({ ...VALID_BASE, mode: "monthly", amount_eur: tier });
      expect(result.ok, `monthly tier ${tier}`).toBe(true);
    }
  });

  it("requires both consent checkboxes", () => {
    const a = validateInput({ ...VALID_BASE, consent_immediate_start: false });
    const b = validateInput({ ...VALID_BASE, consent_data_processing: false });
    expect(a.ok).toBe(false);
    expect(b.ok).toBe(false);
    if (!a.ok) expect(a.error).toBe("missing_consent_immediate_start");
    if (!b.ok) expect(b.error).toBe("missing_consent_data_processing");
  });

  it("rejects malformed e-mails", () => {
    const result = validateInput({ ...VALID_BASE, email: "not-an-email" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_email");
  });

  it("requires a non-empty name", () => {
    const result = validateInput({ ...VALID_BASE, name: "   " });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_name");
  });

  describe("display preferences (show_in_list)", () => {
    it("requires display_name when opting into the public list", () => {
      const result = validateInput({
        ...VALID_BASE,
        show_in_list: true,
        display_name: "",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("invalid_display_name");
    });

    it("rejects non-https display_link", () => {
      const result = validateInput({
        ...VALID_BASE,
        show_in_list: true,
        display_name: "Anna",
        display_link: "http://example.test",
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("invalid_display_link");
    });

    it("rejects display_message > 80 chars", () => {
      const result = validateInput({
        ...VALID_BASE,
        show_in_list: true,
        display_name: "Anna",
        display_message: "x".repeat(81),
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error).toBe("display_message_too_long");
    });

    it("propagates display preferences into Stripe metadata", () => {
      const result = validateInput({
        ...VALID_BASE,
        amount_eur: 100,
        show_in_list: true,
        show_in_footer: true,
        display_name: "Anna",
        display_link: "https://example.test/anna",
        display_message: "Vďaka za projekt!",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.clean.metadata).toEqual({
        display_name: "Anna",
        display_link: "https://example.test/anna",
        display_message: "Vďaka za projekt!",
        show_in_footer: "true",
      });
      expect(result.clean.qualifiesForFooter).toBe(true);
    });

    it("emits show_in_footer=false when amount does not qualify", () => {
      const result = validateInput({
        ...VALID_BASE,
        amount_eur: 25,
        show_in_list: true,
        show_in_footer: true,
        display_name: "Anna",
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.clean.metadata.show_in_footer).toBe("false");
      expect(result.clean.qualifiesForFooter).toBe(false);
    });

    it("emits empty display_* metadata when opted out (so webhook can clear stale values)", () => {
      const result = validateInput(VALID_BASE);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.clean.metadata.display_name).toBe("");
      expect(result.clean.metadata.display_link).toBe("");
      expect(result.clean.metadata.display_message).toBe("");
    });
  });
});
