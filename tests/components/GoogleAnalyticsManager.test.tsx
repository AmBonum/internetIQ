import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const useConsentMock = vi.fn();

vi.mock("@/hooks/useConsent", () => ({
  useConsent: () => useConsentMock(),
}));

import { GoogleAnalyticsManager } from "@/components/GoogleAnalyticsManager";

function getCalls(): unknown[][] {
  return (window.dataLayer ?? []) as unknown[][];
}

function hasCall(
  calls: unknown[][],
  first: string,
  second: string,
  thirdMatcher?: (arg: unknown) => boolean,
): boolean {
  return calls.some((c) => {
    if (c.length < 2) return false;
    if (c[0] !== first || c[1] !== second) return false;
    if (!thirdMatcher) return true;
    return thirdMatcher(c[2]);
  });
}

beforeEach(() => {
  useConsentMock.mockReset();
  window.dataLayer = [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };
});

describe("GoogleAnalyticsManager", () => {
  it("does not send consent update before hydration", () => {
    useConsentMock.mockReturnValue({
      hydrated: false,
      record: null,
    });

    render(<GoogleAnalyticsManager />);

    const calls = getCalls();
    expect(hasCall(calls, "consent", "update")).toBe(false);
  });

  it("updates consent as denied when user has not granted analytics/marketing/preferences", () => {
    useConsentMock.mockReturnValue({
      hydrated: true,
      record: {
        version: "1.2.1",
        timestamp: "2026-04-28T00:00:00.000Z",
        categories: {
          necessary: true,
          preferences: false,
          analytics: false,
          marketing: false,
        },
      },
    });

    render(<GoogleAnalyticsManager />);

    const calls = getCalls();
    expect(
      hasCall(
        calls,
        "consent",
        "update",
        (arg) =>
          typeof arg === "object" &&
          arg !== null &&
          (arg as { analytics_storage?: string }).analytics_storage === "denied" &&
          (arg as { ad_storage?: string }).ad_storage === "denied" &&
          (arg as { functionality_storage?: string }).functionality_storage === "denied",
      ),
    ).toBe(true);
  });

  it("updates consent as granted based on user cookie settings and configures GA after script load", () => {
    useConsentMock.mockReturnValue({
      hydrated: true,
      record: {
        version: "1.2.1",
        timestamp: "2026-04-28T00:00:00.000Z",
        categories: {
          necessary: true,
          preferences: true,
          analytics: true,
          marketing: true,
        },
      },
    });

    render(<GoogleAnalyticsManager />);

    const calls = getCalls();
    expect(
      hasCall(
        calls,
        "consent",
        "update",
        (arg) =>
          typeof arg === "object" &&
          arg !== null &&
          (arg as { analytics_storage?: string }).analytics_storage === "granted" &&
          (arg as { ad_storage?: string }).ad_storage === "granted" &&
          (arg as { functionality_storage?: string }).functionality_storage === "granted",
      ),
    ).toBe(true);
  });
});
