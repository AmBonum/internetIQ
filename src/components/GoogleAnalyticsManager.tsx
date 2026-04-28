import { useEffect } from "react";
import { useConsent } from "@/hooks/useConsent";

const GA_MEASUREMENT_ID = "G-95QZ12WGFD";
const GA_SCRIPT_ID = "ga4-gtag-script";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let configured = false;

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

function ensureGtagStub(needsDecision: boolean) {
  if (typeof window === "undefined") return;
  if (window.gtag) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  window.gtag("consent", "default", {
    ...deniedState(),
    ...(needsDecision ? { wait_for_update: 500 } : {}),
  });
  window.gtag("set", "ads_data_redaction", true);
  window.gtag("set", "url_passthrough", true);
  window.gtag("js", new Date());
}

function loadScriptOnce(onLoad: () => void) {
  if (typeof document === "undefined") return;

  const existing = document.getElementById(GA_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    if (existing.dataset.loaded === "true") {
      onLoad();
      return;
    }
    existing.addEventListener("load", onLoad, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.id = GA_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  script.addEventListener(
    "load",
    () => {
      script.dataset.loaded = "true";
      onLoad();
    },
    { once: true },
  );
  document.head.appendChild(script);
}

export function GoogleAnalyticsManager() {
  const { record, hydrated, needsDecision } = useConsent();

  useEffect(() => {
    ensureGtagStub(needsDecision);

    loadScriptOnce(() => {
      if (!configured) {
        window.gtag?.("config", GA_MEASUREMENT_ID, { anonymize_ip: true });
        configured = true;
      }
    });
  }, [needsDecision]);

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
