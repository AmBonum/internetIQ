import type { TestPack } from "./_schema";

export const itVyvojPack: TestPack = {
  slug: "it-vyvoj",
  title: "IT a softvérový vývoj — pokročilé vektory",
  tagline:
    "BEC, OAuth phishing, supply-chain pasce, fake recruiteri, deepfake CEO call. 15 otázok pre tím, ktorý má prístup k prod a financiám.",
  industry: "it",
  industryEmoji: "💻",
  targetPersona:
    "Vývojári, devops, CTO/lead, CFO assistant — top targety pre cielené BEC a supply-chain útoky.",
  questionIds: [
    // BEC + cloud account phishing — top hrozby pre IT
    "p-email-bec-1",
    "p-email-microsoft-1",
    "p-email-google-1",
    "p-email-shared-1",
    // Recruiter / job scamy — typické pre devov
    "p-email-linkedin-1",
    "p-email-job-1",
    // Pokročilé scenáre — deepfake, 2FA bombing, anydesk
    "s-deepfake-1",
    "s-2fa-bombing-1",
    "s-anydesk-1",
    // URL pasce — typosquat (npm-style), shortlink v chate
    "u-typosquat-1",
    "u-shortlink-1",
    // Fake influencer / hyped tech postupy (krypto, AI)
    "f-fake-influencer-1",
    // Honeypoty — banking B2B, e-shop account, gov register
    "h-url-bank-3",
    "h-url-shop-8",
    "h-url-gov-7",
  ],
  passingThreshold: 75,
  publishedAt: "2026-04-27",
  updatedAt: "2026-04-27",
  sources: [
    { label: "ENISA Threat Landscape — IT supply chain", url: "https://www.enisa.europa.eu/" },
    { label: "NCKB — BEC v slovenských firmách", url: "https://www.sk-cert.sk/" },
    { label: "GitHub Security — typosquatting", url: "https://docs.github.com/en/code-security" },
  ],
};
