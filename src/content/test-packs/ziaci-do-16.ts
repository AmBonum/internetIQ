import type { TestPack } from "./_schema";

// Obsah splňa EU Digital Services Act čl. 28 a SK Zákon č. 18/2018 Z. z. §15:
// vekový limit súhlasu pre digitálne spracovanie je 16 rokov.
// VYLÚČENÉ: otázky s referencou na pornografiu (h-extortion-1),
// romantiku/dating (f-romance-1), gamblovanie a krypto-investície.
export const ziaciDo16Pack: TestPack = {
  slug: "ziaci-do-16",
  title: "Žiaci (do 16 rokov) — bezpečnosť na internete",
  tagline:
    "Discord a gaming scam-y, falošné súťaže na TikToku, phishing školských kont, podvody s brigádami. 14 otázok pre mladých používateľov.",
  industry: "ziaci",
  industryEmoji: "🎮",
  targetPersona:
    "Žiak základnej alebo strednej školy — aktívny hráč, používateľ Discordu, TikToku a Instagramu, ktorý prvýkrát hľadá brigádu.",
  questionIds: [
    // Nové otázky — herný/školský kontext
    "f-discord-nitro-1",
    "f-gaming-vbucks-1",
    "p-email-school-ms-1",
    "h-tiktok-giveaway-1",
    "f-teen-job-1",
    "s-school-qr-1",
    "h-free-spotify-1",
    // Existujúce — vekovo primerané
    "h-instagram-hack-1",
    "f-mr-beast-1",
    "h-popup-1",
    "p-email-netflix-1",
    "u-shortlink-1",
    "u-https-1",
    "s-wifi-1",
  ],
  passingThreshold: 65,
  publishedAt: "2026-05-01",
  updatedAt: "2026-05-01",
  sources: [
    { label: "SK-CERT — online bezpečnosť pre deti", url: "https://www.sk-cert.sk/" },
    { label: "Zodpovedne.sk — digitálna gramotnosť", url: "https://www.zodpovedne.sk/" },
    { label: "Europol — gaming a social media scam-y 2024", url: "https://www.europol.europa.eu/" },
  ],
};
