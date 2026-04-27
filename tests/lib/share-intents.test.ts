import { describe, it, expect } from "vitest";
import {
  buildShareCaption,
  buildShareIntentUrl,
  readUtmFromUrl,
  SHARE_PLATFORMS,
  withUtm,
  type SharePlatform,
} from "@/lib/share/intents";
import type { ConsentRecord } from "@/lib/consent";

const url = "https://subenai.eu/r/ABC12345";
const text = "Mám subenai 75/100. Lepší než 70% ľudí. Som Internet Ninja. Skús aj ty:";

const allConsent: ConsentRecord = {
  version: "1.1.0",
  timestamp: "2026-04-26T00:00:00Z",
  categories: {
    necessary: true,
    preferences: true,
    analytics: true,
    marketing: false,
  },
};

const noAnalytics: ConsentRecord = {
  ...allConsent,
  categories: { ...allConsent.categories, analytics: false },
};

describe("withUtm", () => {
  it("appends utm params with `?` when base URL has no query string", () => {
    expect(withUtm(url, "facebook")).toBe(
      "https://subenai.eu/r/ABC12345?utm_source=facebook&utm_medium=share&utm_campaign=results",
    );
  });

  it("appends utm params with `&` when base URL already has a query string", () => {
    const result = withUtm("https://subenai.eu/r/ABC?ref=foo", "x");
    expect(result).toBe(
      "https://subenai.eu/r/ABC?ref=foo&utm_source=x&utm_medium=share&utm_campaign=results",
    );
  });

  it("supports custom medium and campaign overrides", () => {
    expect(withUtm(url, "linkedin", "post", "course-complete")).toBe(
      "https://subenai.eu/r/ABC12345?utm_source=linkedin&utm_medium=post&utm_campaign=course-complete",
    );
  });
});

describe("buildShareIntentUrl", () => {
  it("builds the Facebook sharer URL with encoded UTM-tagged share URL", () => {
    expect(buildShareIntentUrl("facebook", url, text)).toBe(
      "https://www.facebook.com/sharer/sharer.php?u=" +
        encodeURIComponent(withUtm(url, "facebook")),
    );
  });

  it("builds the X intent URL with both text and url params", () => {
    const got = buildShareIntentUrl("x", url, text);
    expect(got).toContain("https://twitter.com/intent/tweet?text=");
    expect(got).toContain("&url=" + encodeURIComponent(withUtm(url, "x")));
    expect(got).toContain(encodeURIComponent(text));
  });

  it("builds the WhatsApp send URL with single concatenated `text url` param", () => {
    const got = buildShareIntentUrl("whatsapp", url, text);
    expect(got).toMatch(/^https:\/\/api\.whatsapp\.com\/send\?text=/);
    expect(got).toContain(encodeURIComponent(text));
    expect(got).toContain("%20" + encodeURIComponent(withUtm(url, "whatsapp")));
  });

  it("builds the Telegram share URL with url and text params", () => {
    const got = buildShareIntentUrl("telegram", url, text);
    expect(got).toContain("https://t.me/share/url?url=");
    expect(got).toContain("&text=" + encodeURIComponent(text));
  });

  it("builds the LinkedIn share URL with only the url param", () => {
    expect(buildShareIntentUrl("linkedin", url, text)).toBe(
      "https://www.linkedin.com/sharing/share-offsite/?url=" +
        encodeURIComponent(withUtm(url, "linkedin")),
    );
  });

  it("builds the Messenger fb-messenger:// deep link (mobile-only; desktop falls back to clipboard)", () => {
    const got = buildShareIntentUrl("messenger", url, text);
    expect(got).toBe(`fb-messenger://share?link=${encodeURIComponent(withUtm(url, "messenger"))}`);
    expect(got).not.toContain("facebook.com");
  });

  it("escapes special characters (&, ?, slovak diacritics, emoji) in the text", () => {
    const tricky = "Som žralok & had? 🦈";
    const got = buildShareIntentUrl("x", url, tricky);
    expect(got).toContain(encodeURIComponent(tricky));
    // Make sure the `&` from text is encoded — otherwise it would split params.
    expect(got).not.toMatch(/text=Som žralok &/);
  });

  it("covers every platform listed in SHARE_PLATFORMS", () => {
    for (const p of SHARE_PLATFORMS) {
      expect(() => buildShareIntentUrl(p.id as SharePlatform, url, text)).not.toThrow();
    }
  });
});

describe("buildShareCaption", () => {
  it("formats the canonical CTR-driven share caption (slovak)", () => {
    expect(buildShareCaption({ score: 75, personalityName: "Internet Ninja" })).toBe(
      "Som Internet Ninja na subenai — 75/100. Zvládneš to lepšie? 👇",
    );
  });

  it("handles edge score values (0, 100) without breakage", () => {
    expect(buildShareCaption({ score: 0, personalityName: "Naivný Sebavedomec" })).toContain(
      "0/100",
    );
    expect(buildShareCaption({ score: 100, personalityName: "Internet Ninja" })).toContain(
      "100/100",
    );
  });

  it("stays comfortably under X's 280-char window even with the longest personality + URL", () => {
    const longest = buildShareCaption({
      score: 100,
      personalityName: "Naivný Sebavedomec",
    });
    expect(longest.length + 1 + 60).toBeLessThan(280);
  });
});

describe("readUtmFromUrl (consent-gated)", () => {
  const utmUrl =
    "https://subenai.eu/r/ABC?utm_source=facebook&utm_medium=share&utm_campaign=results";

  it("returns null when analytics consent is denied", () => {
    expect(readUtmFromUrl(utmUrl, noAnalytics)).toBeNull();
  });

  it("returns null when consent is missing entirely", () => {
    expect(readUtmFromUrl(utmUrl, null)).toBeNull();
  });

  it("returns parsed params when analytics consent is granted", () => {
    expect(readUtmFromUrl(utmUrl, allConsent)).toEqual({
      source: "facebook",
      medium: "share",
      campaign: "results",
    });
  });

  it("returns null when the URL has no UTM params at all", () => {
    expect(readUtmFromUrl("https://subenai.eu/r/ABC", allConsent)).toBeNull();
  });

  it("returns null for malformed URLs (does not throw)", () => {
    expect(readUtmFromUrl("not a url", allConsent)).toBeNull();
  });

  it("handles partial UTM (only utm_source)", () => {
    expect(readUtmFromUrl("https://x.sk/r/A?utm_source=x", allConsent)).toEqual({
      source: "x",
      medium: "",
      campaign: "",
    });
  });
});
