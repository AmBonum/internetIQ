import type { Category, Question, Severity } from "./questions";

export interface AnswerRecord {
  questionId: string;
  optionId: string | null; // null = timeout
  correct: boolean;
  severity: Severity; // penalty severity if wrong, null if correct
  responseMs: number;
  category: Category;
  difficulty: "easy" | "medium" | "hard";
}

export interface ScoreResult {
  baseScore: number;
  finalScore: number;
  totalPenalty: number;
  percentile: number;
  personality: PersonalityId;
  breakdown: Record<"phishing" | "url" | "fake_vs_real" | "scenario", number>;
  insights: string[];
  stats: {
    criticalMistakes: number;
    mediumMistakes: number;
    minorMistakes: number;
    avgResponseMs: number;
    totalTimeMs: number;
  };
  flags: string[];
}

export type PersonalityId =
  | "internet_ninja"
  | "overconfident_victim"
  | "scam_magnet"
  | "clickbait_zombie"
  | "cautious_but_vulnerable";

export const DIFFICULTY_POINTS = { easy: 1, medium: 2, hard: 3 } as const;
export const PENALTY = { critical: 15, medium: 7, minor: 3 } as const;

export function buildAnswerRecord(
  q: Question,
  optionId: string | null,
  responseMs: number,
): AnswerRecord {
  const opt = q.options.find((o) => o.id === optionId);
  const correct = !!opt?.correct;
  let severity: Severity = null;
  if (!correct) {
    severity = opt?.severity ?? "medium";
  }
  return {
    questionId: q.id,
    optionId,
    correct,
    severity,
    responseMs,
    category: q.category,
    difficulty: q.difficulty,
  };
}

export function computeScore(answers: AnswerRecord[]): ScoreResult {
  const totalPoints = answers.reduce((sum, a) => sum + DIFFICULTY_POINTS[a.difficulty], 0);
  const earned = answers.reduce(
    (sum, a) => sum + (a.correct ? DIFFICULTY_POINTS[a.difficulty] : 0),
    0,
  );
  const baseScore = totalPoints > 0 ? (earned / totalPoints) * 100 : 0;

  let totalPenalty = 0;
  let criticalMistakes = 0;
  let mediumMistakes = 0;
  let minorMistakes = 0;

  for (const a of answers) {
    if (a.correct) continue;
    if (a.severity === "critical") {
      totalPenalty += PENALTY.critical;
      criticalMistakes++;
    } else if (a.severity === "medium") {
      totalPenalty += PENALTY.medium;
      mediumMistakes++;
    } else if (a.severity === "minor") {
      totalPenalty += PENALTY.minor;
      minorMistakes++;
    }
    if (a.responseMs < 2000 && a.optionId !== null) {
      totalPenalty += 5;
    }
  }

  // Cap penalty so each correct answer always contributes meaningfully —
  // before the cap users could get 0/100 with 5+ correct answers when wrong
  // ones were mostly critical.
  const cappedPenalty = Math.min(totalPenalty, baseScore * 0.7);
  const finalScore = Math.max(0, Math.min(100, Math.round(baseScore - cappedPenalty)));
  const percentile = Math.round(100 / (1 + Math.exp(-0.08 * (finalScore - 50))));

  const breakdown = computeBreakdown(answers);
  const avgResponseMs = answers.reduce((s, a) => s + a.responseMs, 0) / Math.max(1, answers.length);
  const totalTimeMs = answers.reduce((s, a) => s + a.responseMs, 0);

  const personality = derivePersonality({
    finalScore,
    breakdown,
    criticalMistakes,
    avgResponseMs,
  });

  const insights = generateInsights({
    breakdown,
    criticalMistakes,
    mediumMistakes,
    avgResponseMs,
    finalScore,
  });

  const flags: string[] = [];
  if (avgResponseMs < 1500) flags.push("suspicious_speed");

  return {
    baseScore: Math.round(baseScore),
    finalScore,
    totalPenalty: Math.round(cappedPenalty),
    percentile,
    personality,
    breakdown,
    insights,
    stats: {
      criticalMistakes,
      mediumMistakes,
      minorMistakes,
      avgResponseMs: Math.round(avgResponseMs),
      totalTimeMs,
    },
    flags,
  };
}

function computeBreakdown(answers: AnswerRecord[]) {
  const cats = ["phishing", "url", "fake_vs_real", "scenario"] as const;
  const result: Record<(typeof cats)[number], number> = {
    phishing: 0,
    url: 0,
    fake_vs_real: 0,
    scenario: 0,
  };
  for (const c of cats) {
    const inCat = answers.filter((a) => a.category === c);
    if (inCat.length === 0) {
      result[c] = 100;
      continue;
    }
    const correct = inCat.filter((a) => a.correct).length;
    result[c] = Math.round((correct / inCat.length) * 100);
  }
  return result;
}

