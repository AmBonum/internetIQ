import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  EduSettings,
  EDU_PASSWORD_MIN_LEN,
  EDU_PASSWORD_MAX_LEN,
} from "@/components/composer/EduSettings";

describe("EduSettings — toggle + password input", () => {
  function setup(initial?: { collects?: boolean; pw?: string }) {
    const onToggle = vi.fn();
    const onPasswordChange = vi.fn();
    render(
      <EduSettings
        collectsResponses={initial?.collects ?? false}
        onToggle={onToggle}
        authorPassword={initial?.pw ?? ""}
        onPasswordChange={onPasswordChange}
      />,
    );
    return { onToggle, onPasswordChange, user: userEvent.setup() };
  }

  it("renders the toggle OFF by default with no password input visible", () => {
    setup();
    const toggle = screen.getByRole("switch");
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.queryByLabelText(/Heslo na pozeranie výsledkov/i)).toBeNull();
  });

  it("clicking the toggle calls onToggle(true)", async () => {
    const { onToggle, user } = setup();
    await user.click(screen.getByRole("switch"));
    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("when ON, password input appears with min/max attrs and helper text", () => {
    setup({ collects: true });
    const input = screen.getByLabelText(/Heslo na pozeranie výsledkov/i) as HTMLInputElement;
    expect(input.type).toBe("password");
    expect(input.minLength).toBe(EDU_PASSWORD_MIN_LEN);
    expect(input.maxLength).toBe(EDU_PASSWORD_MAX_LEN);
    expect(screen.getByText(/žiadny reset cez e-mail/i)).toBeInTheDocument();
  });

  it("typing into password input fires onPasswordChange with the typed value", async () => {
    const { onPasswordChange, user } = setup({ collects: true });
    const input = screen.getByLabelText(/Heslo na pozeranie výsledkov/i);
    await user.type(input, "abc");
    expect(onPasswordChange).toHaveBeenCalledTimes(3);
    expect(onPasswordChange).toHaveBeenLastCalledWith("c");
  });

  it("show/hide button toggles input type between password and text", async () => {
    const { user } = setup({ collects: true, pw: "secret-pwd-1234" });
    const input = screen.getByLabelText(/Heslo na pozeranie výsledkov/i) as HTMLInputElement;
    expect(input.type).toBe("password");
    const reveal = screen.getByRole("button", { name: /Zobraziť heslo/i });
    await user.click(reveal);
    expect(input.type).toBe("text");
    await user.click(screen.getByRole("button", { name: /Skryť heslo/i }));
    expect(input.type).toBe("password");
  });

  it("flags too-short password with aria-invalid and destructive border class", () => {
    setup({ collects: true, pw: "short" });
    const input = screen.getByLabelText(/Heslo na pozeranie výsledkov/i);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.className).toContain("border-destructive");
  });
});
