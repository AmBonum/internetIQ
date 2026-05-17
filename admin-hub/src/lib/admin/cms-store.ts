// Mock CMS store for content management within the admin panel.
// Field names map cleanly to future DB tables:
//   cms_pages, cms_sections, cms_menu_items, cms_header_config, cms_footer_config
//
// Mock data is seeded from real SubenAI subpages observed at https://subenai.sk

export type PageStatus = "draft" | "published" | "archived";
export type SectionKind =
  | "hero"
  | "rich_text"
  | "features"
  | "cta"
  | "faq"
  | "stats"
  | "testimonials"
  | "gallery"
  | "image"
  | "contact_form"
  | "pricing";

export interface FeatureItem {
  id: string;
  title: string;
  description: string;
  icon?: string; // lucide icon name
  image?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface StatItem {
  id: string;
  label: string;
  value: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role?: string;
  avatar?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  features: string[];
  highlighted?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
}

export interface Section {
  id: string;
  kind: SectionKind;
  enabled: boolean;
  // hero / cta / image / rich_text
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  imageUrl?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
  // features / faq / stats / testimonials / gallery / pricing
  features?: FeatureItem[];
  faqs?: FaqItem[];
  stats?: StatItem[];
  testimonials?: TestimonialItem[];
  gallery?: { id: string; url: string; alt?: string }[];
  pricing?: PricingPlan[];
  // layout knobs
  background?: "default" | "muted" | "primary" | "gradient";
  align?: "left" | "center";
  columns?: 2 | 3 | 4;
}

export interface Page {
  id: string;
  slug: string; // "/" for home
  title: string;
  description: string;
  status: PageStatus;
  showInSitemap: boolean;
  ogImage?: string;
  updatedAt: string;
  sections: Section[];
}

export type MenuLocation = "header" | "footer_product" | "footer_legal" | "footer_company";

export interface MenuItem {
  id: string;
  label: string;
  url: string;
  location: MenuLocation;
  order: number;
  parentId?: string | null;
  openInNewTab?: boolean;
}

export interface HeaderConfig {
  logoText: string;
  logoImageUrl?: string;
  showLogin: boolean;
  loginLabel: string;
  loginUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  sticky: boolean;
  announcement?: string;
  announcementEnabled: boolean;
}

export interface FooterConfig {
  logoText: string;
  tagline: string;
  copyright: string;
  socials: { id: string; platform: string; url: string }[];
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  newsletterEnabled: boolean;
  newsletterHeading: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Mock seed data — realistic SubenAI content
// ────────────────────────────────────────────────────────────────────────────

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 8)}`;

export const seedPages: Page[] = [
  {
    id: "pg_home",
    slug: "/",
    title: "SubenAI — Otestuj sa, kým ťa otestuje podvodník",
    description:
      "Krátke interaktívne testy a školenia, ktoré ťa naučia rozoznať phishing, smishing a online podvody za pár minút.",
    status: "published",
    showInSitemap: true,
    ogImage: "/og/home.jpg",
    updatedAt: "2026-05-10T09:12:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        eyebrow: "Bezpečnosť na internete",
        heading: "Otestuj sa, kým ťa otestuje podvodník",
        subheading:
          "Naučíme ťa rozoznať smishing, phishing a online podvody za pár minút. Bez registrácie. Zadarmo.",
        ctaLabel: "Spustiť test",
        ctaUrl: "/testy",
        secondaryCtaLabel: "Ako to funguje",
        secondaryCtaUrl: "/ako-to-funguje",
        imageUrl: "/img/hero-phone.png",
        background: "gradient",
        align: "left",
      },
      {
        id: uid("sec"),
        kind: "stats",
        enabled: true,
        heading: "Slovensko v číslach",
        background: "muted",
        stats: [
          { id: uid("st"), label: "podvodných SMS denne", value: "12 400+" },
          { id: uid("st"), label: "obetí phishingu v 2025", value: "38 %" },
          { id: uid("st"), label: "priemerná škoda", value: "1 240 €" },
          { id: uid("st"), label: "dokončených testov", value: "84 250" },
        ],
      },
      {
        id: uid("sec"),
        kind: "features",
        enabled: true,
        eyebrow: "Čo ťa naučíme",
        heading: "Krátko, prakticky, podľa reálnych prípadov",
        columns: 3,
        features: [
          {
            id: uid("f"),
            title: "Smishing (podvodné SMS)",
            description:
              "Falošné správy od pošty, banky či úradu. Naučíš sa ich rozoznať za 3 sekundy.",
            icon: "MessageSquare",
          },
          {
            id: uid("f"),
            title: "Phishing e-maily",
            description: "Ako spoznať falošný e-mail od „banky“ či doručovateľa, aj keď vyzerá perfektne.",
            icon: "Mail",
          },
          {
            id: uid("f"),
            title: "Telefonické podvody",
            description: "Vishing, AI hlasy a falošní operátori. Čo robiť, keď ti zavolá „polícia“.",
            icon: "Phone",
          },
          {
            id: uid("f"),
            title: "Falošné e-shopy",
            description: "Tri znaky, ktoré okamžite prezradí podvodný obchod ešte pred platbou.",
            icon: "ShoppingCart",
          },
          {
            id: uid("f"),
            title: "Sociálne siete",
            description: "Romance scams, falošné výhry a klony účtov tvojich známych.",
            icon: "Users",
          },
          {
            id: uid("f"),
            title: "Bezpečné heslá a 2FA",
            description: "Ako si chrániť účty bez toho, aby si si pamätal/a 40 hesiel.",
            icon: "Lock",
          },
        ],
      },
      {
        id: uid("sec"),
        kind: "testimonials",
        enabled: true,
        heading: "Čo hovoria ľudia",
        testimonials: [
          {
            id: uid("t"),
            quote:
              "Mama mi poslala SMS od „pošty“ — vďaka SubenAI testu som vedela, že je to podvod. Ušetrila mi peniaze.",
            author: "Lucia K.",
            role: "Bratislava",
          },
          {
            id: uid("t"),
            quote:
              "Robíme s tým školenia pre seniorov v knižnici. Funguje to lepšie než hodinová prednáška.",
            author: "Mgr. Peter H.",
            role: "Mestská knižnica Nitra",
          },
          {
            id: uid("t"),
            quote: "Konečne edukácia, ktorá nie je nudná. Synovi som to poslal a prešiel za 7 minút.",
            author: "Ján S.",
            role: "Košice",
          },
        ],
      },
      {
        id: uid("sec"),
        kind: "cta",
        enabled: true,
        heading: "Pripravený/á sa otestovať?",
        subheading: "Trvá to menej než káva. A môže ti to ušetriť stovky eur.",
        ctaLabel: "Spustiť test zadarmo",
        ctaUrl: "/testy",
        background: "primary",
        align: "center",
      },
    ],
  },
  {
    id: "pg_testy",
    slug: "/testy",
    title: "Testy — SubenAI",
    description: "Interaktívne testy z oblasti kybernetickej bezpečnosti a online podvodov.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-05-08T14:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        heading: "Vyber si test",
        subheading: "Každý trvá 5–10 minút. Bez registrácie. Výsledok vidíš hneď.",
        align: "center",
      },
      {
        id: uid("sec"),
        kind: "features",
        enabled: true,
        heading: "Aktuálne testy",
        columns: 3,
        features: [
          {
            id: uid("f"),
            title: "SMS podvody (smishing)",
            description: "5 typov smiškov, ktoré teraz lietajú v SR — a ako ich rozoznať za 3 sekundy.",
            icon: "MessageSquare",
          },
          {
            id: uid("f"),
            title: "Bankové phishing e-maily",
            description: "Spozaj falošný e-mail aj keď vyzerá ako od ČSOB, Tatra či SLSP.",
            icon: "Mail",
          },
          {
            id: uid("f"),
            title: "Vishing & AI hlasy",
            description: "Telefonát od „polície“ alebo „banky“ — čo robiť a čo nikdy nepovedať.",
            icon: "Phone",
          },
          {
            id: uid("f"),
            title: "Falošné e-shopy",
            description: "Pred-vianočná špeciálka: znaky podvodného obchodu pred kliknutím Kúpiť.",
            icon: "ShoppingCart",
          },
          {
            id: uid("f"),
            title: "Romance scams",
            description: "Ako vyzerá manipulácia cez zoznamky a sociálne siete v praxi.",
            icon: "Heart",
          },
          {
            id: uid("f"),
            title: "Pre seniorov",
            description: "Zjednodušená verzia s veľkým písmom a hlasovým komentárom.",
            icon: "UserCheck",
          },
        ],
      },
    ],
  },
  {
    id: "pg_ako",
    slug: "/ako-to-funguje",
    title: "Ako to funguje — SubenAI",
    description: "Tri kroky k tomu, ako sa zorientovať v dnešných online podvodoch.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-04-22T10:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        heading: "Ako to funguje",
        subheading: "Žiadne nudné prednášky. Učíš sa hraním sa.",
        align: "center",
      },
      {
        id: uid("sec"),
        kind: "features",
        enabled: true,
        columns: 3,
        features: [
          {
            id: uid("f"),
            title: "1. Vyber si tému",
            description: "SMS, e-mail, telefón, e-shop, sociálne siete — alebo všetko naraz.",
            icon: "ListChecks",
          },
          {
            id: uid("f"),
            title: "2. Prejdi krátky test",
            description: "8–12 otázok podľa reálnych podvodov v SR. Po každej odpovedi dostaneš vysvetlenie.",
            icon: "Sparkles",
          },
          {
            id: uid("f"),
            title: "3. Získaj certifikát",
            description: "PDF certifikát a zhrnutie, čo si zvládol/-la. Môžeš ho poslať kolegom či rodine.",
            icon: "Award",
          },
        ],
      },
    ],
  },
  {
    id: "pg_podpora",
    slug: "/podpora",
    title: "Podpor SubenAI",
    description: "SubenAI je nezisková iniciatíva. Tvoja podpora platí servery, vývoj a nový obsah.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-05-12T08:30:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        heading: "Podpor SubenAI",
        subheading: "Bez reklám. Bez sledovania. Vďaka ľuďom ako ty.",
        ctaLabel: "Prispieť 5 €",
        ctaUrl: "#donate",
        background: "gradient",
        align: "center",
      },
      {
        id: uid("sec"),
        kind: "pricing",
        enabled: true,
        heading: "Vyber si sumu",
        pricing: [
          { id: uid("p"), name: "Káva", price: "3 €", features: ["Jednorazovo"], ctaLabel: "Prispieť" },
          {
            id: uid("p"),
            name: "Pomocná ruka",
            price: "10 €",
            features: ["Jednorazovo", "Mesačne"],
            highlighted: true,
            ctaLabel: "Prispieť",
          },
          { id: uid("p"), name: "Mecenáš", price: "25 €", features: ["Mesačne"], ctaLabel: "Prispieť" },
        ],
      },
      {
        id: uid("sec"),
        kind: "rich_text",
        enabled: true,
        heading: "Kam idú peniaze",
        body:
          "Servery (~120 €/mes.), tvorba nového obsahu (smishing kampane v SR sa menia každý mesiac), prekladanie pre seniorov, audit bezpečnosti.",
      },
    ],
  },
  {
    id: "pg_onas",
    slug: "/o-nas",
    title: "O nás — SubenAI",
    description: "Sme nezisková iniciatíva, ktorá učí Slovákov rozoznať online podvody.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-03-15T12:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        heading: "O nás",
        subheading: "Tím bezpečnostných inžinierov, edukátorov a dizajnérov.",
        align: "center",
      },
      {
        id: uid("sec"),
        kind: "rich_text",
        enabled: true,
        body:
          "SubenAI vznikol v roku 2025 ako reakcia na rastúcu vlnu podvodných SMS a phishingu na Slovensku. Naším cieľom je dať ľuďom nástroj, ktorý ich naučí brániť sa — bez technického žargónu, bez registrácie, zadarmo.",
      },
      {
        id: uid("sec"),
        kind: "testimonials",
        enabled: true,
        heading: "Tím",
        testimonials: [
          { id: uid("t"), quote: "Vedúca obsahu, ex-CSIRT.SK", author: "Jana Horváthová" },
          { id: uid("t"), quote: "Frontend & dizajn", author: "Martin Kováč" },
          { id: uid("t"), quote: "Bezpečnostný analytik", author: "Roman Slávik" },
        ],
      },
    ],
  },
  {
    id: "pg_blog",
    slug: "/blog",
    title: "Blog — SubenAI",
    description: "Aktuálne kampane podvodníkov, analýzy a praktické rady.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-05-13T07:30:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        heading: "Blog",
        subheading: "Čo sa teraz deje na slovenskom internete.",
        align: "center",
      },
      {
        id: uid("sec"),
        kind: "features",
        enabled: true,
        columns: 3,
        features: [
          {
            id: uid("f"),
            title: "Nová vlna SMS „Slovenská pošta“",
            description: "Apríl 2026 — rozbor 5 najčastejších variantov a domén, ktoré používajú.",
            icon: "Newspaper",
          },
          {
            id: uid("f"),
            title: "AI hlasy v telefonátoch",
            description: "Ako rozoznať klonovaný hlas a prečo sa platí len bankovým prevodom.",
            icon: "Mic",
          },
          {
            id: uid("f"),
            title: "Black Friday: falošné e-shopy",
            description: "8 znakov podvodu, na ktoré sa pozri pred objednávkou.",
            icon: "ShoppingBag",
          },
        ],
      },
    ],
  },
  {
    id: "pg_cennik",
    slug: "/cennik",
    title: "Cenník pre firmy a školy — SubenAI",
    description: "Pre verejnosť je SubenAI zadarmo. Firmy a školy si môžu objednať tímové školenia.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-04-01T09:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        heading: "Cenník",
        subheading: "Pre verejnosť zadarmo. Pre firmy a školy s podporou.",
        align: "center",
      },
      {
        id: uid("sec"),
        kind: "pricing",
        enabled: true,
        pricing: [
          {
            id: uid("p"),
            name: "Verejnosť",
            price: "0 €",
            period: "navždy",
            features: ["Všetky testy", "Certifikát PDF", "Bez registrácie"],
            ctaLabel: "Spustiť test",
            ctaUrl: "/testy",
          },
          {
            id: uid("p"),
            name: "Škola",
            price: "od 19 €",
            period: "mesačne",
            features: ["Triedy a žiaci", "Reporting pre učiteľa", "Export do PDF"],
            highlighted: true,
            ctaLabel: "Mám záujem",
            ctaUrl: "/kontakt",
          },
          {
            id: uid("p"),
            name: "Firma",
            price: "od 99 €",
            period: "mesačne",
            features: ["Vlastná doména", "SSO", "Branded certifikát", "API"],
            ctaLabel: "Kontaktuj nás",
            ctaUrl: "/kontakt",
          },
        ],
      },
    ],
  },
  {
    id: "pg_faq",
    slug: "/faq",
    title: "Časté otázky — SubenAI",
    description: "Odpovede na najčastejšie otázky o testoch, certifikátoch a súkromí.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-04-10T10:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        heading: "Časté otázky",
        align: "center",
      },
      {
        id: uid("sec"),
        kind: "faq",
        enabled: true,
        faqs: [
          {
            id: uid("q"),
            question: "Je SubenAI naozaj zadarmo?",
            answer: "Áno. Všetky testy pre verejnosť sú a budú zadarmo. Platené sú len školské a firemné balíky.",
          },
          {
            id: uid("q"),
            question: "Potrebujem účet?",
            answer:
              "Nie. Test môžeš spustiť hneď. Účet ti dáva históriu výsledkov a možnosť vytvárať vlastné sady.",
          },
          {
            id: uid("q"),
            question: "Zbierate moje údaje?",
            answer:
              "Iba minimum potrebné na chod služby. Neposielame nič tretím stranám. Detaily v Ochrane osobných údajov.",
          },
          {
            id: uid("q"),
            question: "Dostanem certifikát?",
            answer: "Áno, po dokončení testu si môžeš stiahnuť PDF certifikát s tvojím skóre a dátumom.",
          },
        ],
      },
    ],
  },
  {
    id: "pg_kontakt",
    slug: "/kontakt",
    title: "Kontakt — SubenAI",
    description: "Napíšte nám, sme tu pre vás.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-02-20T11:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "hero",
        enabled: true,
        heading: "Napíšte nám",
        subheading: "Odpovedáme zvyčajne do 24 hodín.",
        align: "center",
      },
      {
        id: uid("sec"),
        kind: "contact_form",
        enabled: true,
        heading: "Kontaktný formulár",
        body: "hello@subenai.sk · +421 911 000 111",
      },
    ],
  },
  {
    id: "pg_privacy",
    slug: "/ochrana-osobnych-udajov",
    title: "Ochrana osobných údajov — SubenAI",
    description: "Ako spracúvame vaše osobné údaje v zmysle GDPR.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-01-15T09:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "rich_text",
        enabled: true,
        heading: "Ochrana osobných údajov",
        body:
          "Prevádzkovateľom služby SubenAI je SubenAI o.z., IČO 12345678. Spracúvame minimum údajov potrebných na poskytovanie služby v zmysle nariadenia GDPR (EÚ 2016/679). Máte právo na prístup, opravu, vymazanie a prenosnosť údajov. Žiadosť pošlite na privacy@subenai.sk — vybavíme do 30 dní.",
      },
    ],
  },
  {
    id: "pg_terms",
    slug: "/obchodne-podmienky",
    title: "Obchodné podmienky — SubenAI",
    description: "Pravidlá používania služby SubenAI.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-01-15T09:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "rich_text",
        enabled: true,
        heading: "Obchodné podmienky",
        body:
          "Tieto podmienky upravujú vzťah medzi prevádzkovateľom (SubenAI o.z.) a používateľom. Služba je poskytovaná „tak ako je“. Prevádzkovateľ nenesie zodpovednosť za rozhodnutia používateľa na základe výsledkov testov.",
      },
    ],
  },
  {
    id: "pg_cookies",
    slug: "/cookies",
    title: "Cookies — SubenAI",
    description: "Ako používame cookies a aké máte možnosti.",
    status: "published",
    showInSitemap: true,
    updatedAt: "2026-01-15T09:00:00Z",
    sections: [
      {
        id: uid("sec"),
        kind: "rich_text",
        enabled: true,
        heading: "Cookies",
        body:
          "Používame iba technické cookies potrebné na chod služby a anonymné analytické cookies (Plausible). Žiadne reklamné ani trackingové cookies tretích strán.",
      },
    ],
  },
];

export const seedMenu: MenuItem[] = [
  { id: "m1", label: "Testy", url: "/testy", location: "header", order: 1 },
  { id: "m2", label: "Ako to funguje", url: "/ako-to-funguje", location: "header", order: 2 },
  { id: "m3", label: "Blog", url: "/blog", location: "header", order: 3 },
  { id: "m4", label: "Cenník", url: "/cennik", location: "header", order: 4 },
  { id: "m5", label: "Podpora", url: "/podpora", location: "header", order: 5 },
  { id: "m6", label: "Kontakt", url: "/kontakt", location: "header", order: 6 },

  { id: "fp1", label: "Testy", url: "/testy", location: "footer_product", order: 1 },
  { id: "fp2", label: "Pre školy", url: "/cennik", location: "footer_product", order: 2 },
  { id: "fp3", label: "Pre firmy", url: "/cennik", location: "footer_product", order: 3 },
  { id: "fp4", label: "FAQ", url: "/faq", location: "footer_product", order: 4 },

  { id: "fc1", label: "O nás", url: "/o-nas", location: "footer_company", order: 1 },
  { id: "fc2", label: "Blog", url: "/blog", location: "footer_company", order: 2 },
  { id: "fc3", label: "Podporiť", url: "/podpora", location: "footer_company", order: 3 },
  { id: "fc4", label: "Kontakt", url: "/kontakt", location: "footer_company", order: 4 },

  { id: "fl1", label: "Ochrana osobných údajov", url: "/ochrana-osobnych-udajov", location: "footer_legal", order: 1 },
  { id: "fl2", label: "Obchodné podmienky", url: "/obchodne-podmienky", location: "footer_legal", order: 2 },
  { id: "fl3", label: "Cookies", url: "/cookies", location: "footer_legal", order: 3 },
];

export const seedHeader: HeaderConfig = {
  logoText: "SubenAI",
  showLogin: true,
  loginLabel: "Prihlásiť sa",
  loginUrl: "/prihlasenie",
  ctaLabel: "Spustiť test",
  ctaUrl: "/testy",
  sticky: true,
  announcementEnabled: true,
  announcement: "🎯 Nová vlna SMS „Slovenská pošta“ — pozri si rozbor v blogu.",
};

export const seedFooter: FooterConfig = {
  logoText: "SubenAI",
  tagline: "Otestuj sa, kým ťa otestuje podvodník.",
  copyright: "© 2026 SubenAI o.z. Všetky práva vyhradené.",
  contactEmail: "hello@subenai.sk",
  contactPhone: "+421 911 000 111",
  address: "Bratislava, Slovensko",
  newsletterEnabled: true,
  newsletterHeading: "Dostávaj upozornenia na nové podvody",
  socials: [
    { id: "s1", platform: "Facebook", url: "https://facebook.com/subenai" },
    { id: "s2", platform: "Instagram", url: "https://instagram.com/subenai" },
    { id: "s3", platform: "LinkedIn", url: "https://linkedin.com/company/subenai" },
    { id: "s4", platform: "YouTube", url: "https://youtube.com/@subenai" },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Tiny in-memory store with subscribe (no backend yet)
// ────────────────────────────────────────────────────────────────────────────

function makeStore<T>(initial: T) {
  let state = initial;
  const subs = new Set<() => void>();
  return {
    get: () => state,
    set: (next: T | ((prev: T) => T)) => {
      state = typeof next === "function" ? (next as (p: T) => T)(state) : next;
      subs.forEach((cb) => cb());
    },
    subscribe: (cb: () => void) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
  };
}

export const pagesStore = makeStore<Page[]>(seedPages);
export const menuStore = makeStore<MenuItem[]>(seedMenu);
export const headerStore = makeStore<HeaderConfig>(seedHeader);
export const footerStore = makeStore<FooterConfig>(seedFooter);

export const newId = (p = "id") => uid(p);

export const sectionKindLabels: Record<SectionKind, string> = {
  hero: "Hero",
  rich_text: "Text",
  features: "Karty / Vlastnosti",
  cta: "Výzva (CTA)",
  faq: "FAQ",
  stats: "Štatistiky",
  testimonials: "Referencie",
  gallery: "Galéria",
  image: "Obrázok",
  contact_form: "Kontaktný formulár",
  pricing: "Cenník",
};

export function blankSection(kind: SectionKind): Section {
  const base: Section = { id: newId("sec"), kind, enabled: true, background: "default", align: "left" };
  switch (kind) {
    case "hero":
      return { ...base, heading: "Nový hero", subheading: "Krátky popis…", ctaLabel: "Akcia", ctaUrl: "/" };
    case "features":
      return { ...base, heading: "Nová sekcia", columns: 3, features: [] };
    case "faq":
      return { ...base, heading: "Otázky", faqs: [] };
    case "stats":
      return { ...base, stats: [] };
    case "testimonials":
      return { ...base, testimonials: [] };
    case "gallery":
      return { ...base, gallery: [] };
    case "pricing":
      return { ...base, pricing: [] };
    case "cta":
      return { ...base, heading: "Pripravený?", ctaLabel: "Začať", ctaUrl: "/", align: "center" };
    case "image":
      return { ...base, imageUrl: "", imageAlt: "" };
    case "contact_form":
      return { ...base, heading: "Napíšte nám" };
    case "rich_text":
    default:
      return { ...base, body: "" };
  }
}