function derivePersonality(args: {
  finalScore: number;
  breakdown: ScoreResult["breakdown"];
  criticalMistakes: number;
  avgResponseMs: number;
}): PersonalityId {
  const { finalScore, breakdown, criticalMistakes, avgResponseMs } = args;
  if (finalScore > 80 && criticalMistakes === 0) return "internet_ninja";
  if (avgResponseMs < 3000 && finalScore < 60) return "overconfident_victim";
  if (breakdown.phishing < 50 && criticalMistakes >= 2) return "scam_magnet";
  if (breakdown.phishing >= 60 && breakdown.fake_vs_real < 50) return "clickbait_zombie";
  return "cautious_but_vulnerable";
}

// ===================== INSIGHTS — POOL OF ROASTS =====================
// Rotates based on weakness + a deterministic-ish seed (score) so user gets
// different roasts each test but consistent within one result.

interface InsightContext {
  breakdown: ScoreResult["breakdown"];
  criticalMistakes: number;
  mediumMistakes: number;
  avgResponseMs: number;
  finalScore: number;
}

const INSIGHT_POOL = {
  phishing_low: [
    'Klikol by si na phishing SMS od „kuriéra"',
    'Pošta ti „nedoručila zásielku" — a ty si zaplatil 1,99 €',
    '„Vaša banka" by ťa cez SMS dostala bez potu',
    'Phishing email od „SLSP" si neviete rozoznať od pravého',
  ],
  scenario_low: [
    'Bankový kód z SMS by si nadiktoval „bankárovi"',
    '„Microsoft support" volá — a ty mu dáš TeamViewer prístup',
    "Fake virus popup ťa donúti zavolať na 0800 číslo",
    "QR kód na zastávke MHD si naskenuješ bez váhania",
  ],
  fake_vs_real_low: [
    "Nalietol by si fake eshopu z IG reklamy",
    'Bazoš inzerát „za polovicu, posielam DPD" → posielaš zálohu',
    'Fake Stripe link od „kupca" by ti vyčistil účet',
    "AirPods za 29 € z IG by si si objednal s úsmevom",
  ],
  url_low: [
    "Nerozoznal by si `tatrabanka.secure-login.sk` od pravého",
    "Subdoména vs. doména pre teba neznamená nič — `posta.sk-balik.com` ✅",
    "Unicode triky v URL ťa pošlú priamo do náručia scammera",
    "`g00gle.com` vs `google.com` — a ty si nevidel rozdiel",
  ],
  speed_overconfident: [
    "Odpovedal si tak rýchlo, že si si otázku ani nedočítal",
    "Priemerný čas pod 3 sekundy — to nie je intuícia, to je hazard",
    "Sebavedomie 100, pozornosť 12. Klasika.",
  ],
  critical_pile: [
    "Kritických chýb si urobil viac, než je zdravé",
    "Každá kritická chyba = reálne stratené peniaze v živote",
    "V realite by si práve teraz volal banku, že ti zmizli úspory",
  ],
  positive: {
    phishing_high: ["Phishing cítiš z kilometra"],
    scenario_high: ["Telefonické scamy ťa nedostanú"],
    fake_vs_real_high: ["Fake eshopy nemajú šancu"],
    url_high: ["URL si overuješ — respekt"],
    no_critical: ["Kritickú chybu si neurobil ani raz"],
    fast_and_correct: ["Rýchly a presný — ako sa patrí"],
  },
};

function pickFromPool(pool: string[], seed: number): string {
  return pool[seed % pool.length];
}

function generateInsights(ctx: InsightContext): string[] {
  const { breakdown, criticalMistakes, avgResponseMs, finalScore } = ctx;
  const seed = finalScore + criticalMistakes * 7;
  const out: string[] = [];

  // Negative insights — pick where weak
  const weaknesses: Array<{ score: number; pool: string[] }> = [
    { score: breakdown.phishing, pool: INSIGHT_POOL.phishing_low },
    { score: breakdown.scenario, pool: INSIGHT_POOL.scenario_low },
    { score: breakdown.fake_vs_real, pool: INSIGHT_POOL.fake_vs_real_low },
    { score: breakdown.url, pool: INSIGHT_POOL.url_low },
  ];
  // Sort weakest first
  weaknesses.sort((a, b) => a.score - b.score);
  for (const w of weaknesses) {
    if (w.score < 60 && out.length < 3) {
      out.push(pickFromPool(w.pool, seed + out.length));
    }
  }

  // Speed shame
  if (avgResponseMs < 3000 && finalScore < 70 && out.length < 3) {
    out.push(pickFromPool(INSIGHT_POOL.speed_overconfident, seed));
  }
  // Critical pile-up
  if (criticalMistakes >= 3 && out.length < 3) {
    out.push(pickFromPool(INSIGHT_POOL.critical_pile, seed));
  }

  // Positive fillers if not enough negatives
  if (out.length < 2) {
    if (breakdown.phishing >= 80) out.push(pickFromPool(INSIGHT_POOL.positive.phishing_high, seed));
    if (breakdown.url >= 80 && out.length < 3)
      out.push(pickFromPool(INSIGHT_POOL.positive.url_high, seed));
    if (breakdown.fake_vs_real >= 80 && out.length < 3)
      out.push(pickFromPool(INSIGHT_POOL.positive.fake_vs_real_high, seed));
    if (breakdown.scenario >= 80 && out.length < 3)
      out.push(pickFromPool(INSIGHT_POOL.positive.scenario_high, seed));
    if (criticalMistakes === 0 && out.length < 3)
      out.push(pickFromPool(INSIGHT_POOL.positive.no_critical, seed));
    if (avgResponseMs < 5000 && finalScore > 80 && out.length < 3)
      out.push(pickFromPool(INSIGHT_POOL.positive.fast_and_correct, seed));
  }

  return out.slice(0, 3);
}

