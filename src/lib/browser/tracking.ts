/**
 * Consent-gated tracking helper.
 *
 * No analytics provider is wired up yet (PostHog is on the roadmap).
 * This file gives the rest of the codebase a single, contractual entry
 * point so when a provider is added later it can ONLY fire when the
 * user has granted the relevant consent category. Calling `track()`
 * before consent — or for users who have rejected analytics — is a
 * silent no-op.
 *
 * Pattern for future integration:
 *
 *   const { isAllowed } = useConsent();
 *   useEffect(() => {
 *     if (isAllowed("analytics")) {
 *       posthog.init(...); // load only after consent
 *     }
 *   }, [isAllowed("analytics")]);
 */

import type { ConsentRecord } from "@/lib/consent";
import { hasConsent } from "@/lib/consent";

export interface TrackEvent {
  name: string;
  properties?: Record<string, unknown>;
  /** Defaults to "analytics". Use "marketing" for ad/retargeting events. */
  category?: "analytics" | "marketing";
}

type Sink = (event: TrackEvent) => void;

let activeSink: Sink | null = null;

/** Register the actual analytics sink (e.g. wraps `posthog.capture`). */
export function setTrackingSink(sink: Sink | null): void {
  activeSink = sink;
}

/**
 * Fire an event — but only if the user has granted consent for the
 * matching category. Without consent the call is a no-op.
 */
export function track(record: ConsentRecord | null, event: TrackEvent): void {
  const category = event.category ?? "analytics";
  if (!hasConsent(record, category)) return;
  if (!activeSink) return;
  try {
    activeSink(event);
  } catch {
    // never let analytics throw into product code
  }
}
