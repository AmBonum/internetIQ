import type { TestPack } from "./_schema";

export const verejneSluzbyPack: TestPack = {
  slug: "verejne-sluzby",
  title: "Verejné služby — odolnosť úradníkov a obyvateľov",
  tagline: `Falošné štátne SMS, slovensko.sk klony, fake výzvy z FS, vishing od „polície". 14 otázok pre úradníkov aj občanov.`,
  industry: "verejne_sluzby",
  industryEmoji: "🏛️",
  targetPersona:
    "Úradníci, asistenti starostov, recepcie obecných úradov a občania, ktorí komunikujú so štátom cez slovensko.sk a SMS upozornenia.",
  questionIds: [
    // Štátne SMS pasce — daň, polícia, banka
    "p-sms-tax-1",
    "p-sms-policia-1",
    "p-sms-banka-blok-1",
    // Sociálne inžinierstvo — vishing, charita, energie, rodina
    "s-vishing-1",
    "s-charita-1",
    "s-energie-1",
    "s-rodina-1",
    // Email phishing — fake faktúra úradu
    "p-email-faktura-1",
    // URL pasce — slovensko.sk klony, postaonline klony
    "u-mojsk-1",
    "u-postaonline-1",
    // Honeypoty — všetkých 4 legit gov subdomain
    "h-url-gov-1",
    "h-url-gov-2",
    "h-url-gov-4",
    "h-url-gov-7",
  ],
  passingThreshold: 70,
  publishedAt: "2026-04-27",
  updatedAt: "2026-04-27",
  sources: [
    { label: "NCKB — phishing voči verejnej správe", url: "https://www.sk-cert.sk/" },
    { label: "MIRRI SR — slovensko.sk bezpečnosť", url: "https://www.mirri.gov.sk/" },
    { label: "PZ SR — varovania pre seniorov a občanov", url: "https://www.minv.sk/" },
  ],
};