// ===================== PERSONALITIES — MULTIPLE VARIANTS =====================

export interface PersonalityCopy {
  id: PersonalityId;
  name: string;
  emoji: string;
  taglines: string[];
  descriptions: string[];
  advice: string[][];
}

export const PERSONALITIES: Record<PersonalityId, PersonalityCopy> = {
  scam_magnet: {
    id: "scam_magnet",
    name: "Scam Magnet (Magnet na podvody)",
    emoji: "💀",
    taglines: [
      "Scammeri ti píšu sami od seba.",
      "Nigerijský princ má tvoj kontakt na rýchlej voľbe.",
      "Si ich obľúbený zákazník.",
    ],
    descriptions: [
      'Klikol by si na „Slovenská pošta – zásielka čaká" bez premýšľania. Kdekoľvek sa na internete potkne podvodník, nájde teba. Prvé, čo ťa čaká po tomto teste, je zapnutie 2FA.',
      'Tvoj telefón je pre scammerov zlatá baňa. Každý druhý link otvoríš, každú „banku" si vypočuješ. Si dôvod, prečo phishing stále funguje.',
      'V štatistikách Polície SR sa nazývaš „typický poškodený". Tvoja peňaženka má v sebe diery, ktoré ani nevidíš.',
    ],
    advice: [
      [
        "Zapni si dvojfaktorovú autentifikáciu všade, kde sa dá. Hlavne na emaile.",
        "Banka ťa NIKDY nežiada o kód z SMS. Bodka.",
        "Nainštaluj si password manager. Prosím.",
      ],
      [
        "Pred každým klikom: kto, prečo, je to reálne?",
        "Pošli tento test priateľovi — nech ti je svedok pri ďalšom skoro-podvode.",
        'Ulož si číslo na linku banky 0800. Volaj im, keď ti niekto pošle „súrny" link.',
      ],
    ],
  },
  clickbait_zombie: {
    id: "clickbait_zombie",
    name: "Clickbait Zombie (Otrok titulkov)",
    emoji: "🧨",
    taglines: [
      "Peniaze ti nevezmú. Klikneš ale na všetko.",
      "Tvoj browser history je horor.",
      'Zombie mód: aktivovaný titulkom „Neuveríš...".',
    ],
    descriptions: [
      'Phishing rozoznáš, scammer zaplače. Ale ukáž ti titulok „Neuveríš, čo sa stalo potom…" a už si tam. Hodinu. Scrolluješ. Nepamätáš si, prečo si si zobral telefón.',
      'Bazos a Aliexpress ťa nedostanú. Ale 21 hodín mesačne dýchaš na cudzie životy cez 9-bodové zoznamy „šokujúcich" obrázkov. To je celý víkend, kamoš.',
      'Tvoj mozog ti hovorí: „len ešte jeden článok". Tvoj prst ti hovorí to isté. Niekedy zaspíš s telefónom v ruke.',
    ],
    advice: [
      [
        "Zablokuj si notifikácie z bulvárnych stránok.",
        'Pred klikom: „Fakt to chcem vedieť?"',
        "Daj si limit na social media v telefóne.",
      ],
      [
        "Nainštaluj si uBlock Origin. Vážne. Hneď.",
        "Greyscale mód v telefóne — farby ťa hypnotizujú.",
        "Telefón pri zaspávaní do druhej miestnosti.",
      ],
    ],
  },
  cautious_but_vulnerable: {
    id: "cautious_but_vulnerable",
    name: "Opatrný, ale zraniteľný",
    emoji: "😬",
    taglines: ["Tušíš podraz. Niekedy.", "70 % obrana, 30 % otvorené dvere.", "Skoro tam si."],
    descriptions: [
      'Vieš, že internet je zradný. Email od „princa z Nigérie" ignoruješ. Ale niekedy sa necháš prekvapiť dobre spraveným scam-om. Si 70 % v bezpečí. 30 % žiješ v riziku.',
      "Bežné scamy ťa nedostanú. Ale tie nové, vyladené, s real logom a deepfake hlasom — pri tých sa zapotíš. Ešte trochu paranoje a si v top 10 %.",
      "Máš zdravý inštinkt, ale nie systém. Občas si v strese, v práci, unavený — a vtedy klikneš. Scammeri vedia kedy útočiť.",
    ],
    advice: [
      [
        "Nauč sa rozpoznať URL triky (subdoména vs doména).",
        'Pri SMS od „banky" vždy zavolať na banku priamo.',
        'Ignoruj „limitovaný čas" a „akcia končí o 5 minút".',
      ],
      [
        "Password manager + unikátne heslá pre každý účet.",
        "Pre podozrivý link použi virustotal.com pred kliknutím.",
        "Vyhnúť sa rozhodnutiam pod stresom — scammeri to vedia.",
      ],
    ],
  },
  internet_ninja: {
    id: "internet_ninja",
    name: "Internet Ninja (Pán internetu)",
    emoji: "🧠",
    taglines: [
      "Scammeri ti radšej dajú pokoj.",
      "URL si overuješ aj na rodinnom obede.",
      "Si tieň, ktorý phishing nikdy nedostane.",
    ],
    descriptions: [
      "Si v top 10 %. Podvod cítiš z kilometra. Phishing email otvoríš iba zo zvedavosti, URL si overíš, na rodinných stretnutiach si IT support. Si unavený. Chápeme.",
      'Tvoj mozog má vstavaný scam-detektor. Domov si nosíš paranoje z roboty a do roboty paranoje z domu. „Klikneš mi to?" — počuješ desaťkrát denne.',
      "Si ten človek, ktorý na firemné phishing simulácie odpovie hlásením HR-ke. Si presne ten, koho IT oddelenie miluje a kolegovia neznášajú.",
    ],
    advice: [
      [
        "Pošli tento test rodičom. Viac nezmôžeš.",
        "Staraj sa aj o offline ľudí — fyzické scamy sú dnes real.",
        "Prestaň ich zachraňovať. Nech si to prežijú sami.",
      ],
      [
        "Nauč mamu používať password manager. Trpezlivo.",
        "Skontroluj babke nastavenia v internet bankingu.",
        "Buď ten otravný kamarát, čo všetkým hovorí o 2FA.",
      ],
    ],
  },
  overconfident_victim: {
    id: "overconfident_victim",
    name: "Naivný Sebavedomec",
    emoji: "🤡",
    taglines: [
      "Sebavedomie vyššie než skill.",
      'Myslíš si „mňa nie". Ich obľúbená veta.',
      "Rýchla ruka, prázdna peňaženka.",
    ],
    descriptions: [
      'Odpovedal si rýchlo. Sebaisto. Nesprávne. Kategória ľudí, ktorí si myslia „mňa by to nikdy nedostalo" — a potom dostanú. Scammeri ťa milujú. Si ich favourite type.',
      'Klikáš ako keby si vedel. Nevieš. Tvoja rýchlosť je presne to, na čo scammeri stavia — „súrne", „limitovaný čas", „posledná šanca". Padáš do toho s úsmevom.',
      "Si presvedčený, že tieto testy sú pre druhých. Pre dôchodcov. Pre naivných. A predsa si tu, na konci, s 40 bodmi a hrdosťou v črepoch.",
    ],
    advice: [
      [
        'Spomaliť. Preniesť prst nad „klik" a 3 sekundy dýchať.',
        "Prijať, že občas naletíš. Je to OK.",
        "Nabudúce čítaj otázku do konca.",
      ],
      [
        'Pravidlo: žiadny klik bez „prečo to vôbec dostávam?".',
        'Skontroluj odosielateľa. Vždy. Aj keď „je to len reklama".',
        "Pýtaj sa kamaráta predtým, ako spravíš platbu.",
      ],
    ],
  },
};

/** Pick a tagline / description / advice variant from a personality, deterministically per result. */
export function pickPersonalityVariant(personality: PersonalityCopy, seed: number) {
  return {
    name: personality.name,
    emoji: personality.emoji,
    tagline: personality.taglines[seed % personality.taglines.length],
    description: personality.descriptions[seed % personality.descriptions.length],
    advice: personality.advice[seed % personality.advice.length],
  };
}

export const CATEGORY_LABELS: Record<keyof ScoreResult["breakdown"], string> = {
  phishing: "Phishing emaily/SMS",
  url: "URL a domény",
  fake_vs_real: "Fake stránky a inzeráty",
  scenario: "Scenáre (telefón, SMS, QR)",
};
