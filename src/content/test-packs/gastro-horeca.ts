import type { TestPack } from "./_schema";

export const gastroHorecaPack: TestPack = {
  slug: "gastro-horeca",
  title: "Gastro & HORECA — bezpečnosť pri PoS a rezerváciách",
  tagline:
    "Falošné rezervácie cez Booking, podvodné dodávateľské faktúry, kompromitovaný POS a QR menu pasce. 14 otázok pre tím prevádzky.",
  industry: "gastro",
  industryEmoji: "🍕",
  targetPersona:
    "Manažér prevádzky, čašníci, účtovníctvo, dodávatelia — všetci, ktorí vidia QR-ky, faktúry a rezervácie každý deň.",
  questionIds: [
    // Booking + email phishing relevantné pre rezervácie a dodávateľov
    "f-bookingmsg-1",
    "p-email-bec-1",
    "p-email-faktura-1",
    "p-email-bank-statement-1",
    "p-email-linkedin-1",
    // Scenáre — QR podvody, Wi-Fi, fake update, redirect
    "s-quishing-1",
    "s-wifi-1",
    "s-fake-update-1",
    "s-redirect-1",
    // Fake influencer (PR) — gastro recenzie
    "f-fake-influencer-1",
    // Honeypoty — legit rezervácie + bankové stránky
    "h-url-shop-9",
    "h-url-bank-10",
    "h-url-shop-2",
    "h-url-bank-1",
  ],
  passingThreshold: 70,
  publishedAt: "2026-04-27",
  updatedAt: "2026-04-27",
  sources: [
    { label: "NCKB — phishing pre malé prevádzky", url: "https://www.sk-cert.sk/" },
    { label: "Booking.com — bezpečnostné centrum partnerov", url: "https://partner.booking.com/" },
    { label: "Slovenská obchodná inšpekcia", url: "https://www.soi.sk/" },
  ],
};
