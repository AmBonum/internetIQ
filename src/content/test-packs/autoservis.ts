import type { TestPack } from "./_schema";

export const autoservisPack: TestPack = {
  slug: "autoservis",
  title: "Autoservis — scam-y proti dielenskému tímu",
  tagline:
    "Fake objednávky náhradných dielov, podvody s VIN-om, smishing pre majiteľov áut, IBAN-switch dodávateľa. 13 otázok pre dielňu a recepciu.",
  industry: "autoservis",
  industryEmoji: "🚗",
  targetPersona:
    "Recepcia, mechanici objednávajúci diely a účtovníčka — ciele scam-erov ktorí zneužívajú objednávkový flow a SMS o zásielkach.",
  questionIds: [
    // Marketplace pasce relevantné pre nákup dielov a auto handel
    "f-bazar-auto-1",
    "f-marketplace-1",
    // BEC + faktúra phishing — IBAN switch a fake objednávky dielov
    "p-email-bec-1",
    "p-email-faktura-1",
    // SMS — zásielka dielov, fake polícia (pokuta)
    "p-sms-balik-1",
    "p-sms-policia-1",
    // Scenáre — overpay pri kupcovi, fake energie pre dielňu
    "s-overpay-1",
    "s-energie-1",
    // URL pasce — typosquat dodávateľov, fake parts e-shop
    "u-typosquat-1",
    "u-eshop-1",
    // Honeypoty — legit Alza/Mall pre objednávky, B2B Tatra banka
    "h-url-shop-1",
    "h-url-bank-3",
    "h-url-shop-7",
  ],
  passingThreshold: 70,
  publishedAt: "2026-04-27",
  updatedAt: "2026-04-27",
  sources: [
    { label: "NCKB — podvody pri nákupe áut a dielov", url: "https://www.sk-cert.sk/" },
    { label: "PZ SR — typové autopodvody", url: "https://www.minv.sk/" },
  ],
};
