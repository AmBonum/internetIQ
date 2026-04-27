import type { TestPack } from "./_schema";

export const senioriPack: TestPack = {
  slug: "seniori",
  title: "Seniori (55+) — podvody cielené na starších",
  tagline:
    '„Ahoj babka" scam s AI klonovaním hlasu, dverový podvodník z banky, falošný príplatok k dôchodku, vishing polícia/technik. 13 otázok.',
  industry: "seniori",
  industryEmoji: "👴",
  targetPersona:
    "Dôchodca alebo aktívny päťdesiatnik — cieľ telefonických, dverových a poštových podvodov, vrátane najnovšej vlny AI voice-cloning podvodov.",
  questionIds: [
    // Nové — seniori-špecifické scam-y
    "s-vnuk-1",
    "s-door-bank-1",
    "f-pension-1",
    "s-ai-voice-1",
    "s-fake-charity-call-1",
    // Existujúce — overené scenáre
    "s-policia-call-1",
    "s-rodina-1",
    "s-vishing-1",
    "s-anydesk-1",
    "s-microsoft-call-1",
    "h-prince-1",
    "h-poslednavola-1",
    "p-sms-posta-1",
  ],
  passingThreshold: 65,
  publishedAt: "2026-05-01",
  updatedAt: "2026-05-01",
  sources: [
    { label: "PZ SR — podvody na senioroch", url: "https://www.minv.sk/" },
    { label: "Sociálna poisťovňa — upozornenia na falošné listy", url: "https://www.socpoist.sk/" },
    { label: "Europol — voice cloning fraud 2024", url: "https://www.europol.europa.eu/" },
    { label: "SK-CERT — vishing a telefonické podvody", url: "https://www.sk-cert.sk/" },
  ],
};
