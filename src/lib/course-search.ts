import type { Course } from "@/content/courses";

/** Strip diacritics and lowercase for locale-agnostic comparison. */
function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Synonym expansions: if the query (normalized) matches the pattern,
 * extra tokens are appended before scoring. Enables Slovak natural-language
 * queries like "pre seniorov", "AI pomocník", "dôchodca".
 */
const EXPANSIONS: [RegExp, string][] = [
  [/senior|dochodc|starsich|babick|dedko|stari.*rod/, "chran vishing blizki starsich"],
  [/praca|zamestnani|brigad|staz|job|ponuka/, "nabor pracovne brigada"],
  [/krypto|bitcoin|ethereum|investic/, "investicne pig krypto butchering"],
  [/\bai\b|umel.*intelig|chatgpt|claude/, "bezpecnost pomocnik deepfake ai"],
  [/deepfake|hlasov.*podvod|klonovani/, "deepfake hlasove ai"],
  [/instagram|facebook|tiktok|socialni/, "kradez kont socialnych"],
  [/randeni|laska|vztah|tinder|dating|catfish|zoznamk/, "romance catfishing pig"],
  [/\bqr\b|qr.*kod/, "quishing qr"],
  [/reklam/, "malvertising reklamy falošne"],
  [/\bbec\b|fake.*ceo|sef.*podvod/, "bec pracovisko ceo"],
  [/telefon|vishing|volani|\bhovor\b/, "vishing telefonicke"],
  [/smishing/, "sms smishing"],
  [/phishing|phish/, "phishing email sms"],
  [/heslo|hesla|sukromi|\bdata\b|udaje|ochrana/, "data hygiene hesla sukromie"],
  [/auto|bazar|bazos|marketplace|inzerat|predaj.*onlin/, "marketplace bazar inzerat"],
  [/pig|butchering/, "pig butchering schemy investicne"],
  [/podvod.*prac|podvodn.*brigad/, "nabor pracovne"],
];

function expandQuery(normalizedQuery: string): string {
  let expanded = normalizedQuery;
  for (const [pattern, extra] of EXPANSIONS) {
    if (pattern.test(normalizedQuery)) {
      expanded += " " + extra;
    }
  }
  return expanded;
}

function buildCorpus(course: Course): string {
  const parts: string[] = [course.title, course.tagline, course.slug.replace(/-/g, " ")];
  for (const s of course.sections) {
    parts.push(s.heading);
    if (s.kind === "intro") parts.push(s.body.slice(0, 300));
    else if (s.kind === "example") parts.push(s.commentary.slice(0, 150));
    else if (s.kind === "checklist") parts.push(s.items.map((i) => i.text).join(" "));
    else if (s.kind === "redflags") parts.push(s.flags.join(" "));
    else if (s.kind === "do_dont") parts.push([...s.do, ...s.dont].join(" "));
    else if (s.kind === "scenario") parts.push(s.story.slice(0, 200), s.right_action.slice(0, 100));
  }
  return normalize(parts.join(" "));
}

// Corpora are expensive to build; cache them for the module lifetime.
const CORPUS_CACHE = new WeakMap<Course, string>();

function getCorpus(course: Course): string {
  const cached = CORPUS_CACHE.get(course);
  if (cached !== undefined) return cached;
  const corpus = buildCorpus(course);
  CORPUS_CACHE.set(course, corpus);
  return corpus;
}

export function searchCourses(courses: Course[], query: string): Course[] {
  const q = normalize(query.trim());
  if (!q) return courses;

  const expanded = expandQuery(q);
  const tokens = [...new Set(expanded.split(/\s+/).filter((t) => t.length >= 2))];

  const scored: { course: Course; score: number }[] = [];
  for (const course of courses) {
    const corpus = getCorpus(course);
    let score = 0;
    for (const token of tokens) {
      if (corpus.includes(token)) score++;
    }
    if (score > 0) scored.push({ course, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((r) => r.course);
}
