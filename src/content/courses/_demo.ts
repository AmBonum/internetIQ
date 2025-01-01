import type { Course } from "./_schema";

/**
 * Placeholder course used as a compile-time check on the schema and a
 * worked reference for new authors. Hidden from the index UI by slug
 * convention (leading underscore filtered in the listing query).
 */
export const demoCourse: Course = {
  slug: "demo-template",
  title: "Demo kurz — ako vyzerá content",
  tagline: "Šablóna pre autorov: takto vyzerá kurz po zaregistrovaní.",
  category: "obecne",
  difficulty: "začiatočník",
  estimatedMinutes: 3,
  heroEmoji: "📚",
  sections: [
    {
      kind: "intro",
      heading: "O čom kurz je",
      body: "Tento demo kurz nie je zverejnený v zozname — slúži len ako šablóna a ako compile-time test schémy. Skopíruj ho keď tvoríš nový kurz.",
    },
    {
      kind: "redflags",
      heading: "Na čo si dať pozor (príklad)",
      flags: [
        'Súrnosť — „akcia končí o 5 minút"',
        "Žiadosť o citlivé údaje cez SMS",
        "Doména, ktorá je len skoro správna",
      ],
    },
    {
      kind: "do_dont",
      heading: "Pravidlá (príklad)",
      do: ["Pomaly si prečítať odkaz pred kliknutím."],
      dont: ["Klikať na linky zo SMS od neznámeho čísla."],
    },
  ],
  sources: [{ label: "NBÚ — odporúčania", url: "https://www.nbu.gov.sk/" }],
  publishedAt: "2026-04-26",
  updatedAt: "2026-04-26",
};
