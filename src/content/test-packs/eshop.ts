import type { TestPack } from "./_schema";

export const eshopPack: TestPack = {
  slug: "eshop",
  title: "E-shop tím — odolnosť proti scam-u",
  tagline:
    "Fake kupci cez Stripe link, podvodné refundácie, balíkové smishing a Bazoš pasce. 14 otázok pre tím, ktorý komunikuje so zákazníkmi denne.",
  industry: "eshop",
  industryEmoji: "🛒",
  targetPersona:
    "Backoffice, customer support a operatívci e-shopu — kontaktný bod scam-erov, ktorí zneužívajú objednávkový a reklamačný flow.",
  questionIds: [
    // Phishing — kuriéri, banky, obchody
    "p-sms-balik-1",
    "p-sms-dpd-1",
    "p-sms-fedex-1",
    "p-email-paypal-1",
    // Marketplace / bazoš pasce relevantné pre dropshipping a vrátenie
    "f-fake-stripe-1",
    "f-bazos-iphone-1",
    "f-bazos-2",
    "s-overpay-1",
    // URL pasce typické pre e-shop branžu
    "u-shopify-1",
    "u-eshop-1",
    // Honeypoty — naučiť rozoznať legit objednávkové URL
    "h-url-shop-1",
    "h-url-shop-4",
    "h-url-shop-5",
    "h-url-shop-6",
  ],
  passingThreshold: 70,
  publishedAt: "2026-04-27",
  updatedAt: "2026-04-27",
  sources: [
    { label: "NCKB — typy podvodov v e-commerce", url: "https://www.sk-cert.sk/" },
    { label: "Slovenská obchodná inšpekcia", url: "https://www.soi.sk/" },
    { label: "Bazoš — bezpečnostné odporúčania", url: "https://www.bazos.sk/" },
  ],
};
