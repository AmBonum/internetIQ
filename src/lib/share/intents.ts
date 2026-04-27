// Pure helpers for building share intent URLs across major social platforms.
// No DOM access — fully unit-testable. Components call window.open() with the
// returned string. Adding a new platform = one entry in SHARE_PLATFORMS + one
// case in buildShareIntentUrl + a unit test snapshot.

import type { ConsentRecord } from "@/lib/consent";
import { hasConsent } from "@/lib/consent";

export type SharePlatform = "facebook" | "messenger" | "whatsapp" | "x" | "linkedin" | "telegram";

export interface SharePlatformDef {
  id: SharePlatform;
  label: string;
  /** Tailwind classes applied to the icon wrapper for brand-color hint on hover. */
  brandHover: string;
}

export const SHARE_PLATFORMS: ReadonlyArray<SharePlatformDef> = [
  { id: "facebook", label: "Facebook", brandHover: "group-hover:text-[#1877F2]" },
  { id: "messenger", label: "Messenger", brandHover: "group-hover:text-[#0084FF]" },
  { id: "whatsapp", label: "WhatsApp", brandHover: "group-hover:text-[#25D366]" },
  { id: "x", label: "X", brandHover: "group-hover:text-foreground" },
  { id: "linkedin", label: "LinkedIn", brandHover: "group-hover:text-[#0A66C2]" },
  { id: "telegram", label: "Telegram", brandHover: "group-hover:text-[#26A5E4]" },
];

/**
 * Append UTM tracking parameters to a share URL. Correctly chooses `?` or `&`
 * separator depending on whether the base URL already contains a query string.
 *
 * Reading these parameters on the receiving side is gated by the `analytics`
 * consent category — see `readUtmFromUrl()`.
 */
export function withUtm(
  baseUrl: string,
  source: SharePlatform,
  medium: string = "share",
  campaign: string = "results",
): string {
  const sep = baseUrl.includes("?") ? "&" : "?";
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  });
  return `${baseUrl}${sep}${params.toString()}`;
}

/**
 * Build a platform-specific share intent URL. The returned string is meant to
 * be passed to `window.open(url, "_blank", "noopener,noreferrer,...")`.
 *
 * - `shareUrl` is the canonical link being shared (typically `/r/$shareId`).
 *   UTM params are attached automatically.
 * - `text` is the human-readable message ("Som Internet Ninja na subenai — 75/100…"), shown
 *   pre-filled in the platform's compose UI where supported.
 */
export function buildShareIntentUrl(
  platform: SharePlatform,
  shareUrl: string,
  text: string,
): string {
  const url = withUtm(shareUrl, platform);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  switch (platform) {
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${u}`;
    case "messenger":
      // Messenger has no public web share dialog without a registered FB App
      // ID. The deep link below opens the Messenger app on mobile (iOS/Android)
      // with the URL pre-filled. On desktop the SocialShareGrid component
      // intercepts before this URL is ever loaded and falls back to clipboard
      // + toast — see handleClick.
      return `fb-messenger://share?link=${u}`;
    case "whatsapp":
      return `https://api.whatsapp.com/send?text=${t}%20${u}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${t}&url=${u}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${u}`;
    case "telegram":
      return `https://t.me/share/url?url=${u}&text=${t}`;
  }
}

/**
 * Canonical share caption used everywhere we share a result — Web Share API,
 * the social-platform grid, and the IG/TikTok manual caption.
 *
 * Optimised for click-through: identity reveal (personality) + score (curiosity
 * hook) + direct challenge ("Zvládneš to lepšie?") + emoji pointing to the
 * link (👇). No 3rd-party brand names, no quoted material — copyright-clean
 * across all platforms. Length stays comfortably under X's 280-char window
 * even with the longest personality name.
 */
export function buildShareCaption(args: { score: number; personalityName: string }): string {
  const { score, personalityName } = args;
  return `Som ${personalityName} na subenai — ${score}/100. Zvládneš to lepšie? 👇`;
}

/**
 * Lightweight UA-based mobile check used by the share grid to decide between
 * a deep-link launch (mobile) and a clipboard fallback (desktop) for
 * Messenger. Intentionally narrow — we just need to know "is this a phone
 * where Messenger app is realistic". Tablets fall under "Mobi"/"iPad".
 */
export function isMobileUserAgent(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
}

/**
 * Parse `utm_source`, `utm_medium`, `utm_campaign` from a URL — but ONLY if
 * the user has granted analytics consent. Without consent (or with a
 * malformed URL) returns `null` so call-sites cannot accidentally log the
 * params before consent.
 *
 * No analytics provider is wired up yet; this helper exists so the read-side
 * is gated from day one and the integration only needs to add a sink.
 */
export function readUtmFromUrl(url: string, consent: ConsentRecord | null): UtmParams | null {
  if (!hasConsent(consent, "analytics")) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const source = parsed.searchParams.get("utm_source");
  const medium = parsed.searchParams.get("utm_medium");
  const campaign = parsed.searchParams.get("utm_campaign");
  if (!source && !medium && !campaign) return null;
  return {
    source: source ?? "",
    medium: medium ?? "",
    campaign: campaign ?? "",
  };
}
