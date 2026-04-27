import type { TestPack } from "./_schema";

/**
 * Reference template for new pack authors — kept type-checked so the
 * compiler catches schema drift, but intentionally NOT registered in
 * `TEST_PACKS`. Copy this file to `{slug}.ts`, replace IDs and copy,
 * then add the export to `index.ts`.
 */
export const templatePack: TestPack = {
  slug: "pack-template",
  title: "Vzorový pack — vymeň názov",
  tagline: "Krátka veta, prečo je tento test relevantný pre branžu.",
  industry: "eshop",
  industryEmoji: "🛒",
  targetPersona: "Komu je pack určený — 1 veta.",
  questionIds: [
    // 8–25 ID-čiek z `src/lib/quiz/questions.ts`. Mix scam (60–70 %) +
    // honeypot (20–30 %) + borderline (10 %). Validuje sa pri build-e.
    "p-sms-posta-1",
    "p-sms-dpd-1",
    "p-email-paypal-1",
    "p-email-bec-1",
    "u-tatra-1",
    "u-idn-1",
    "h-url-bank-1",
    "h-url-shop-1",
  ],
  passingThreshold: 70,
  publishedAt: "2026-04-27",
  updatedAt: "2026-04-27",
  sources: [{ label: "NCKB — typy podvodov v branži", url: "https://www.sk-cert.sk/" }],
};
