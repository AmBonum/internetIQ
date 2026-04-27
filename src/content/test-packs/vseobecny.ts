import type { TestPack } from "./_schema";

export const vseobecnyPack: TestPack = {
  slug: "vseobecny",
  title: "Všeobecný test — najčastejšie podvody",
  tagline:
    "Najrozšírenejší mix: SMS/email phishing, falošné e-shopy, vishing, QR kódy, AI klonovanie hlasu a rozpoznávanie legitímnych stránok. 14 otázok.",
  industry: "vseobecny",
  industryEmoji: "🌐",
  targetPersona:
    "Každý — od tínedžera po dôchodcu. Pokrýva podvody, s ktorými sa môže stretnúť ktokoľvek bez ohľadu na vek alebo povolanie.",
  questionIds: [
    // AI voice cloning — nová hrozba (zdieľaná so seniori)
    "s-ai-voice-1",
    // E-mail a SMS phishing
    "p-sms-posta-1",
    "p-email-netflix-1",
    "p-email-google-1",
    "p-sms-2fa-1",
    // URL rozpoznávanie
    "u-https-1",
    "u-shortlink-1",
    // Fake obsah
    "f-ig-influencer-1",
    "f-recenzie-1",
    // Scenáre — vishing a quishing
    "s-vishing-1",
    "s-quishing-1",
    // Honeypoty — kalibrácia istoty
    "h-vyhra-1",
    "h-instagram-hack-1",
    "h-popup-1",
  ],
  passingThreshold: 70,
  publishedAt: "2026-05-01",
  updatedAt: "2026-05-01",
  sources: [
    { label: "SK-CERT — správa o kybernetických hrozbách 2024", url: "https://www.sk-cert.sk/" },
    { label: "PZ SR — aktuálne podvody", url: "https://www.minv.sk/" },
    {
      label: "Europol — Internet Organised Crime Threat Assessment 2024",
      url: "https://www.europol.europa.eu/",
    },
  ],
};
