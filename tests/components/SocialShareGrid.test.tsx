import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SocialShareGrid } from "@/components/quiz/share/SocialShareGrid";

const url = "https://subenai.eu/r/ABC12345";
const text = "Som Internet Ninja na subenai — 75/100. Zvládneš to lepšie? 👇";

let openSpy: ReturnType<typeof vi.fn>;
let writeTextSpy: ReturnType<typeof vi.fn>;
let originalUserAgent: string;

beforeEach(() => {
  openSpy = vi.fn();
  vi.spyOn(window, "open").mockImplementation(openSpy as typeof window.open);
  writeTextSpy = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: writeTextSpy },
  });
  originalUserAgent = navigator.userAgent;
});

afterEach(() => {
  Object.defineProperty(navigator, "userAgent", {
    configurable: true,
    value: originalUserAgent,
  });
});

function setUserAgent(ua: string) {
  Object.defineProperty(navigator, "userAgent", { configurable: true, value: ua });
}

describe("SocialShareGrid", () => {
  it("renders one button per supported platform", () => {
    render(<SocialShareGrid url={url} text={text} />);
    for (const label of ["Facebook", "Messenger", "WhatsApp", "X", "LinkedIn", "Telegram"]) {
      expect(
        screen.getByRole("button", { name: new RegExp(`Zdieľaj na ${label}`, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("opens the Facebook sharer in a new window with UTM-tagged URL on click", () => {
    render(<SocialShareGrid url={url} text={text} />);
    fireEvent.click(screen.getByRole("button", { name: /Zdieľaj na Facebook/i }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    const [intentUrl, target, features] = openSpy.mock.calls[0];
    expect(intentUrl).toMatch(/^https:\/\/www\.facebook\.com\/sharer\/sharer\.php\?u=/);
    expect(intentUrl).toContain(encodeURIComponent("utm_source=facebook"));
    expect(target).toBe("_blank");
    expect(features).toContain("noopener");
    expect(features).toContain("noreferrer");
  });

  it("opens the X intent URL with text and UTM-tagged URL", () => {
    render(<SocialShareGrid url={url} text={text} />);
    fireEvent.click(screen.getByRole("button", { name: /Zdieľaj na X/i }));
    const [intentUrl] = openSpy.mock.calls[0];
    expect(intentUrl).toMatch(/^https:\/\/twitter\.com\/intent\/tweet\?text=/);
    expect(intentUrl).toContain(encodeURIComponent(text));
    expect(intentUrl).toContain("utm_source%3Dx");
  });

  it("each button has an accessible label naming the platform", () => {
    render(<SocialShareGrid url={url} text={text} />);
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn.getAttribute("aria-label")).toMatch(/^Zdieľaj na /);
    }
  });

  describe("Messenger", () => {
    it("on desktop, copies caption + UTM URL to clipboard and shows a toast (no FB redirect)", async () => {
      setUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      );
      render(<SocialShareGrid url={url} text={text} />);

      fireEvent.click(screen.getByRole("button", { name: /Zdieľaj na Messenger/i }));

      await waitFor(() => expect(writeTextSpy).toHaveBeenCalledTimes(1));
      const [clipboardPayload] = writeTextSpy.mock.calls[0];
      expect(clipboardPayload).toContain(text);
      expect(clipboardPayload).toContain("utm_source=messenger");

      // Critical: NO FB sharer redirect on desktop.
      expect(openSpy).not.toHaveBeenCalled();
      expect(
        await screen.findByText(/Skopírované do schránky — otvor Messenger/i),
      ).toBeInTheDocument();
    });

    it("on mobile, fires the fb-messenger:// deep link via window.open (no clipboard)", () => {
      setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      );
      render(<SocialShareGrid url={url} text={text} />);

      fireEvent.click(screen.getByRole("button", { name: /Zdieľaj na Messenger/i }));

      expect(openSpy).toHaveBeenCalledTimes(1);
      const [intentUrl] = openSpy.mock.calls[0];
      expect(intentUrl).toMatch(/^fb-messenger:\/\/share\?link=/);
      expect(intentUrl).toContain(encodeURIComponent("utm_source=messenger"));
      expect(writeTextSpy).not.toHaveBeenCalled();
    });
  });
});
