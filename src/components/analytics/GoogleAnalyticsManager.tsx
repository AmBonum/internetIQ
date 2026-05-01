import { useEffect } from "react";
import { useConsent } from "@/hooks/useConsent";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

type ConsentValue = "granted" | "denied";

interface GtagConsentState {
  ad_storage: ConsentValue;
  ad_user_data: ConsentValue;
  ad_personalization: ConsentValue;
  analytics_storage: ConsentValue;
  functionality_storage: ConsentValue;
  personalization_storage: ConsentValue;
  security_storage: ConsentValue;
}

function deniedState(): GtagConsentState {
  return {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "denied",
    personalization_storage: "denied",
    security_storage: "granted",
  };
}

function buildConsentState(input: {
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}): GtagConsentState {
  return {
    ad_storage: input.marketing ? "granted" : "denied",
    ad_user_data: input.marketing ? "granted" : "denied",
    ad_personalization: input.marketing ? "granted" : "denied",
    analytics_storage: input.analytics ? "granted" : "denied",
    functionality_storage: input.preferences ? "granted" : "denied",
    personalization_storage: input.preferences ? "granted" : "denied",
    security_storage: "granted",
  };
}

export function GoogleAnalyticsManager() {
  const { record, hydrated } = useConsent();

  useEffect(() => {
    if (!hydrated) return;
    const consentState = record
      ? buildConsentState({
          analytics: record.categories.analytics,
          marketing: record.categories.marketing,
          preferences: record.categories.preferences,
        })
      : deniedState();

    window.gtag?.("consent", "update", consentState);
  }, [hydrated, record]);

  return null;
}
