import type { TestPack } from "@/content/test-packs";

const SITE_ORIGIN = "https://subenai.lvtesting.eu";
const PUBLISHER_NAME = "subenai";

const INDUSTRY_LABEL: Record<TestPack["industry"], string> = {
  eshop: "E-shop",
  gastro: "Gastro",
  autoservis: "Autoservis",
  it: "IT / Softvérový vývoj",
  verejne_sluzby: "Verejné služby",
  dispecing: "Dispečing",
  doprava: "Doprava a logistika",
  marketing: "Marketing / Agentúra",
  zdravotnictvo: "Zdravotníctvo",
  skoly: "Školy",
  strojova_vyroba: "Strojová výroba",
  pneuservis: "Pneuservis",
  sme_ucto: "SME účtovníctvo",
  horeca: "HORECA",
  servis: "Servis a opravy",
  ziaci: "Žiaci (do 16 rokov)",
  studenti: "Študenti (16+)",
  seniori: "Seniori (55+)",
  vseobecny: "Všeobecný test",
};

/**
 * Schema.org Quiz JSON-LD for an industry test pack. Google supports
 * the Quiz type for educational quizzes; including it boosts rich
 * results eligibility for the `/testy/{slug}` flow.
 */
export function buildPackQuizJsonLd(pack: TestPack): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: pack.title,
    description: pack.tagline,
    inLanguage: "sk-SK",
    isAccessibleForFree: true,
    educationalLevel: "vocational",
    about: INDUSTRY_LABEL[pack.industry],
    numberOfQuestions: pack.questionIds.length,
    url: `${SITE_ORIGIN}/testy/${pack.slug}`,
    datePublished: pack.publishedAt,
    dateModified: pack.updatedAt,
    publisher: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: SITE_ORIGIN,
    },
  };
}

export { INDUSTRY_LABEL };
