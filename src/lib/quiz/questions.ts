// Question bank — 100 quality Slovak scam scenarios.
// Visual context is described as a structured `visual` prop and rendered
// by QuestionCard via screenshot components (SMS, Email, URL, IG, listing, call).

export type Category = "phishing" | "url" | "fake_vs_real" | "scenario" | "honeypot";
export type Difficulty = "easy" | "medium" | "hard";
export type Severity = "critical" | "medium" | "minor" | null;

export interface Option {
  id: string;
  label: string;
  correct: boolean;
  severity: Severity;
}

export type Visual =
  | { kind: "sms"; sender: string; body: string; link?: string; time?: string }
  | {
      kind: "email";
      from: string;
      fromEmail: string;
      subject: string;
      body: string;
      cta?: string;
    }
  | { kind: "url"; url: string; secure?: boolean }
  | {
      kind: "instagram";
      account: string;
      verified?: boolean;
      body: string;
      cta?: string;
      imageEmoji?: string;
      price?: string;
    }
  | {
      kind: "listing";
      site: string;
      title: string;
      price: string;
      location?: string;
      description: string;
      imageEmoji?: string;
    }
  | { kind: "call"; caller: string; number: string; hint?: string }
  | { kind: "text"; label: string; body: string };

export interface Question {
  id: string;
  category: Category;
  difficulty: Difficulty;
  prompt: string;
  visual?: Visual;
  options: Option[];
  explanation: string;
}

// Helpers for option construction
const ok = (id: string, label: string): Option => ({
  id,
  label,
  correct: true,
  severity: null,
});
const bad = (id: string, label: string, sev: Exclude<Severity, null>): Option => ({
  id,
  label,
  correct: false,
  severity: sev,
});

export const QUESTIONS: Question[] = [
  // ============ PHISHING — SMS (Slovenská pošta, kuriéri, banky) ============
  {
    id: "p-sms-posta-1",
    category: "phishing",
    difficulty: "easy",
    prompt: "Prišla ti táto SMS. Klikneš?",
    visual: {
      kind: "sms",
      sender: "InfoSMS",
      body: "Slovenská pošta: Vaša zásielka čaká. Doplaťte 1,99€ za doručenie:",
      link: "http://posta-sk.delivery-pay.com/track",
    },
    options: [
      bad("a", "Kliknem a zaplatím — len 2 eurá", "critical"),
      ok("b", "Ignorujem — Pošta neposiela linky"),
      bad("c", "Odpíšem na číslo a opýtam sa", "minor"),
    ],
    explanation:
      "Slovenská pošta neposiela platobné linky cez SMS. `delivery-pay.com` nie je oficiálna doména.",
  },
  {
    id: "p-sms-dpd-1",
    category: "phishing",
    difficulty: "easy",
    prompt: "DPD ti píše. Akcia?",
    visual: {
      kind: "sms",
      sender: "+421 902 555 121",
      body: "DPD: Balík nebolo možné doručiť, kuriér čaká na váš výber adresy:",
      link: "https://dpd-sk.parcel-redirect.info",
    },
    options: [
      bad("a", "Kliknem — chcem balík", "critical"),
      ok("b", "Skontrolujem stav v oficiálnej DPD appke / na dpd.sk"),
      bad("c", "Zavolám na to číslo", "medium"),
    ],
    explanation:
      "DPD má `dpd.sk`. Subdomény typu `parcel-redirect.info` sú phishing. Skontroluj balík priamo v appke.",
  },
  {
    id: "p-sms-tatra-1",
    category: "phishing",
    difficulty: "medium",
    prompt: 'SMS „od banky". Reaguješ?',
    visual: {
      kind: "sms",
      sender: "TatraBanka",
      body: "Zaznamenali sme prihlásenie z neznámeho zariadenia (Praha). Ak ste to neboli vy, overte tu:",
      link: "https://tatrabanka-secure.sk/overit",
    },
    options: [
      bad("a", "Kliknem — môj účet je v ohrození", "critical"),
      ok("b", "Otvorím Tatra banka appku ručne a pozriem aktivitu"),
      bad("c", "Odpíšem STOP", "medium"),
    ],
    explanation:
      "Tatra banka = `tatrabanka.sk`. `tatrabanka-secure.sk` je phishing klon. Vždy otvor appku manuálne.",
  },
  {
    id: "p-sms-slsp-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Sporiteľňa ti píše. Klik?",
    visual: {
      kind: "sms",
      sender: "SLSP-Info",
      body: "Vaša karta bola dočasne zablokovaná z dôvodu bezpečnosti. Odblokujte tu:",
      link: "https://slsp.sk-bezpecnost.online",
    },
    options: [
      bad("a", "Kliknem — potrebujem kartu", "critical"),
      ok("b", "Zavolám na číslo na zadnej strane karty"),
      bad("c", "Odpíšem ANO", "medium"),
    ],
    explanation:
      "Pravá doména je `slsp.sk`. To, čo je v URL pred prvou lomkou (zľava posledné 2 časti), tu znie `sk-bezpecnost.online` = scam.",
  },
  {
    id: "p-sms-csob-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "ČSOB ti píše o aktualizácii.",
    visual: {
      kind: "sms",
      sender: "CSOB",
      body: "Z dôvodu novej PSD2 regulácie aktualizujte vaše údaje do 24h, inak bude účet pozastavený:",
      link: "https://csob-update.eu/auth",
    },
    options: [
      bad("a", "Aktualizujem — kvôli regulácii", "critical"),
      ok("b", "Ignorujem — banka takto nikdy nepýta údaje"),
      bad("c", "Zatelefonujem na číslo z SMS", "medium"),
    ],
    explanation:
      "Naliehavosť + odkaz na reguláciu = klasický phishing trik. Žiadna banka takto nezbiera údaje.",
  },
  {
    id: "p-sms-2fa-1",
    category: "phishing",
    difficulty: "hard",
    prompt: "Práve si zadal heslo do net bankingu a prišla ti táto SMS. Klikneš na potvrdiť?",
    visual: {
      kind: "sms",
      sender: "TB SecureCode",
      body: "Potvrdte transakciu: 2 450€ → IBAN SK21 0900 0000 0050 1234 5678. Kód: 884213",
    },
    options: [
      bad("a", "Áno — práve som sa prihlasoval", "critical"),
      ok("b", "Nie — neposielal som žiadnu platbu"),
      bad("c", "Pre istotu zadám kód do appky", "critical"),
    ],
    explanation:
      "Toto je real-time phishing: scammer tvoje heslo už má a snaží sa cez teba potvrdiť svoju platbu. Vždy čítaj sumu a IBAN v SMS.",
  },
  {
    id: "p-sms-tax-1",
    category: "phishing",
    difficulty: "easy",
    prompt: "Daňový úrad ti vraj vracia preplatok.",
    visual: {
      kind: "sms",
      sender: "DanovyUrad",
      body: "Bol vám priznaný preplatok 287,50€. Pre vyplatenie zadajte údaje karty:",
      link: "https://financnasprava-vratky.sk",
    },
    options: [
      bad("a", "Zadám kartu — chcem peniaze", "critical"),
      ok("b", "Ignorujem — daniari neposielajú peniaze cez SMS link"),
    ],
    explanation:
      "Finančná správa nikdy nepýta údaje karty cez SMS. Preplatky idú na účet z daňového priznania.",
  },

  // ============ PHISHING — Email ============
  {
    id: "p-email-netflix-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Tento email — phishing alebo legit?",
    visual: {
      kind: "email",
      from: "Netflix Security",
      fromEmail: "security@netfl1x-account.com",
      subject: "Vaše predplatné bolo pozastavené",
      body: "Zistili sme problém s platbou. Aktualizujte fakturačné údaje do 24h, inak bude účet zrušený.",
      cta: "Aktualizovať teraz",
    },
    options: [
      bad("a", "Legit — kliknem aktualizovať", "critical"),
      ok("b", "Phishing — `netfl1x` má jednotku namiesto `i`"),
      bad("c", "Legit, ale prihlásim sa cez appku", "minor"),
    ],
    explanation:
      "`netfl1x-account.com` nie je doména Netflixu. Číslo namiesto písmena (`l` → `1`, `o` → `0`) je typický phishing trik.",
  },
  {
    id: "p-email-microsoft-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Microsoft hlási problém. Reakcia?",
    visual: {
      kind: "email",
      from: "Microsoft Account Team",
      fromEmail: "no-reply@microsoft-verify.com",
      subject: "Neobvyklá aktivita na vašom účte",
      body: "Zistili sme prihlásenie z Ruska. Ak to neboli vy, kliknite a zabezpečte účet.",
      cta: "Zabezpečiť účet",
    },
    options: [
      bad("a", "Kliknem — niekto sa hacká", "critical"),
      ok("b", "Otvorím account.microsoft.com ručne v prehliadači"),
      bad("c", "Pošlem to IT oddeleniu na kontrolu", "minor"),
    ],
    explanation:
      "Microsoft posiela z `@accountprotection.microsoft.com`, nie `@microsoft-verify.com`. Vždy otvor stránku ručne.",
  },
  {
    id: "p-email-apple-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Apple ti tvrdí, že si kúpil aplikáciu.",
    visual: {
      kind: "email",
      from: "Apple Support",
      fromEmail: "billing@apple-receipts.co",
      subject: "Faktúra: Final Cut Pro — 329,99€",
      body: "Ďakujeme za nákup. Ak ste neautorizovali túto transakciu, kliknite na zrušenie do 12 hodín.",
      cta: "Zrušiť transakciu",
    },
    options: [
      bad("a", "Kliknem — nič som nekupoval", "critical"),
      ok("b", "Skontrolujem nákupy v App Store / appleid.apple.com"),
    ],
    explanation:
      "Klasický fake receipt phishing. Šokuje ťa cena, panicky klikneš. Apple posiela z `@email.apple.com`.",
  },
  {
    id: "p-email-google-1",
    category: "phishing",
    difficulty: "hard",
    prompt: "Google Drive zdieľanie. Otvoríš?",
    visual: {
      kind: "email",
      from: "Peter Novák (cez Google Drive)",
      fromEmail: "drive-shares-noreply@google.com",
      subject: "Peter zdieľal s vami: Faktura_2024.pdf",
      body: "Peter Novák zdieľal s vami dokument. Otvorte ho a prihláste sa pre prístup.",
      cta: "Otvoriť dokument",
    },
    options: [
      bad("a", "Otvorím — pozná moju adresu", "medium"),
      ok("b", "Otvorím Drive ručne a pozriem zdieľané"),
      bad("c", "Pošlem mu odpoveď, kto je", "minor"),
    ],
    explanation:
      "Aj keď email môže byť pravý od Google, dokument vnútri vedie na fake login. Skontroluj v Drive ručne.",
  },
  {
    id: "p-email-job-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Ponuka práce na LinkedIn cez email.",
    visual: {
      kind: "email",
      from: "HR Recruiter",
      fromEmail: "recruiter@global-talent-hub.work",
      subject: "Pracovná ponuka 4500€ remote — pre vás",
      body: "Videli sme váš profil. Sme schopní vám ponúknuť pozíciu Marketing Assistant, plat 4500€/mesiac, plne remote. Pre štart pošlite kópiu OP a IBAN.",
    },
    options: [
      bad("a", "Pošlem — znie to skvele", "critical"),
      ok("b", "Ignorujem — pýtať OP+IBAN pred pohovorom = scam"),
      bad("c", "Pýtam sa najprv viac detailov", "minor"),
    ],
    explanation:
      "Žiadny seriózny zamestnávateľ nepýta IBAN a OP pred pohovorom. Toto je identity theft scam.",
  },
  {
    id: "p-email-bec-1",
    category: "phishing",
    difficulty: "hard",
    prompt: "Email od šéfky. Reaguješ?",
    visual: {
      kind: "email",
      from: "Jana Nováková",
      fromEmail: "jana.novakova@firma.sk",
      subject: "Rýchla pomoc",
      body: "Ahoj, som na meetingu, nemôžem volať. Potrebujem urgentne kúpiť 5 Apple gift kariet pre klienta. Pošli mi kódy SMS-kou. Nákup ti preplatíme zajtra.",
    },
    options: [
      bad("a", "Kúpim a pošlem kódy — je to šéfka", "critical"),
      ok("b", "Najprv jej zavolám/napíšem priamo"),
      bad("c", "Odpíšem na ten email", "medium"),
    ],
    explanation:
      "BEC scam (Business Email Compromise). Apple/Google gift karty = univerzálny scammer cash-out. Vždy overiť cez iný kanál.",
  },
  {
    id: "p-email-paypal-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "PayPal ti údajne posiela peniaze.",
    visual: {
      kind: "email",
      from: "PayPal",
      fromEmail: "service@paypa1-secure.com",
      subject: "Dostali ste 850 USD — potvrďte príjem",
      body: "Pre prijatie platby sa prihláste a potvrďte transakciu. Po 24h prepadne.",
      cta: "Prijať platbu",
    },
    options: [
      bad("a", "Prijmem — peniaze sú peniaze", "critical"),
      ok("b", "Ignorujem — `paypa1` je číslo, nie pravý PayPal"),
    ],
    explanation:
      'Pravá doména je `paypal.com`. Tu je `paypa1-secure.com` (jednotka). Email „dostali ste peniaze" je top phishing taktika.',
  },
  {
    id: "p-email-icloud-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "iCloud hlási, že máš plný úložný priestor.",
    visual: {
      kind: "email",
      from: "iCloud",
      fromEmail: "support@icloud-storage-help.com",
      subject: "Vaše úložisko je plné — fotky budú zmazané",
      body: "Aktualizujte plán pre zachovanie vašich fotografií. Akcia končí dnes.",
      cta: "Upgrade",
    },
    options: [
      bad("a", "Upgradnem — nechcem stratiť fotky", "critical"),
      ok("b", "Skontrolujem v Nastavenia > iCloud na telefóne"),
    ],
    explanation:
      "Apple posiela z `@email.apple.com`. Stav úložiska skontroluj priamo v nastaveniach zariadenia.",
  },

  // ============ URL — domény, podvrhy, IDN ============
  {
    id: "u-tatra-1",
    category: "url",
    difficulty: "easy",
    prompt: "Ktorá je pravá Tatra banka?",
    options: [
      ok("a", "tatrabanka.sk"),
      bad("b", "tatra-banka.sk", "critical"),
      bad("c", "tatrabanka.secure-login.sk", "critical"),
      bad("d", "tatrabanka.sk.login.com", "critical"),
    ],
    explanation:
      "Pravá doména je `tatrabanka.sk`. Pomlčky, slová ako `secure`/`login` a presunutá doména doprava sú typické phishing triky.",
  },
  {
    id: "u-slsp-bar-1",
    category: "url",
    difficulty: "medium",
    prompt: "Klikneš sa na túto URL. Prihlásiš?",
    visual: { kind: "url", url: "https://slsp-sk.online/auth/login" },
    options: [bad("a", "Áno", "critical"), ok("b", "Nie — pravý SLSP je `slsp.sk`")],
    explanation: "`slsp.sk` ≠ `slsp-sk.online`. Doména `.online` + pomlčka = phishing klon.",
  },
  {
    id: "u-google-bar-1",
    category: "url",
    difficulty: "hard",
    prompt: "Si na tejto adrese. Je to pravý Google?",
    visual: { kind: "url", url: "https://accounts.google.com.signin-verify.app" },
    options: [
      bad("a", "Áno — vidím `google.com`", "critical"),
      ok("b", "Nie — skutočná doména je `signin-verify.app`"),
    ],
    explanation:
      "Doménu čítaj sprava: posledné 2 časti pred prvou lomkou sú skutočná doména. Tu = `signin-verify.app`, nie Google.",
  },
  {
    id: "u-idn-1",
    category: "url",
    difficulty: "hard",
    prompt: "Pozri pozorne na URL.",
    visual: { kind: "url", url: "https://www.аpple.com/account" },
    options: [
      bad("a", "Pravý Apple", "critical"),
      ok("b", "Phishing — `а` je cyrilské, nie latinské `a`"),
    ],
    explanation:
      "IDN homograph útok: cyrilské `а` vyzerá ako latinské `a`, ale je to iná doména. Browsery niekedy varujú, niekedy nie.",
  },
  {
    id: "u-postaonline-1",
    category: "url",
    difficulty: "easy",
    prompt: "Pravá Slovenská pošta?",
    options: [
      ok("a", "posta.sk"),
      bad("b", "slovenskaposta-online.sk", "critical"),
      bad("c", "posta.sk-zasielky.com", "critical"),
    ],
    explanation: 'Slovenská pošta = `posta.sk`. Slová „online", „zasielky" v doméne = scam signál.',
  },
  {
    id: "u-csob-1",
    category: "url",
    difficulty: "easy",
    prompt: "Pravý ČSOB?",
    options: [
      ok("a", "csob.sk"),
      bad("b", "csob-banking.sk", "critical"),
      bad("c", "csob.secure.sk", "critical"),
    ],
    explanation: "ČSOB = `csob.sk`. Akékoľvek pridané slová pred `.sk` sú samostatné domény.",
  },
  {
    id: "u-shortlink-1",
    category: "url",
    difficulty: "medium",
    prompt: "V SMS prišiel skrátený link. Klikneš?",
    visual: { kind: "url", url: "https://bit.ly/3xQ7pK2" },
    options: [
      bad("a", "Áno — bit.ly je seriózny", "medium"),
      ok("b", "Nie — neviem, kam skutočne vedie"),
      bad("c", "Áno, ale len cez mobil", "medium"),
    ],
    explanation:
      "Skrátené odkazy v phishing SMS-kách sú červená vlajka. Ak musíš, použi `unshorten.it` na náhľad.",
  },
  {
    id: "u-typosquat-1",
    category: "url",
    difficulty: "medium",
    prompt: "Pravá Allegro?",
    options: [
      ok("a", "allegro.sk"),
      bad("b", "alegro.sk", "critical"),
      bad("c", "allegro-shop.sk", "critical"),
    ],
    explanation:
      "Typosquatting: `alegro` (jedno `l`). Scammeri si registrujú preklepy známych značiek.",
  },
  {
    id: "u-orange-1",
    category: "url",
    difficulty: "medium",
    prompt: "Klikol si v SMS. Prihlásiš sa?",
    visual: { kind: "url", url: "https://orange.sk.faktura-zaplatit.com" },
    options: [
      bad("a", "Áno — vidím orange.sk", "critical"),
      ok("b", "Nie — skutočná doména je `faktura-zaplatit.com`"),
    ],
    explanation: "`orange.sk` je tu len subdoména na cudzej doméne `faktura-zaplatit.com`.",
  },
  {
    id: "u-https-1",
    category: "url",
    difficulty: "medium",
    prompt: "Stránka má zelený zámok 🔒. Je teda bezpečná?",
    options: [
      bad("a", "Áno — HTTPS = bezpečné", "medium"),
      ok("b", "Nie — HTTPS znamená šifrované, nie že nie je phishing"),
    ],
    explanation:
      "Zámok hovorí len o šifrovaní spojenia. Aj phishingové stránky majú dnes HTTPS zadarmo (Let's Encrypt).",
  },
  {
    id: "u-suffix-1",
    category: "url",
    difficulty: "hard",
    prompt: "Ktorá je pravá Booking.com?",
    options: [
      ok("a", "booking.com"),
      bad("b", "booking.com.reservation-confirm.net", "critical"),
      bad("c", "secure-booking.com", "critical"),
      bad("d", "booking-com.support", "critical"),
    ],
    explanation:
      "Posledné 2 časti pred prvým `/` sú doména. `reservation-confirm.net`, `secure-booking.com`, `booking-com.support` sú samostatné domény.",
  },
  {
    id: "u-fb-1",
    category: "url",
    difficulty: "easy",
    prompt: "Pravý Facebook login?",
    options: [
      ok("a", "facebook.com"),
      bad("b", "facebook-login.com", "critical"),
      bad("c", "fb-secure.com", "critical"),
    ],
    explanation: "Facebook = `facebook.com` (alebo `fb.com`). Iné varianty = phishing.",
  },

  // ============ FAKE vs REAL — eshopy, inzeráty, IG reklamy ============
  {
    id: "f-bazos-iphone-1",
    category: "fake_vs_real",
    difficulty: "easy",
    prompt: "Inzerát na Bazoši — kúpiš?",
    visual: {
      kind: "listing",
      site: "Bazos",
      title: "iPhone 15 Pro Max 256GB",
      price: "299 €",
      location: "Košice",
      description:
        "Úplne nový, neotvorená krabica. Predávam kvôli darčeku, ktorý sa nehodil. Posielam poštou po platbe vopred na účet.",
      imageEmoji: "📱",
    },
    options: [
      bad("a", "Kúpim — výhodná cena", "critical"),
      ok("b", "Scam — cena príliš nízka + platba vopred"),
      bad("c", "Pýtam si viac fotiek a kúpim", "medium"),
    ],
    explanation:
      'iPhone 15 Pro Max za 299€ + platba vopred + „darček, čo sa nehodil" = klasický eshop scam.',
  },
  {
    id: "f-bazar-auto-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt: "Inzerát na auto. Pôjdeš sa pozrieť?",
    visual: {
      kind: "listing",
      site: "Bazar",
      title: "BMW 320d 2019, 45000 km",
      price: "4 800 €",
      location: "Holandsko (privezem na SK)",
      description:
        "Auto je momentálne v Holandsku. Pošlem fotky, môžeme dohodnúť dovoz. Záloha 500€ cez Western Union pre rezerváciu.",
      imageEmoji: "🚗",
    },
    options: [
      bad("a", "Pošlem zálohu — auto je super", "critical"),
      ok("b", "Scam — Western Union + auto v zahraničí = klasika"),
      bad("c", "Najprv si vypýtam VIN", "medium"),
    ],
    explanation:
      '„Auto v zahraničí + záloha cez WU/MoneyGram" je 20 rokov starý scam pattern. Auto neexistuje.',
  },
  {
    id: "f-eshop-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt: "Eshop s -80% akciami na značky (Nike, Gucci). Cena Air Jordan 39€. Reálne?",
    options: [
      bad("a", "Áno — možno výpredaj", "critical"),
      ok("b", "Fake eshop — buď ti nepríde nič, alebo čínska kópia"),
      bad("c", "Možno sivý dovoz, kúpim", "medium"),
    ],
    explanation:
      "Značkové veci za 80% zľavu = buď fake eshop (nedoručia), alebo replika z Číny. Skontroluj recenzie a registráciu firmy.",
  },
  {
    id: "f-ig-influencer-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt: "Reklama na IG s tvárou známej slovenskej moderátorky. Kúpiš kapsuly?",
    visual: {
      kind: "instagram",
      account: "zdravie_premium_sk",
      verified: false,
      body: '„Schudla som 14 kg za 21 dní! Lekári ma chcú zažalovať. Limitovaná akcia -70% iba dnes."',
      imageEmoji: "💊",
      cta: "Zistiť viac",
    },
    options: [
      bad("a", "Kúpim — odporúča to ona", "critical"),
      ok("b", "Scam — tvár je ukradnutá, kapsuly sú placebo/škodlivé"),
      bad("c", "Skontrolujem na jej profile", "minor"),
    ],
    explanation:
      'Tváre celebrít sa kradnú do fake reklám. „Lekári to nenávidia" + „len dnes" = scam DNA. Účet bez verified značky.',
  },
  {
    id: "f-ig-crypto-1",
    category: "fake_vs_real",
    difficulty: "hard",
    prompt: "Elon Musk live stream rozdáva Bitcoin. Pošleš 0,1 BTC, dostaneš späť 0,2 BTC. Reálne?",
    options: [
      bad("a", "Skúsim s malou sumou", "critical"),
      ok("b", "Scam — ide o deepfake / staré video"),
      bad("c", "Áno ak ide o oficiálny live", "critical"),
    ],
    explanation:
      "Crypto giveaway scam beží na YouTube non-stop. Nikto ti nepošle 2× späť. Stratíš všetko.",
  },
  {
    id: "f-romance-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      "Mesiac chatuješ s krásnou doktorkou v Sýrii. Prosí o 800€ na lietadlo, vráti to. Pošleš?",
    options: [
      bad("a", "Áno — milujem ju", "critical"),
      ok("b", "Romance scam — nikdy ju nestretneš"),
      bad("c", "Pošlem 200€ ako test", "critical"),
    ],
    explanation:
      "Romance scam: kradnuté fotky, vymyslený príbeh, prosba o peniaze na cestu/colné poplatky. Vždy scam.",
  },
  {
    id: "f-fbgroup-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt: "V FB skupine niekto predáva lístky na koncert pod cenu. Pošleš peniaze cez Revolut?",
    options: [
      bad("a", "Áno — zľava je zľava", "critical"),
      ok("b", "Nie — kupujem len cez oficiálny resale (Ticketportal/Predpredaj)"),
      bad("c", "Pošlem polovicu, druhú po doručení", "medium"),
    ],
    explanation:
      "FB skupiny sú plné scammerov s fake screenshotmi. Lístky kupuj len cez oficiálne resale platformy.",
  },
  {
    id: "f-investicia-1",
    category: "fake_vs_real",
    difficulty: "hard",
    prompt:
      'Reklama: „Investícia 250€ → 18 000€ za 3 mesiace cez AI obchodovanie. Garantujeme." Skúsiš?',
    options: [
      bad("a", "Skúsim s 250€", "critical"),
      ok("b", "Scam — žiadna garantovaná investícia neexistuje"),
      bad("c", "Skúsim, ale len cez Revolut", "critical"),
    ],
    explanation:
      'Investičný scam (často cez `Bitcoin Trader`, `Quantum AI`). Po vklade ti volá „broker", chce viac, potom zmizne.',
  },
  {
    id: "f-marketplace-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt: 'Na FB Marketplace ti predajca pošle „doručovací link" na overenie adresy. Klikneš?',
    options: [
      bad("a", "Kliknem — chcem produkt", "critical"),
      ok("b", "Nie — Marketplace nemá takúto funkciu"),
    ],
    explanation:
      'FB Marketplace nemá interný „doručovací overovací link". Kliknutie vedie na fake login, ukradne ti účet.',
  },
  {
    id: "f-recenzie-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      'Eshop má 4,9★ z 2000 recenzií, ale všetky sú z posledných 3 týždňov a generické („Super produkt!"). Kúpiš?',
    options: [
      bad("a", "Áno — recenzie sú dobré", "medium"),
      ok("b", "Nie — fake recenzie nakúpené"),
      bad("c", "Kúpim na dobierku", "minor"),
    ],
    explanation:
      "Fake recenzie sa dajú nakúpiť. Hľadaj rozloženie v čase, detaily, fotky. Pozor na generické 5★ záplavy.",
  },

  // ============ SCENARIO — telefón, QR, fyzické ============
  {
    id: "s-vishing-1",
    category: "scenario",
    difficulty: "medium",
    prompt: "Volá ti niekto z banky o podozrivej transakcii a pýta kód z SMS.",
    visual: {
      kind: "call",
      caller: "Tatra Banka — Bezpečnosť",
      number: "+421 2 5919 1000",
      hint: "Zobrazené ako overené v kontaktoch",
    },
    options: [
      bad("a", "Nadiktujem kód — banka volá", "critical"),
      ok("b", "Zavesím a zavolám sama na číslo z karty"),
      bad("c", "Pýtam overujúce otázky", "medium"),
    ],
    explanation:
      "Banka NIKDY nepýta kód z SMS. Číslo aj meno volajúceho sa dajú sfalšovať (caller-ID spoofing).",
  },
  {
    id: "s-quishing-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      'Na parkovacom automate visí nálepka s QR kódom „Zaplatiť rýchlo cez QR". Tvoja appka nefunguje. Naskenuješ?',
    options: [
      bad("a", "Áno — naskenujem a zaplatím", "critical"),
      ok("b", "Nie — zaplatím cez SMS na čísle automatu"),
      bad("c", "Naskenujem, skontrolujem URL", "medium"),
    ],
    explanation:
      "Quishing: scammeri lepia fake QR cez originál. Vždy použi oficiálnu appku alebo SMS na čísle, ktoré je vyrazené v automate.",
  },
  {
    id: "s-microsoft-call-1",
    category: "scenario",
    difficulty: "easy",
    prompt: 'Volá ti niekto s indickým prízvukom: „Som z Microsoftu, váš počítač je infikovaný."',
    options: [
      bad("a", "Spolupracujem, dám mu vzdialený prístup", "critical"),
      ok("b", "Zaveseím a zablokujem číslo"),
      bad("c", "Pýtam sa detaily", "medium"),
    ],
    explanation:
      "Microsoft NIKDY nevolá zákazníkom. Klasický tech support scam — dá si ti AnyDesk, ukradne všetko.",
  },
  {
    id: "s-policia-call-1",
    category: "scenario",
    difficulty: "medium",
    prompt: 'Volá „policajt": „Vaše konto bolo napadnuté, presuňte peniaze na bezpečný účet."',
    options: [
      bad("a", "Presuniem — ide o moje peniaze", "critical"),
      ok("b", "Zložím a zavolám 158 sám"),
    ],
    explanation:
      'Polícia NIKDY nepýta presun peňazí na „bezpečný účet". Tento scam zruinoval mnoho slovenských dôchodcov.',
  },
  {
    id: "s-rodina-1",
    category: "scenario",
    difficulty: "medium",
    prompt:
      'WhatsApp od „dcéry" z neznámeho čísla: „Mami, stratila som telefón, potrebujem urgentne 500€ na nový. Pošli na tento účet."',
    options: [
      bad("a", "Pošlem — je to dcéra", "critical"),
      ok("b", "Zavolám dcére na pôvodné číslo a overím"),
      bad("c", "Odpíšem a pýtam detaily", "medium"),
    ],
    explanation:
      '„Hi mum scam" je v UK/SK epidémia. Vždy zavolaj na pôvodné číslo. Scammer ti nezdvihne.',
  },
  {
    id: "s-wifi-1",
    category: "scenario",
    difficulty: "medium",
    prompt: "Na letisku vidíš otvorené WiFi „Free_Airport_WiFi“. Pripojíš a zaloguješ sa do banky?",
    options: [
      bad("a", "Áno — internet zadarmo", "critical"),
      ok("b", "Pripojím cez VPN, alebo radšej mobilné dáta"),
      bad("c", "Pripojím, ale len na čítanie news", "minor"),
    ],
    explanation:
      'Otvorené WiFi môže byť „evil twin" — útočník medzi tebou a internetom. Banka cez verejné WiFi NIE.',
  },
  {
    id: "s-usb-1",
    category: "scenario",
    difficulty: "medium",
    prompt: 'Na parkovisku pred firmou nájdeš USB kľúč s nápisom „Mzdy 2024". Strčíš ho do PC?',
    options: [
      bad("a", "Strčím — som zvedavý", "critical"),
      ok("b", "Odovzdám IT bez pripojenia"),
      bad("c", "Strčím do svojho súkromného PC", "critical"),
    ],
    explanation:
      "USB drop attack — kľúč obsahuje malware, ktorý sa spustí pri pripojení. IT firmy ich rozhadzujú aj na test zamestnancov.",
  },
  {
    id: "s-verify-call-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      'Volá ti človek, predstaví sa ako pracovník banky. Pre overenie ti vraví: „Pošlem SMS s kódom, prečítate mi ho."',
    options: [
      bad("a", "Prečítam — overuje moju identitu", "critical"),
      ok("b", "Odmietnem a zavolám na banku"),
      bad("c", "Prečítam len posledné 3 čísla", "critical"),
    ],
    explanation:
      "Banka sa nikdy neoveruje cez to, že ty čítaš jej SMS kód. Naopak — kód je pre teba, aby si potvrdil/odmietol.",
  },
  {
    id: "s-redirect-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      "Doma sa ti zariadenia odpojili od WiFi a router pýta nové prihlasovacie údaje cez stránku v prehliadači. Zadáš ich?",
    options: [
      bad("a", "Zadám — chcem internet", "medium"),
      ok("b", "Reštartujem router fyzicky a skontrolujem nastavenia priamo cez 192.168.x.x"),
    ],
    explanation:
      "DNS hijack útok presmeruje prehliadač na fake login. Vždy choď do admin GUI routra zadaním IP, nie cez automatic redirect.",
  },
  {
    id: "s-charita-1",
    category: "scenario",
    difficulty: "medium",
    prompt:
      'Pri obchode ťa zastaví človek so zoznamom „pomáhame deťom". Pýta IBAN aj kópiu OP na potvrdenie.',
    options: [
      bad("a", "Dám — pomáham", "critical"),
      ok("b", "Pošlem cez overenú nadáciu (Dobrý anjel, Plamienok…) online"),
    ],
    explanation:
      "Žiadna seriózna charita nepýta IBAN ani kópiu OP na ulici. Identity theft scenár.",
  },
  {
    id: "s-sim-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      "Telefón ti zrazu stratil signál uprostred dňa. Po hodine ti chodia notifikácie z banky o platbách.",
    options: [
      bad("a", "Počkám, či sa signál vráti", "critical"),
      ok("b", "Okamžite zavolám operátora a banku z iného telefónu"),
    ],
    explanation:
      "SIM swap útok — útočník dal preniesť tvoje číslo na svoju SIM, dostáva 2FA kódy. Reaguj okamžite.",
  },

  // ============ HONEYPOT — confidence destroyers / klasiky ============
  {
    id: "h-prince-1",
    category: "honeypot",
    difficulty: "easy",
    prompt: "Email od nigerijského princa, ktorý ti pošle 10 mil. USD za poplatok 200€. Akcia?",
    options: [
      bad("a", "Pošlem 200€", "critical"),
      bad("b", "Odpíšem — môže byť legit", "medium"),
      ok("c", "Zmažem — 419 scam"),
    ],
    explanation: "419 scam (princ z Nigérie) je učebnicový podvod. Nigéria neexportuje princov.",
  },
  {
    id: "h-vyhra-1",
    category: "honeypot",
    difficulty: "easy",
    prompt: 'SMS: „Vyhrali ste iPhone 16! Pre prevzatie zaplaťte poštovné 4€." Reakcia?',
    visual: {
      kind: "sms",
      sender: "AKCIA",
      body: "Gratulujeme, vyhrali ste iPhone 16 Pro! Pre prevzatie zaplaťte 4€ za poštovné:",
      link: "https://vyhra-iphone.live",
    },
    options: [bad("a", "Zaplatím 4€", "critical"), ok("b", "Ignorujem — žiadnu súťaž som nehral")],
    explanation:
      '„Vyhrali ste" v súťaži, do ktorej si sa neprihlásil = scam. Po 4€ poplatku ti vezmú celú kartu.',
  },
  {
    id: "h-instagram-hack-1",
    category: "honeypot",
    difficulty: "easy",
    prompt:
      'Kamoška ti na Insta píše: „Hlasuj za mňa v súťaži, klikni link a prihlás sa cez Insta." Klikneš?',
    options: [
      bad("a", "Áno — pomôžem kamoške", "critical"),
      ok("b", "Najprv jej zavolám — pravdepodobne má hacknutý účet"),
    ],
    explanation:
      "Toto je #1 spôsob, ako sa kradnú IG účty na Slovensku. Klik vedie na fake login, ukradne ti účet, scammer pokračuje na tvojich kontaktoch.",
  },
  {
    id: "h-revolut-1",
    category: "honeypot",
    difficulty: "easy",
    prompt:
      'Na Bazoši kupec povie: „Pošlem ti 500€ cez Revolut, ale potrebujem tvoje heslo na overenie účtu."',
    options: [
      bad("a", "Pošlem heslo — chcem peniaze", "critical"),
      ok("b", "Nepošlem — Revolut žiadne heslo nepotrebuje"),
    ],
    explanation: "Žiadny prevod nepotrebuje heslo príjemcu. Heslo nikdy nikomu.",
  },
  {
    id: "h-google-pay-1",
    category: "honeypot",
    difficulty: "medium",
    prompt:
      "Niekto ti tvrdí, že ti omylom poslal 200€ a prosí, aby si mu poslal naspäť. Účet zatiaľ neukazuje vklad. Pošleš?",
    options: [
      bad("a", "Áno — slušné by bolo vrátiť", "critical"),
      ok("b", "Nie — počkám, kým peniaze reálne prídu (aj 24h)"),
    ],
    explanation:
      'Klasický scam: pošle ti screenshot „prevodu", ty mu pošleš peniaze, jeho prevod sa nikdy nezrealizuje.',
  },

  // ============ Doplnenie pre 100 — variácie ============
  {
    id: "p-sms-bazos-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Predávaš na Bazoši. Záujemca napíše:",
    visual: {
      kind: "sms",
      sender: "+44 7700 900123",
      body: "Mám záujem o váš inzerát. Pre dokončenie kúpy potvrdte adresu doručenia tu:",
      link: "https://bazos-secure-payment.com/confirm",
    },
    options: [
      bad("a", "Potvrdím — chcem predať", "critical"),
      ok("b", "Ignorujem — Bazoš nemá žiaden takýto systém"),
    ],
    explanation:
      'Tzv. „Bazoš scam": kupec nikdy nemá účet, posiela fake link na zber údajov. Vždy komunikácia cez Bazoš správy.',
  },
  {
    id: "p-email-airbnb-1",
    category: "phishing",
    difficulty: "hard",
    prompt: 'Hosť ti na Airbnb napíše a pošle „mimo platformy" lacnejšiu zľavu cez email.',
    visual: {
      kind: "email",
      from: "Marko",
      fromEmail: "marko.airbnb@gmail.com",
      subject: "Lepšia ponuka — bez poplatkov platformy",
      body: "Ahoj, chcel by som rezervovať priamo, ušetríme 15% na poplatkoch. Pošlem zálohu na tvoj IBAN.",
    },
    options: [
      bad("a", "Súhlasím — ušetríme obaja", "critical"),
      ok("b", "Odmietnem — komunikácia mimo Airbnb stráca ochranu"),
    ],
    explanation:
      "Off-platform scams ti vezmú Airbnb garantie. Buď to kupec scammer alebo hostiteľ. Vždy cez platformu.",
  },
  {
    id: "u-paypal-1",
    category: "url",
    difficulty: "medium",
    prompt: "Pravý PayPal?",
    options: [
      ok("a", "paypal.com"),
      bad("b", "paypal-secure.com", "critical"),
      bad("c", "paypaI.com (s veľkým I)", "critical"),
    ],
    explanation: "Pravý PayPal = `paypal.com`. Veľké `I` namiesto malého `l` je IDN trik.",
  },
  {
    id: "u-amazon-1",
    category: "url",
    difficulty: "easy",
    prompt: "Pravý Amazon?",
    options: [
      ok("a", "amazon.de"),
      bad("b", "amaz0n.de", "critical"),
      bad("c", "amazon-eu.de", "critical"),
    ],
    explanation: "`amazon.de` (alebo .com). Číslo `0` namiesto `o` = scam.",
  },
  {
    id: "f-temu-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt: 'Reklama: „Roztoč koleso na Temu, vyhraj 1500€!". Klikneš a prihlásiš sa?',
    options: [
      bad("a", "Áno — chcem 1500€", "critical"),
      ok("b", "Ignorujem — buď fake landing alebo dark pattern"),
    ],
    explanation:
      "Fake giveaway pages zbierajú údaje a kartu. Aj reálne značky sú zneužívané v fake reklamách.",
  },
  {
    id: "s-energie-1",
    category: "scenario",
    difficulty: "medium",
    prompt: 'Pri dverách stojí „pracovník SPP" a žiada vidieť faktúru aj OP, lebo „máš preplatok".',
    options: [
      bad("a", "Ukážem — preplatok je super", "critical"),
      ok("b", "Pýtam si preukaz a zavolám priamo na SPP linku"),
    ],
    explanation: "Door-to-door scam: vyfotia OP a faktúru, prepíšu zmluvu, alebo ukradnú identitu.",
  },
  {
    id: "p-sms-balik-1",
    category: "phishing",
    difficulty: "easy",
    prompt: "Balík sa nedoručil.",
    visual: {
      kind: "sms",
      sender: "Packeta",
      body: "Vaša zásielka je pripravená v Packeta boxe. Pre vyzdvihnutie sa overte:",
      link: "https://packeta-box.online/pickup",
    },
    options: [
      bad("a", "Overím sa — chcem balík", "critical"),
      ok("b", "Skontrolujem stav v Packeta appke"),
    ],
    explanation: "Packeta = `packeta.sk`. `.online` doména = scam.",
  },
  {
    id: "p-sms-o2-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "O2 ti hlási nedoplatok.",
    visual: {
      kind: "sms",
      sender: "O2 SK",
      body: "Vážený zákazník, evidujeme nedoplatok 27,40€. Uhraďte do 24h, inak vypneme číslo:",
      link: "https://o2-sk.faktury-online.com",
    },
    options: [
      bad("a", "Uhradím — nechcem stratiť číslo", "critical"),
      ok("b", "Skontrolujem v Moje O2 appke"),
    ],
    explanation: "O2 má `o2.sk`. Vyhrážanie vypnutím + cudzia doména = scam.",
  },
  {
    id: "u-instagram-1",
    category: "url",
    difficulty: "medium",
    prompt: "Pravý Instagram login?",
    options: [
      ok("a", "instagram.com"),
      bad("b", "instagram.com-login.help", "critical"),
      bad("c", "ig-secure.com", "critical"),
    ],
    explanation: "Instagram = `instagram.com`. Vždy posledné 2 časti pred prvým `/`.",
  },
  {
    id: "f-bazos-2",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt: 'Predávaš PS5. Kupec píše „Pošlem peniaze cez DPD COD na tvoju adresu."',
    options: [
      bad("a", "Pošlem mu adresu — peniaze cez kuriéra", "critical"),
      ok("b", "Odmietnem — kuriér peniaze neprenáša, je to scam"),
    ],
    explanation: "Kuriéri neprenášajú hotovosť kupca predajcovi. Scammer chce len adresu/identitu.",
  },
  {
    id: "h-popup-1",
    category: "honeypot",
    difficulty: "easy",
    prompt:
      'Pri surfovaní vyskočí: „Váš počítač má 5 vírusov! Stiahnite Antivirus Pro hneď." Akcia?',
    options: [
      bad("a", "Stiahnem — vírusy sú zlé", "critical"),
      ok("b", "Zavriem zatlačením Esc / zatvorením tabu"),
    ],
    explanation:
      "Scareware: vyskočí v každom prehliadači, lebo je to len obrázok stránky. Stiahnutie = malware.",
  },
  {
    id: "p-email-faktura-1",
    category: "phishing",
    difficulty: "hard",
    prompt: 'Faktúra .docm/.zip príloha od „dodávateľa".',
    visual: {
      kind: "email",
      from: "Účtáreň",
      fromEmail: "ucto@dodavatel-faktura.eu",
      subject: "Faktúra č. 2024-9931 — splatnosť 7 dní",
      body: "V prílohe zasielame faktúru za služby. Pre zobrazenie povoľte makrá.",
    },
    options: [
      bad("a", "Otvorím a povolím makrá", "critical"),
      ok("b", "Neotváram — neznámy odosielateľ + makrá = malware"),
    ],
    explanation:
      "Office makrá v dokumentoch z neznámych zdrojov sú #1 vstupný vektor pre ransomware (Emotet, QakBot).",
  },
  {
    id: "s-deepfake-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      "Šéf ti zavolá cez WhatsApp video — vidíš jeho tvár, ale obraz pixeluje. Žiada urgentný prevod 18 000€.",
    options: [
      bad("a", "Pošlem — vidím šéfa", "critical"),
      ok("b", "Overím cez druhý kanál (osobne / firemný telefón)"),
    ],
    explanation:
      "Deepfake video calls sú reálna 2024+ hrozba. CEO fraud cez deepfake už ukradol milióny. Vždy 2-channel verifikácia.",
  },
  {
    id: "f-jobscam-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      'Inzerát: „Pracuj z domu, 80€/deň, len kopírovať texty. Začni dnes, registračný poplatok 49€."',
    options: [
      bad("a", "Zaregistrujem sa za 49€", "critical"),
      ok("b", "Ignorujem — práca, kde platíš ty, nie je práca"),
    ],
    explanation:
      "Job scam: registračný poplatok = scam DNA. Žiadny zamestnávateľ od teba nepýta peniaze.",
  },
  {
    id: "p-sms-vodafone-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Telekom ti vraj posiela bonus.",
    visual: {
      kind: "sms",
      sender: "TELEKOM",
      body: "Bonus 50€ za vernosť! Vyzdvihnite si ho do 48h:",
      link: "https://telekom.bonus-vernost.sk",
    },
    options: [
      bad("a", "Vyzdvihnem — 50€ je 50€", "critical"),
      ok("b", "Skontrolujem v Telekom appke"),
    ],
    explanation:
      "Telekom = `telekom.sk`. `bonus-vernost.sk` je samostatná doména. Bonusy sa nezdvíhajú cez SMS link.",
  },
  {
    id: "u-google-2",
    category: "url",
    difficulty: "medium",
    prompt: "Pravý Google login?",
    options: [
      ok("a", "accounts.google.com"),
      bad("b", "accounts-google.com", "critical"),
      bad("c", "google.com-signin.net", "critical"),
    ],
    explanation:
      "Pomlčka medzi `google` a `com` zmenila doménu. Pravá je `accounts.google.com` (`google.com` bez pomlčky).",
  },
  {
    id: "f-bookingmsg-1",
    category: "fake_vs_real",
    difficulty: "hard",
    prompt:
      'Po rezervácii na Booking ti hostiteľ pošle správu cez Booking chat: „Karta vám neprešla, dokončite cez tento link." Klikneš?',
    options: [
      bad("a", "Kliknem — chcem si zachovať rezerváciu", "critical"),
      ok("b", "Skontrolujem v Booking appke a kontaktujem support"),
    ],
    explanation:
      "Reálny scam 2023-2024: ubytovatelia majú hacknuté Booking účty, posielajú phishing v ich mene. Booking nikdy nepýta dáta cez chat link.",
  },
  {
    id: "s-cookie-1",
    category: "scenario",
    difficulty: "easy",
    prompt: 'Stránka chce nainštalovať „bezpečnostný certifikát" pre prístup. Akcia?',
    options: [
      bad("a", "Nainštalujem — chcem na stránku", "critical"),
      ok("b", "Zavriem — žiadna stránka takto nepýta certifikát"),
    ],
    explanation:
      "Stránky neinštalujú certifikáty. Toto je sociálne inžinierstvo na inštaláciu malvéru.",
  },
  {
    id: "h-poslednavola-1",
    category: "honeypot",
    difficulty: "easy",
    prompt:
      'Email: „Vaše dedičstvo 1,2 mil. EUR po anglickom tete čaká. Pošlite OP a 350€ na notárske poplatky."',
    options: [
      bad("a", "Pošlem — nevedel som o tete", "critical"),
      ok("b", "Zmažem — inheritance scam"),
    ],
    explanation:
      "Inheritance scam — variant nigerijského princa. Ak nemáš anglickú tetu, nemáš ani dedičstvo.",
  },
  {
    id: "p-email-banka-2fa-1",
    category: "phishing",
    difficulty: "hard",
    prompt: 'Banka ti posiela link na „aktiváciu nového bezpečnostného systému".',
    visual: {
      kind: "email",
      from: "VÚB Banka",
      fromEmail: "security@vub-online.sk",
      subject: "Povinná aktivácia 3D Secure 2.0",
      body: "Od 1. mája musia všetci klienti aktivovať nový bezpečnostný systém. Inak nebudete môcť platiť kartou online.",
      cta: "Aktivovať",
    },
    options: [
      bad("a", "Aktivujem — chcem platiť", "critical"),
      ok("b", "Skontrolujem oznam v appke / na vub.sk priamo"),
    ],
    explanation:
      "VÚB = `vub.sk`. `vub-online.sk` = klon. Bankové novinky overuj v appke alebo na pravej stránke.",
  },
  {
    id: "f-charity-fake-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      'Po katastrofe vidíš na FB výzvu „Pomôžte rodine X, IBAN: SK…" so srdcervúcou fotkou. Pošleš?',
    options: [
      bad("a", "Pošlem — chcem pomôcť", "critical"),
      ok("b", "Pošlem cez overenú zbierku (ľudialudom, donio)"),
    ],
    explanation:
      "Po katastrofách vznikajú fake zbierky s ukradnutými fotkami. Daruj cez overené platformy.",
  },
  {
    id: "u-banka-3-1",
    category: "url",
    difficulty: "medium",
    prompt: "Pravá VÚB?",
    options: [
      ok("a", "vub.sk"),
      bad("b", "vub-banking.sk", "critical"),
      bad("c", "vubbanka.sk", "critical"),
    ],
    explanation: "VÚB = `vub.sk`. `vubbanka.sk` znie podobne, ale je to iná doména.",
  },
  {
    id: "p-sms-revolut-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Revolut ti tvrdí, že máš pozastavený účet.",
    visual: {
      kind: "sms",
      sender: "Revolut",
      body: "Váš účet bol dočasne pozastavený. Pre obnovenie potvrďte identitu:",
      link: "https://revolut-verify.app",
    },
    options: [
      bad("a", "Potvrdím — chcem účet späť", "critical"),
      ok("b", "Otvorím Revolut appku — tam vidím všetky správy"),
    ],
    explanation:
      "Revolut komunikuje cez in-app správy alebo `revolut.com`. `.app` doména s pomlčkou = scam.",
  },
  {
    id: "s-anydesk-1",
    category: "scenario",
    difficulty: "medium",
    prompt: 'Banka ti zavolá: „Pre vyriešenie problému si stiahnite AnyDesk a dajte nám kód."',
    options: [
      bad("a", "Stiahnem — vyriešia problém", "critical"),
      ok("b", "Odmietnem — banka nikdy nepotrebuje vzdialený prístup"),
    ],
    explanation: "AnyDesk/TeamViewer scam: po pripojení ti scammer ukradne všetko z účtu.",
  },
  {
    id: "f-mr-beast-1",
    category: "fake_vs_real",
    difficulty: "easy",
    prompt: 'Insta reklama: „MrBeast rozdáva 1000$ prvým 100 ľudom! Stačí kliknúť."',
    options: [
      bad("a", "Kliknem — som rýchly", "critical"),
      ok("b", "Ignorujem — celebrity giveaway scam"),
    ],
    explanation:
      "Celebrity giveaway scam (MrBeast, Musk, Bezos…) je všade. Žiadny prevod ti neprde.",
  },
  {
    id: "h-extortion-1",
    category: "honeypot",
    difficulty: "medium",
    prompt:
      'Email: „Mám video, ako pozeráš porno. Pošli 800$ v Bitcoine, inak to pošlem všetkým kontaktom."',
    options: [
      bad("a", "Zaplatím — nechcem hanbu", "critical"),
      ok("b", "Zmažem — sextortion scam, žiadne video nemá"),
    ],
    explanation:
      'Sextortion scam: rozosiela sa miliónom ľudí, žiadne video neexistuje. Heslo „má" z dávneho leaku.',
  },
  {
    id: "u-eshop-1",
    category: "url",
    difficulty: "hard",
    prompt: "Pravý Alza?",
    options: [
      ok("a", "alza.sk"),
      bad("b", "alza-eshop.sk", "critical"),
      bad("c", "alza.sk.deal-zone.com", "critical"),
      bad("d", "a1za.sk", "critical"),
    ],
    explanation: "Alza = `alza.sk`. Pomlčky, sufixy, čísla namiesto písmen = phishing.",
  },
  {
    id: "p-email-linkedin-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "LinkedIn ti hlási nové prepojenie.",
    visual: {
      kind: "email",
      from: "LinkedIn",
      fromEmail: "no-reply@linkedin-jobs.career",
      subject: "Máte 3 nové ponuky práce — kliknite",
      body: "Headhunteri vás hľadajú. Aktivujte profil pre zobrazenie ponúk.",
      cta: "Zobraziť ponuky",
    },
    options: [bad("a", "Kliknem — práca láka", "critical"), ok("b", "Otvorím linkedin.com ručne")],
    explanation: "LinkedIn = `linkedin.com`. `.career` doména je samostatná, scam phishing.",
  },
  {
    id: "s-fake-update-1",
    category: "scenario",
    difficulty: "medium",
    prompt: 'Pri surfovaní vyskočí: „Váš Chrome je zastaralý. Stiahnite update.exe."',
    options: [
      bad("a", "Stiahnem update", "critical"),
      ok("b", "Updaty robím cez Chrome menu (Pomocník → O Chrome)"),
    ],
    explanation: "Updaty prehliadača nikdy cez popup. Spustenie .exe = malware (RAT/keylogger).",
  },
  {
    id: "f-luxury-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt: 'Eshop predáva Rolexy za 199€. „Originál, švajčiarsky, posledný kus."',
    options: [
      bad("a", "Kúpim — výhodné", "critical"),
      ok("b", "Ignorujem — Rolex za 199€ je sci-fi"),
    ],
    explanation: "Rolex začína na 5000€. 199€ = čínska kópia (alebo nič ti nepríde).",
  },
  {
    id: "u-bank-suffix-1",
    category: "url",
    difficulty: "hard",
    prompt: "Si na tejto adrese po kliku v emaile.",
    visual: { kind: "url", url: "https://login.tatrabanka.sk.user-portal.io" },
    options: [
      bad("a", "Pravý SLSP — vidím tatrabanka.sk", "critical"),
      ok("b", "Phishing — pravá doména je `user-portal.io`"),
    ],
    explanation:
      "Doména je vždy vpravo pred prvým `/`. Tu = `user-portal.io`. Všetko vľavo sú len subdomény.",
  },
  {
    id: "h-passwordreset-1",
    category: "honeypot",
    difficulty: "easy",
    prompt:
      'Príde email: „Niekto požiadal o reset hesla na vašom Google. Ak ste to neboli vy, ignorujte." Ty si nikto. Akcia?',
    options: [
      bad("a", 'Kliknem na „toto som nebol ja" link', "medium"),
      ok("b", "Ignorujem — varovanie zo skutočnej Google príde aj keď ignoruješ"),
      bad("c", "Resetujem heslo pre istotu cez link v emaile", "critical"),
    ],
    explanation:
      "Aj reálne emaily majú phishing kópie. Ak nič nerobíš, ignoruj. Reset rob výhradne ručne na `accounts.google.com`.",
  },
  {
    id: "f-fake-shop-2",
    category: "fake_vs_real",
    difficulty: "hard",
    prompt:
      "Eshop sa tvári profi: SK, IČO, kontakt. Recenzie 5★, ale na heureka.sk nie je. Sociálne siete prázdne. Kúpiš?",
    options: [
      bad("a", "Áno — má IČO", "medium"),
      ok("b", "Skontrolujem registráciu domény (whois) + SK firmy v ORSR"),
    ],
    explanation:
      "Fake eshopy uvádzajú vymyslené IČO. Skontroluj v ORSR a `whois` pre dátum registrácie domény.",
  },
  {
    id: "s-overpay-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      'Predávaš laptop za 500€. Kupec pošle 700€ a žiada vrátiť 200€ späť, lebo „omylom". Vrátiš?',
    options: [
      bad("a", "Vrátim — slušné", "critical"),
      ok("b", "Počkám 2 týždne, či sa pôvodný prevod nestorno­vať"),
    ],
    explanation:
      "Overpayment scam: pôvodný prevod sa stornuje (kradnutá karta), ty vrátiš reálne peniaze a stratíš laptop.",
  },
  {
    id: "p-sms-fedex-1",
    category: "phishing",
    difficulty: "easy",
    prompt: "FedEx SMS o cle.",
    visual: {
      kind: "sms",
      sender: "FedEx",
      body: "Vaša zásielka čaká na zaplatenie clo 3,99€:",
      link: "https://fedex-customs.click/pay",
    },
    options: [
      bad("a", "Zaplatím — len 4€", "critical"),
      ok("b", "Skontrolujem cez fedex.com s tracking číslom"),
    ],
    explanation: "FedEx = `fedex.com`. `.click` TLD je takmer vždy spam/phishing.",
  },
  {
    id: "u-suffix-tld-1",
    category: "url",
    difficulty: "medium",
    prompt: "Doména s ktorou TLD je najbezpečnejšia?",
    options: [
      bad("a", ".click", "medium"),
      bad("b", ".zip", "medium"),
      ok("c", ".sk od overenej značky"),
      bad("d", ".online", "medium"),
    ],
    explanation:
      'Žiadna TLD nie je „bezpečná" sama o sebe, ale `.click`, `.zip`, `.online`, `.app` sú lacné a často zneužívané scammermi.',
  },
  {
    id: "f-investment-2",
    category: "fake_vs_real",
    difficulty: "hard",
    prompt: 'Známy z FB ti odporúča platformu „CryptoYieldPro" so 5% denným ziskom. Skúsiš s 200€?',
    options: [
      bad("a", "Skúsim — známy mi to odporúča", "critical"),
      ok("b", "Nie — známy je pravdepodobne ďalšia obeť (pyramída)"),
    ],
    explanation:
      "Ponzi scheme cez crypto: prvé výplaty fungujú (peniaze nových klientov). Potom platforma zmizne.",
  },
  {
    id: "p-email-uloz-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Z banky ti príde email s upozornením.",
    visual: {
      kind: "email",
      from: "ČSOB Bezpečnosť",
      fromEmail: "no-reply@csob.sk",
      subject: "Bezpečnostné varovanie",
      body: "Pre bezpečnosť zmente heslo. Ak ste to neboli vy, prihláste sa do ČSOB SmartBanking a zmente heslo.",
    },
    options: [
      bad("a", "Kliknem v emaile na link", "medium"),
      ok("b", "Otvorím ČSOB SmartBanking ručne"),
    ],
    explanation:
      "Aj keď email JE pravý (správna doména), návyk klikať na linky v emailoch je risk. Vždy otvor appku/stránku ručne.",
  },
  {
    id: "s-fake-mail-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      'Doma máš v schránke list „Zaplatenie pokuty za parkovanie 28€, IBAN SK… variabilný 2024-X.". List vyzerá oficiálne.',
    options: [
      bad("a", "Zaplatím — chcem to mať preč", "critical"),
      ok("b", "Skontrolujem na stránke mestskej polície / parkovacej spoločnosti"),
    ],
    explanation:
      "Fake pokuty v schránke sú reálne SK 2023-2024. Vždy overíš online. Skutočná pokuta má číslo konania.",
  },
  {
    id: "u-mojsk-1",
    category: "url",
    difficulty: "medium",
    prompt: "Štátna stránka — pravá?",
    options: [
      ok("a", "slovensko.sk"),
      bad("b", "slovensko-portal.sk", "critical"),
      bad("c", "slovensko.gov.online", "critical"),
    ],
    explanation: "Štátne služby = `slovensko.sk`. Pozor — `.gov` neexistuje pre SK, je to USA TLD.",
  },
  {
    id: "h-airdrop-1",
    category: "honeypot",
    difficulty: "medium",
    prompt: 'V crypto peňaženke máš zrazu token „CLAIM 5000$". Klikneš na claim?',
    options: [
      bad("a", "Kliknem — peniaze zadarmo", "critical"),
      ok("b", "Ignorujem — claim funkcia okradne celý wallet"),
    ],
    explanation:
      "Crypto airdrop scam: claim transakcia podpíše permission, ktorá vyprázdni peňaženku.",
  },
  {
    id: "p-sms-policia-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "SMS od polície.",
    visual: {
      kind: "sms",
      sender: "POLICIA SR",
      body: "Bola na vás podaná sťažnosť. Pre detaily kliknite:",
      link: "https://policia-sr.info/spis",
    },
    options: [
      bad("a", "Kliknem — chcem vedieť", "critical"),
      ok("b", "Polícia neposiela SMS — ignorujem"),
    ],
    explanation: "Polícia komunikuje listom alebo predvolaním. Žiadne SMS s linkom.",
  },
  {
    id: "f-fake-influencer-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      'Známy slovenský influencer ti píše DM: „Vyhrala si v mojej súťaži! Pošli adresu cez tento link."',
    options: [
      bad("a", "Pošlem — výhra je výhra", "critical"),
      ok("b", "Skontrolujem profil (verified ✓?) a kontaktujem cez oficiálne kanály"),
    ],
    explanation:
      "Fake účty kopírujúce influencerov sú #1 spôsob krádeže IG/údajov. Skontroluj verified značku a počet sledujúcich.",
  },
  {
    id: "s-loan-1",
    category: "scenario",
    difficulty: "medium",
    prompt:
      'Reklama: „Pôžička 5000€ bez registra a banky, schválime všetkým. Stačí poslať poplatok 49€."',
    options: [
      bad("a", "Pošlem 49€ — potrebujem peniaze", "critical"),
      ok("b", "Ignorujem — žiadna seriózna pôžička nemá poplatok vopred"),
    ],
    explanation: "Advance fee fraud: zaplatíš poplatok, žiadne peniaze ti neprídu, scammer zmizne.",
  },
  {
    id: "u-shopify-1",
    category: "url",
    difficulty: "medium",
    prompt: "Stránka eshopu má URL `myshop123.myshopify.com`. Je to dôveryhodné?",
    options: [
      bad("a", "Áno — Shopify je značka", "medium"),
      ok("b", "Shopify hostí kohokoľvek — over si predajcu zvlášť"),
    ],
    explanation:
      "Shopify (a podobne Wix, Squarespace) je platforma. Doména hostiteľa nehovorí nič o serióznosti predajcu. Over recenzie a IČO.",
  },
  {
    id: "p-email-shared-1",
    category: "phishing",
    difficulty: "hard",
    prompt: "Kolega ti zdieľal Sharepoint dokument.",
    visual: {
      kind: "email",
      from: "Peter (Sharepoint)",
      fromEmail: "no-reply@sharepoint-share.online",
      subject: "Peter zdieľal s vami: Q4_Bonus.xlsx",
      body: "Otvorte dokument a prihláste sa cez Microsoft.",
      cta: "Otvoriť",
    },
    options: [
      bad("a", "Otvorím — chcem vidieť bonus", "critical"),
      ok("b", "Overím s Petrom osobne / na Teams"),
    ],
    explanation:
      "Sharepoint phishing kópie sú v 2024 epidémia. Doména `sharepoint-share.online` je fake.",
  },
  {
    id: "h-survey-1",
    category: "honeypot",
    difficulty: "easy",
    prompt: 'Pop-up: „Vyplňte 30s prieskum a vyhrajte iPhone 15."',
    options: [bad("a", "Vyplním", "critical"), ok("b", "Zavriem — žiadny iPhone za 30s prieskum")],
    explanation:
      'Survey scam: zbiera údaje, na konci ti vezme platbu „za poštovné" a ukradne kartu.',
  },
  {
    id: "f-bazos-3",
    category: "fake_vs_real",
    difficulty: "hard",
    prompt: 'Predávaš na Bazoši za 200€. Kupec posiela link „pre overenie účtu Bazoš". Klikneš?',
    visual: {
      kind: "url",
      url: "https://bazos.sk-overit-platbu.com",
      secure: true,
    },
    options: [
      bad("a", "Áno — chcem predať", "critical"),
      ok("b", "Bazoš nemá overovacie linky pre platby"),
    ],
    explanation:
      "Bazoš nemá ochrannú platbu cez link. Posledné 2 časti pred `/` sú `sk-overit-platbu.com`, scam doména.",
  },
  {
    id: "u-port-1",
    category: "url",
    difficulty: "hard",
    prompt: "Adresa: `https://tatrabanka.sk:8443.evil.com`. Bezpečné?",
    options: [
      bad("a", "Áno — vidím tatrabanka.sk", "critical"),
      ok("b", "Phishing — všetko pred `:` môže byť subdoména na cudzom serveri"),
    ],
    explanation:
      "Trik s portom: `tatrabanka.sk:8443` vyzerá ako port, ale tu je súčasť subdomény domény `evil.com`.",
  },
  {
    id: "p-sms-banka-blok-1",
    category: "phishing",
    difficulty: "easy",
    prompt: "SMS o blokácii karty.",
    visual: {
      kind: "sms",
      sender: "VUB",
      body: "Vaša karta bola zablokovaná za podozrivú aktivitu. Odblokujte tu:",
      link: "https://vub-odblokovanie.sk",
    },
    options: [bad("a", "Odblokujem", "critical"), ok("b", "Volám na číslo zo zadnej strany karty")],
    explanation: "VÚB = `vub.sk`. Pri probléme s kartou — vždy len telefonát na číslo z karty.",
  },
  {
    id: "s-2fa-bombing-1",
    category: "scenario",
    difficulty: "hard",
    prompt: "Telefón ti nepretržite zvoní notifikáciami z Microsoft authenticator (200x). Akcia?",
    options: [
      bad("a", "Schválim — nech to skončí", "critical"),
      ok("b", "Vypnem notifikácie a zmením heslo Microsoft účtu"),
    ],
    explanation:
      "MFA bombing/fatigue: scammer má heslo, čaká, kým schváliš zo zúfalstva. Nikdy neschvaľ neznámu výzvu.",
  },
  {
    id: "f-cardgame-1",
    category: "fake_vs_real",
    difficulty: "easy",
    prompt: 'Hra v telefóne ponúka „za 10€ získaj 100€ v hre + 50€ bonusy v skutočných peniazoch".',
    options: [
      bad("a", "Skúsim", "medium"),
      ok("b", "Ignorujem — hra peniaze do reality nevypláca, je to scam alebo gambling pasca"),
    ],
    explanation:
      "Hry, ktoré sľubujú reálne peniaze, sú buď scam, alebo neregulované gambling apky.",
  },
  {
    id: "p-email-bank-statement-1",
    category: "phishing",
    difficulty: "medium",
    prompt: 'Banka pošle „výpis" v PDF prílohe.',
    visual: {
      kind: "email",
      from: "ČSOB",
      fromEmail: "vypisy@csob-online.eu",
      subject: "Mesačný výpis č. 04/2024",
      body: "V prílohe nájdete váš výpis. Heslo: posledné 4 čísla rodného čísla.",
    },
    options: [
      bad("a", "Otvorím a zadám heslo", "critical"),
      ok("b", "ČSOB výpisy posiela len v internet bankingu, ignorujem"),
    ],
    explanation: "Banky neposielajú výpisy mailom s heslom z OP. PDF v prílohe môže byť malware.",
  },
  {
    id: "u-bank-uppercase-1",
    category: "url",
    difficulty: "hard",
    prompt: "Adresa v prehliadači:",
    visual: { kind: "url", url: "https://www.tatrabaπka.sk/auth" },
    options: [bad("a", "Pravý SLSP", "critical"), ok("b", "Phishing — `π` (pi) namiesto `n`")],
    explanation:
      "Unicode triky: matematické či grécke písmená, ktoré vyzerajú podobne ako latinské. Browser ti ich len zriedka označí.",
  },
  {
    id: "h-easy-job-1",
    category: "honeypot",
    difficulty: "easy",
    prompt:
      'WhatsApp z neznámeho čísla: „Ahoj, ponúkam prácu z domu, 200-500€ denne za lajkovanie videí. Zaujem?"',
    options: [bad("a", "Zaujíma", "critical"), ok("b", "Blokujem — task scam")],
    explanation:
      'Task scam: dostaneš mikropráce za pár €, potom „investuj a zarobíš viac". Nakoniec pošleš stovky/tisíce a stratíš.',
  },
  {
    id: "f-fake-stripe-1",
    category: "fake_vs_real",
    difficulty: "hard",
    prompt:
      'Predávaš na FB Marketplace. Kupec posiela link „Stripe bezpečná platba — potvrdťe IBAN pre prijatie."',
    options: [
      bad("a", "Potvrdím IBAN", "critical"),
      ok("b", "Stripe nepýta IBAN cez link, navyše Marketplace nemá Stripe"),
    ],
    explanation:
      "Fake Stripe/PayPal/Wise stránky sú top scam pre predajcov. Marketplace platby idú priamo medzi účtami, žiadny link.",
  },
  {
    id: "s-tech-popup-1",
    category: "scenario",
    difficulty: "easy",
    prompt:
      "Stránka prejde na celú obrazovku, počítač pípa: „Volajte 0800-XXX-XXX, váš PC je infikovaný!“",
    options: [bad("a", "Volám číslo", "critical"), ok("b", "Zatváram tab cez Esc / Task Manager")],
    explanation:
      "Tech support scam — fake virus warning. Zavri prehliadač, vyčisti cache, žiadny vírus to nie je.",
  },
  {
    id: "u-mobile-app-1",
    category: "url",
    difficulty: "medium",
    prompt:
      "V SMS link, ktorý chce nainštalovať appku `bankovnictvi.apk` (mimo App Store / Google Play). Inštaluješ?",
    options: [
      bad("a", "Áno — banka mi to posiela", "critical"),
      ok("b", "Nie — appky banky idú len cez Play Store / App Store"),
    ],
    explanation:
      "Side-load APK = malware. Banky NIKDY neinštalujú appky mimo oficiálnych obchodov.",
  },

  // ============ E9.1 — +30 LEGIT URL HONEYPOTS ============
  // Cieľ: učiť sa rozoznať dôveryhodné URL od scam-ových klonov.
  // Severity „minor" pri zlej (paranoidnej) odpovedi — pereverenost je menšie zlo než klikanie všetkého.

  // ----- Banking (10) -----
  {
    id: "h-url-bank-1",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Banka SLSP ti pošle link na internet banking. Vyzerá takto. Otvoríš?",
    visual: { kind: "url", url: "https://moja.slsp.sk/login", secure: true },
    options: [
      ok("a", "Áno — moja.slsp.sk je oficiálna doména SLSP"),
      bad("b", "Nie — divný subdoménový tvar", "minor"),
    ],
    explanation:
      "Subdoména `moja.slsp.sk` patrí Slovenskej sporiteľni — používajú ju pre osobné internet banking. Doména druhého rádu (`slsp.sk`) je tá, ktorá určuje vlastníka. Subdomény ako moja/online/m sú normálny pattern.",
  },
  {
    id: "h-url-bank-2",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Aj toto vyzerá ako ČSOB internet banking. Otvoríš?",
    visual: { kind: "url", url: "https://m.csob.sk", secure: true },
    options: [
      ok("a", "Áno — `m` je mobilná verzia, doména csob.sk je legit"),
      bad("b", "Nie — `m.` je podozrivé", "minor"),
    ],
    explanation:
      "Prefix `m.` (mobile) je bežný pattern u veľkých webov — m.facebook.com, m.alza.sk, m.csob.sk. Doména druhého rádu zostáva pravá: csob.sk patrí ČSOB.",
  },
  {
    id: "h-url-bank-3",
    category: "honeypot",
    difficulty: "hard",
    prompt: "Tatra banka má B2B portál. URL vyzerá takto.",
    visual: { kind: "url", url: "https://b2b.tatrabanka.sk/login", secure: true },
    options: [
      ok("a", "Legit — `b2b.tatrabanka.sk` je oficiálna firemná zóna"),
      bad("b", "Skoro phishing, neotváram", "minor"),
    ],
    explanation:
      "Tatra banka má samostatné subdomény pre retail a B2B segment. `b2b.tatrabanka.sk` je legit — over si HTTPS certifikát (vlastník: Tatra banka, a.s.).",
  },
  {
    id: "h-url-bank-4",
    category: "honeypot",
    difficulty: "hard",
    prompt: "Poštová banka prešla rebrandom. Kliknutie na 365.bank — risk?",
    visual: { kind: "url", url: "https://365.bank", secure: true },
    options: [
      ok("a", "Legit — `.bank` je regulovaný TLD, 365.bank je oficiálne"),
      bad("b", "TLD `.bank` znie ako scam, neklikám", "minor"),
    ],
    explanation:
      "TLD `.bank` je gTLD spravovaná organizáciou fTLD Registry Services s prísnymi požiadavkami — DNSSEC povinný, len overené finančné inštitúcie. Poštová banka je pod brandom 365.bank od 2021. Bezpečnejšie než `.com` doména.",
  },
  {
    id: "h-url-bank-5",
    category: "honeypot",
    difficulty: "medium",
    prompt: "VÚB má internet banking. Vidíš túto URL — bezpečné?",
    visual: { kind: "url", url: "https://ib.vub.sk", secure: true },
    options: [
      ok("a", "Áno — `ib.vub.sk` je oficiálny VÚB internet banking"),
      bad("b", "Krátka URL je podozrivá", "minor"),
    ],
    explanation:
      "Krátkosť URL nie je signál phishingu. `ib.` (Internet Banking) je tradičná subdoména VÚB. Doména druhého rádu vub.sk patrí VÚB banke.",
  },
  {
    id: "h-url-bank-6",
    category: "honeypot",
    difficulty: "hard",
    prompt: "Národná banka Slovenska — pozeráš sa na zoznam regulovaných subjektov.",
    visual: {
      kind: "url",
      url: "https://www.nbs.sk/sk/dohlad-nad-financnym-trhom/zoznamy",
      secure: true,
    },
    options: [
      ok("a", "Legit — nbs.sk je doména NBS"),
      bad("b", "URL je dlhá, vyzerá podozrivo", "minor"),
    ],
    explanation:
      "Dlhá path nie je signál — naopak, čím viac štruktúrovaných ciest (/sk/dohlad/...), tým reálnejší obsahový web. NBS používa dlhšie URL pre kategorizáciu obsahu.",
  },
  {
    id: "h-url-bank-7",
    category: "honeypot",
    difficulty: "medium",
    prompt: "George (Erste) bankovníctvo na webe. Real?",
    visual: { kind: "url", url: "https://georgebanking.com", secure: true },
    options: [
      ok("a", "Áno — George je oficiálna platforma Erste / SLSP"),
      bad("b", "Anglická doména na slovenskú banku, nedôverujem", "minor"),
    ],
    explanation:
      "George je multi-país platform Erste Group; používaný v SK pod SLSP, v ČR pod Českou spořitelnou. Doména `.com` je medzinárodná, ale brand je konzistentný a SLSP tam linkuje z slsp.sk.",
  },
  {
    id: "h-url-bank-8",
    category: "honeypot",
    difficulty: "medium",
    prompt: "ČSOB pošle e-mail s linkom na podporu. URL je takáto.",
    visual: { kind: "url", url: "https://podpora.csob.sk/kontakt", secure: true },
    options: [
      ok("a", "Legit — subdoména podpora.csob.sk je oficiálna"),
      bad("b", "Veľa subdomén = podozrivé", "minor"),
    ],
    explanation:
      "Banky používajú množstvo subdomén pre rôzne sekcie (podpora, prihlasenie, fakturacia). Vlastnícky určujúca časť je doména druhého rádu — csob.sk.",
  },
  {
    id: "h-url-bank-9",
    category: "honeypot",
    difficulty: "hard",
    prompt: "Prima banka má krátky brand subdoménový tvar. Si si istý?",
    visual: { kind: "url", url: "https://prima.primabanka.sk", secure: true },
    options: [
      ok("a", "Áno — `prima.primabanka.sk` je legitímna"),
      bad("b", "Duplikácia slova `prima` znie ako klon", "minor"),
    ],
    explanation:
      "Subdoména pre internet banking sa náhodou volá rovnako ako brand. Doména druhého rádu primabanka.sk je vlastnícky kľúč — patrí Prima banke. Žiadny klon.",
  },
  {
    id: "h-url-bank-10",
    category: "honeypot",
    difficulty: "hard",
    prompt: "ČSOB potvrdenie cez SMS — link s tracking ID. Otvoríš?",
    visual: {
      kind: "url",
      url: "https://www.csob.sk/transakcia/0193af-confirm",
      secure: true,
    },
    options: [
      ok("a", "Áno — doména csob.sk + HTTPS + sensible path"),
      bad("b", "Náhodne vyzerajúce ID v URL je suspect", "minor"),
    ],
    explanation:
      "Tracking ID-čká v path sú normálny pattern u akejkoľvek transakčnej stránky. Dôležitá je doména druhého rádu (csob.sk) a HTTPS s validnou cert.",
  },

  // ----- E-shop / komerčné (10) -----
  {
    id: "h-url-shop-1",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Alza objednávka — link na sledovanie. Real?",
    visual: {
      kind: "url",
      url: "https://www.alza.sk/objednavka/AB12345678",
      secure: true,
    },
    options: [
      ok("a", "Áno — alza.sk + cesta /objednavka/ je legit"),
      bad("b", "Náhodný kód v URL znie ako scam", "minor"),
    ],
    explanation:
      "Alza používa formát `/objednavka/{order-id}` na tracking page. Doména alza.sk je vlastnícky kľúč. Také URL prichádzajú aj v potvrdzovacích e-mailoch.",
  },
  {
    id: "h-url-shop-2",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Mobilná verzia Alzy. Bezpečné?",
    visual: { kind: "url", url: "https://m.alza.sk/akcia", secure: true },
    options: [
      ok("a", "Áno — m. je mobilná subdoména Alzy"),
      bad("b", "`m.` prefix znie phishingovo", "minor"),
    ],
    explanation:
      "Pre mobilné prostredie e-shopy používajú m. subdoménu (alebo respond responsive design na hlavnej doméne). Alza má m.alza.sk, mall m.mall.sk, atď. Žiadny scam.",
  },
  {
    id: "h-url-shop-3",
    category: "honeypot",
    difficulty: "easy",
    prompt: "Heureka link na porovnanie cien.",
    visual: {
      kind: "url",
      url: "https://www.heureka.sk/iphone-15-pro/recenzie/",
      secure: true,
    },
    options: [
      ok("a", "Legit — heureka.sk je porovnávač cien"),
      bad("b", "Recenzia URL znie spammy", "minor"),
    ],
    explanation:
      "Heureka.sk patrí Heureka.cz a.s. — najznámejší cenový porovnávač v ČR/SK. Cesty `/produkt/recenzie/` sú normálny pattern.",
  },
  {
    id: "h-url-shop-4",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Slovenská pošta — sledovanie balíka cez ich web.",
    visual: {
      kind: "url",
      url: "https://tandt.posta.sk/sledovanie/RR123456789SK",
      secure: true,
    },
    options: [
      ok("a", "Áno — tandt.posta.sk je oficiálny tracking"),
      bad("b", "`tandt` znie ako náhodný hack", "minor"),
    ],
    explanation:
      'Skratka tandt znamená „Track and Trace" — interná subdoména Slovenskej pošty pre sledovanie zásielok. Doména druhého rádu posta.sk patrí Slovenskej pošte. Tracking ID v path je štandardný.',
  },
  {
    id: "h-url-shop-5",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Notino voucher uplatnenie — link z e-mailu.",
    visual: {
      kind: "url",
      url: "https://www.notino.sk/voucher/redeem/X9K2-PMNT",
      secure: true,
    },
    options: [
      ok("a", "Legit — notino.sk + cesta voucher/redeem"),
      bad("b", "Voucher kód v URL znie ako pasca", "minor"),
    ],
    explanation:
      "Notino (czech krásová e-shop) má SK doménu notino.sk, voucher/redeem path s krátkym kódom je normálny commerce pattern.",
  },
  {
    id: "h-url-shop-6",
    category: "honeypot",
    difficulty: "hard",
    prompt: "Mall.sk pošle linka po reklamácii.",
    visual: {
      kind: "url",
      url: "https://account.mall.sk/reklamacie/12345",
      secure: true,
    },
    options: [
      ok("a", "Áno — account. je legit subdoména Mall.sk"),
      bad("b", "Reklamačná URL by mala byť na hlavnej doméne", "minor"),
    ],
    explanation:
      "Veľké e-shopy (Mall, Alza, Notino) majú samostatnú `account.` subdoménu pre user-area (objednávky, reklamácie, profil). To je dobrá architektonická prax — nie indikátor phishingu.",
  },
  {
    id: "h-url-shop-7",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Dr. Max e-shop pre lekárenský online predaj.",
    visual: { kind: "url", url: "https://eshop.drmax.sk/akcia", secure: true },
    options: [
      ok("a", "Legit — drmax.sk patrí Dr. Max lekárňam"),
      bad("b", "Krátka doména na zdravotnícku firmu znie suspect", "minor"),
    ],
    explanation:
      "Dr. Max (sieť lekární) má v SR doménu drmax.sk a e-shop subdoménu eshop.drmax.sk. SK lekárenské e-shopy potrebujú licenciu od ŠÚKL — overiteľné na sukl.sk.",
  },
  {
    id: "h-url-shop-8",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Zalando po objednávke pošle tracking link.",
    visual: {
      kind: "url",
      url: "https://www.zalando.sk/myaccount/orders/123456",
      secure: true,
    },
    options: [
      ok("a", "Áno — zalando.sk je legit, myaccount je user area"),
      bad("b", "Anglické slovo `myaccount` v SK doméne podozrivé", "minor"),
    ],
    explanation:
      "Zalando je nemecký e-shop s viacjazyčnými verziami. Anglické path slová (myaccount, orders) sú interné a nemajú vplyv na vlastníctvo domény. zalando.sk patrí Zalando SE.",
  },
  {
    id: "h-url-shop-9",
    category: "honeypot",
    difficulty: "hard",
    prompt: "Booking.com potvrdenie rezervácie — link.",
    visual: {
      kind: "url",
      url: "https://secure.booking.com/myreservations.sk.html?aid=123",
      secure: true,
    },
    options: [
      ok("a", "Legit — secure.booking.com s SK lokalizáciou"),
      bad("b", "`?aid=123` query param znie ako tracking scam", "minor"),
    ],
    explanation:
      "Booking používa `secure.booking.com` pre transakčné stránky. `aid=` je affiliate ID (kto poslal traffic) — bežný komercia pattern, žiadny phishing.",
  },
  {
    id: "h-url-shop-10",
    category: "honeypot",
    difficulty: "easy",
    prompt: "Kvet od Heureka.sk linkuje recenzie produktu.",
    visual: {
      kind: "url",
      url: "https://obchody.heureka.sk/alza-sk/recenzie/",
      secure: true,
    },
    options: [
      ok("a", "Legit — Heureka má `obchody.` subdoménu pre overených predajcov"),
      bad("b", "Sub-subdoména je suspect", "minor"),
    ],
    explanation:
      "Heureka má `obchody.heureka.sk` subdoménu kde sú profily overených e-shopov. Tieto stránky sú regulované — pred zverejnením Heureka manuálne overuje oprávnenosť.",
  },

  // ----- eGov / štátne (10) -----
  {
    id: "h-url-gov-1",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Slovensko.sk ti pošle notifikáciu o doručenke v elektronickej schránke.",
    visual: {
      kind: "url",
      url: "https://www.slovensko.sk/sk/elektronicka-schranka",
      secure: true,
    },
    options: [
      ok("a", "Legit — slovensko.sk je centrálny portál verejnej správy"),
      bad("b", "Štátny web by mal mať .gov.sk doménu", "minor"),
    ],
    explanation:
      "Slovensko.sk je oficiálny ústredný portál SR (NASES, gov-grade hosting). Doména `.sk` (nie `.gov.sk`) je v SR pravidelná aj pre štátne stránky vyšších úrovní.",
  },
  {
    id: "h-url-gov-2",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Finančná správa — portál pre podávanie daňových priznaní.",
    visual: {
      kind: "url",
      url: "https://podania.financnasprava.sk/dorucenia",
      secure: true,
    },
    options: [
      ok("a", "Legit — podania.financnasprava.sk je oficiálny portál"),
      bad("b", "Doména je dlhá a chýba .gov", "minor"),
    ],
    explanation:
      "FS používa `financnasprava.sk` pre informačnú časť a `podania.financnasprava.sk` pre transakčný portál (PFS). HTTPS certifikát overuje vlastníka — Finančné riaditeľstvo SR.",
  },
  {
    id: "h-url-gov-3",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Sociálna poisťovňa — portál.",
    visual: { kind: "url", url: "https://www.socpoist.sk/portal", secure: true },
    options: [
      ok("a", "Legit — socpoist.sk je SP"),
      bad("b", "Skratka domény vyzerá ako klon", "minor"),
    ],
    explanation:
      "Sociálna poisťovňa má historickú doménu socpoist.sk. Zaužívané skratky štátnych inštitúcií sú legit, kým doménu vlastní príslušná inštitúcia (overiteľné v SK-NIC whois).",
  },
  {
    id: "h-url-gov-4",
    category: "honeypot",
    difficulty: "hard",
    prompt: "MV SR — kontrola pokút online.",
    visual: { kind: "url", url: "https://www.minv.sk/?platby-pokuty", secure: true },
    options: [
      ok("a", "Legit — minv.sk je Ministerstvo vnútra SR"),
      bad("b", "Query string s pokútami znie ako pasca", "minor"),
    ],
    explanation:
      "minv.sk je oficiálna doména Ministerstva vnútra. Query string `?platby-pokuty` je SEO redirect na sekciu o platbe pokút — žiadny scam. Reálnu výzvu o pokutu však polícia neposiela cez SMS link, vždy poštou.",
  },
  {
    id: "h-url-gov-5",
    category: "honeypot",
    difficulty: "medium",
    prompt: "ÚVZ SR — verejné zdravotníctvo, oznam.",
    visual: { kind: "url", url: "https://www.uvzsr.sk/oznamy/2026", secure: true },
    options: [
      ok("a", "Legit — uvzsr.sk patrí Úradu verejného zdravotníctva"),
      bad("b", "Skratka uvzsr je suspect", "minor"),
    ],
    explanation:
      "Skratka ÚVZSR = Úrad verejného zdravotníctva SR. Štátne organizácie majú často dlhé skratkové domény. Vlastníctvo overiteľné v whois.",
  },
  {
    id: "h-url-gov-6",
    category: "honeypot",
    difficulty: "hard",
    prompt: "Justice.gov.sk — elektronické podanie do súdneho registra.",
    visual: {
      kind: "url",
      url: "https://www.justice.gov.sk/sluzby/elektronicke-podanie",
      secure: true,
    },
    options: [
      ok("a", "Legit — justice.gov.sk je Ministerstvo spravodlivosti"),
      bad("b", ".gov.sk je nezvyčajné, asi scam", "minor"),
    ],
    explanation:
      "`.gov.sk` je rezervovaná SK-NIC zóna iba pre štátne orgány. Domény ako justice.gov.sk, finance.gov.sk, mzv.gov.sk sú garantované štátne — silnejší trust signál ako bežná .sk.",
  },
  {
    id: "h-url-gov-7",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Štatistický úrad SR — register právnických osôb (RPO) lookup.",
    visual: { kind: "url", url: "https://rpo.statistics.sk/rpo", secure: true },
    options: [
      ok("a", "Legit — statistics.sk je ŠÚ SR, rpo. je register"),
      bad("b", "Anglický `statistics` na slovenský úrad je divné", "minor"),
    ],
    explanation:
      "Štatistický úrad SR má historickú doménu statistics.sk (anglické pomenovanie z 90s, kým zaviedli .sk pre štátne orgány). RPO je oficiálny register a doména je trust-worthy.",
  },
  {
    id: "h-url-gov-8",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Obchodný register Slovenskej republiky.",
    visual: {
      kind: "url",
      url: "https://www.orsr.sk/vypis.asp?ID=237161&SID=8&P=1",
      secure: true,
    },
    options: [
      ok("a", "Legit — orsr.sk je Obchodný register SR"),
      bad("b", "Query stringy s viacero ID je suspect", "minor"),
    ],
    explanation:
      "ORSR.sk patrí Ministerstvu spravodlivosti — staršie ASP-based UI s query stringmi je len legacy infraštruktúra, nie scam. Doména druhého rádu je vlastnícky kľúč.",
  },
  {
    id: "h-url-gov-9",
    category: "honeypot",
    difficulty: "hard",
    prompt: "eKasa — portál pre živnostníkov a registrácie pokladníc.",
    visual: { kind: "url", url: "https://ekasa.financnasprava.sk", secure: true },
    options: [
      ok("a", "Legit — `ekasa.` je subdoména financnasprava.sk"),
      bad("b", "Krátky brand-subdoména na štátnom webe podozrivé", "minor"),
    ],
    explanation:
      "FS má samostatné subdomény pre rôzne služby — ekasa, podania, eda, pfs. Doménový vlastník je rovnaký (Finančné riaditeľstvo SR), len rozdelené pre architektúru.",
  },
  {
    id: "h-url-gov-10",
    category: "honeypot",
    difficulty: "medium",
    prompt: "Datacentrum Mestia Bratislavy — služba občanom.",
    visual: { kind: "url", url: "https://datacentrum.gov.sk/sluzby", secure: true },
    options: [
      ok("a", "Legit — .gov.sk je rezervovaná štátna zóna"),
      bad("b", "Slovo `datacentrum` znie ako server scam", "minor"),
    ],
    explanation:
      "DataCentrum (DataCentrum elektronizácie územnej samosprávy Slovenska, DEUS) je príspevková organizácia MIRRI SR, .gov.sk doména im patrí. Skratka DEUS / dlhšie meno organizácie sa občas skracuje.",
  },

  // ============ DEMOGRAFICKÉ DOPLNKY — žiaci, študenti, seniori ============

  // --- Žiaci / gaming / škola ---
  {
    id: "f-discord-nitro-1",
    category: "fake_vs_real",
    difficulty: "easy",
    prompt:
      'Kamarát ti na Discorde posiela link: „Dostal som zadarmo Discord Nitro, klikni tu a vezmi si aj ty."',
    visual: {
      kind: "sms",
      sender: "Kamarát (Discord)",
      body: "yo mas nesto klukni hned a vezmi zadarmo Discord Nitro na mesiac",
      link: "https://discord-nitro-gift.click/free",
    },
    options: [
      bad("a", "Kliknem — Nitro zadarmo je super", "critical"),
      ok("b", "Nespustím — kamaráta mohli hacknúť"),
      bad("c", "Kliknem, ale len cez incognito", "medium"),
    ],
    explanation:
      "Fake Nitro linky kradnú Discord token — scammer preberá tvoj účet a pošle rovnaký link tvojim kamarátom. Darované Nitro od Discordu príde vždy priamo v appke ako darček, nie cez externý link.",
  },
  {
    id: "f-gaming-vbucks-1",
    category: "fake_vs_real",
    difficulty: "easy",
    prompt: 'Stránka ponúka: „1 000 V-Bucks / Robux ZADARMO! Zadaj meno účtu a „overovací kód"."',
    options: [
      bad("a", "Vyskúšam — načo by to bolo fake", "critical"),
      ok("b", "Ignorujem — generátor hernej meny neexistuje"),
      bad("c", "Vyskúšam, ale dám falošné meno", "medium"),
    ],
    explanation:
      "V-Bucks, Robux ani iná herná mena sa nedajú generovať z tretích stránok — sú uložené na serveroch Epic/Roblox. Tieto stránky kradnú prihlasovacie údaje alebo inštalujú malware.",
  },
  {
    id: "p-email-school-ms-1",
    category: "phishing",
    difficulty: "medium",
    prompt: "Škola ti vraj posiela link na obnovu hesla do Teams.",
    visual: {
      kind: "email",
      from: "IT Podpora Škola",
      fromEmail: "it-support@skola-portal-update.com",
      subject: "Povinná obnova prístupu do Microsoft Teams — do 24 hodín",
      body: "Platnosť vášho školského konta vyprší zajtra. Kliknite a aktualizujte heslo, inak stratíte prístup.",
      cta: "Aktualizovať heslo",
    },
    options: [
      bad("a", "Kliknem — nechcem prísť o prístup", "critical"),
      ok("b", "Prihlásim sa ručne cez office.com a overím u správcu siete"),
    ],
    explanation:
      "Škola spravuje heslá cez školský portál (office.com / outlook.com), nie cez externé domény. `skola-portal-update.com` je registrovaná cudzou osobou. Phishing takto kradne školský účet.",
  },
  {
    id: "h-tiktok-giveaway-1",
    category: "honeypot",
    difficulty: "easy",
    prompt: 'SMS: „Boli ste vybraní na odmenu 500€ od TikToku. Pre aktiváciu sa prihláste."',
    visual: {
      kind: "sms",
      sender: "TikTok Promo SK",
      body: "Gratulujeme! Ste jeden z 100 vybraných. Aktivujte odmenu 500€ tu:",
      link: "https://tiktok-reward-sk.live/login",
    },
    options: [
      bad("a", "Prihlásim sa — 500€ je 500€", "critical"),
      ok("b", "Ignorujem — TikTok takto nič nerozdeľuje"),
    ],
    explanation:
      "TikTok ani žiadna sociálna sieť nevyplácajú odmeny cez SMS link. Toto kradne prihlasovacie údaje do TikToku alebo iného konta.",
  },
  {
    id: "f-teen-job-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      'Inzerát na Instagrame: „Pracuj z domu od 15 rokov, 20€/hod, stačí zdieľať príspevky. Registrácia 15€."',
    options: [
      bad("a", "Registrujem sa — 20€/hod je super", "critical"),
      ok("b", "Ignorujem — práca, kde ty platíš vopred, nie je práca"),
    ],
    explanation:
      "Advance fee scam: zaplatíš registráciu, dostaneš návod na ďalší nábor alebo nič. Žiadna seriózna brigáda nepýta poplatok vopred.",
  },
  {
    id: "s-school-qr-1",
    category: "scenario",
    difficulty: "medium",
    prompt:
      'V školskej chodbe visí QR kód: „Nová app — objednaj obed rýchlejšie." Po naskenovaní stránka žiada školský email a heslo. Zadáš?',
    options: [
      bad("a", "Zadám — chcem rýchle objednanie", "critical"),
      ok("b", "Nechám to — overím najprv u poverеného správcu IT školy"),
    ],
    explanation:
      "QR kódy na verejných miestach môžu byť prekryté falošnými. Školský email a heslo zadávaj len na stránke, ktorú ti ukáže IT školský správca priamo.",
  },
  {
    id: "h-free-spotify-1",
    category: "honeypot",
    difficulty: "easy",
    prompt:
      'Kamarát ti pošle link: „Mám aktivovaný Spotify Premium zadarmo, použi aj ty — zadaj tu email a heslo."',
    options: [
      bad("a", "Zadám — Spotify Premium zadarmo", "critical"),
      ok("b", "Neprihlásim sa cez cudzí link"),
    ],
    explanation:
      "Cez cudzí link odovzdáš heslo priamo scammerovi. Ak chceš Premium, Spotify ponúka 3-mesačnú skúšobnú verziu priamo na spotify.com.",
  },

  // --- Seniori ---
  {
    id: "s-vnuk-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      '"Ahoj babka/starko, som to ja, Dominik. Mal som nehodu, som v nemocnici a potrebujem 2 000€ hneď. Nehovor to mame." Hlas znie povedomо.',
    options: [
      bad("a", "Pošlem — je to vnuk", "critical"),
      bad("b", "Pošlem polovicu — pre istotu", "critical"),
      ok("c", "Zavesím a zavolám priamo vnukovi na jeho číslo"),
    ],
    explanation:
      '„Ahoj babka scam" je najčastejší podvod cielený na seniorov v SR. AI klonovanie hlasu vie z krátkych klipov na sociálnych sieťach skopirovať hlas kohokoľvek. Vždy overenie priamo na pôvodnom čísle.',
  },
  {
    id: "s-door-bank-1",
    category: "scenario",
    difficulty: "medium",
    prompt:
      'Niekto zazvoní a povie: „Dobré ráno, som z banky — kontrolujeme vklady v oblasti. Môžem vidieť vašu vkladnú knižku alebo kartu?"',
    options: [
      bad("a", "Ukážem — ide z banky", "critical"),
      ok("b", "Nepustím dnu — banka nikdy nechodí po domácnostiach bez predošlej objednávky"),
      bad("c", "Nechám ho čakať a zavolám banke na číslo, čo mi dal", "medium"),
    ],
    explanation:
      'Banky nikdy neposielajú pracovníkov „kontrolovať vklady" bez vopred dohodnutého stretnutia. Číslo, ktoré ti dal, je jeho vlastné. Volaj na číslo zo zadnej strany karty.',
  },
  {
    id: "f-pension-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      'List v schránke: „Sociálna poisťovňa SR: máte nárok na príplatok k dôchodku 128 €/mes. Zavolajte pre aktiváciu na 0900 XXX XXX."',
    options: [
      bad("a", "Zavolám — chcem príplatok", "critical"),
      ok("b", "Overím priamo na pobočke Sociálnej poisťovne, nie na čísle z listu"),
    ],
    explanation:
      "Príplatky k dôchodku prideľuje Sociálna poisťovňa automaticky — nezvoní sa na prémiové 0900 linky (tie môžu účtovať aj 4 €/min). Akékoľvek zmeny sa vybavujú osobne alebo cez overené eGov portály.",
  },
  {
    id: "s-ai-voice-1",
    category: "scenario",
    difficulty: "hard",
    prompt:
      'Zavolá ti syn/dcéra, spoznáš jeho/jej hlas: „Mama, zadržali ma colníci na hranici, potrebujem 1 800€ v Bitcoine hneď." Hlas znie 100% ako on/ona.',
    options: [
      bad("a", "Idem k Bitcoinu — spoznávam hlas", "critical"),
      ok("b", "Zavesím a zavolám dieťaťu priamo na jeho číslo"),
    ],
    explanation:
      "AI voice cloning vie z niekoľkých sekúnd videa/audia skopirovať hlas kohokoľvek. V roku 2024 táto technika ukradla státisíce eur od seniorov v EÚ. Vždy overenie na pôvodnom čísle — scammer nezdvihne.",
  },
  {
    id: "s-fake-charity-call-1",
    category: "scenario",
    difficulty: "easy",
    prompt:
      'Telefonista: „Zbierame na onkologicky choré deti, pošlite teraz 20€ — prečítajte mi číslo karty a CVV."',
    options: [
      bad("a", "Prečítam — chcem pomôcť", "critical"),
      ok("b", "Odmietnem a darujem online cez overenú nadáciu"),
    ],
    explanation:
      "Seriózne charity (Liga proti rakovine, Dobrý anjel) nikdy nepýtajú číslo karty po telefóne. Darujte priamo na ich overených weboch.",
  },

  // --- Študenti (16+) ---
  {
    id: "f-student-accom-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      'Inzerát: izba v Bratislave, 290€/mes, zariadená, pri metre. Prenajímateľ: „Pošlite zálohu 580€, kľúče pošlem poštou — sám som momentálne v zahraničí."',
    options: [
      bad("a", "Pošlem zálohu — cena je super", "critical"),
      ok("b", "Odmietnem — záloha pred osobnou prehliadkou = scam"),
    ],
    explanation:
      'Bývanie scam: prenajímateľ „v zahraničí" + záloha pred prehliadkou = nikdy neuvidíš ani byt, ani peniaze. Bez osobnej obhliadky vopred neplatiť nič.',
  },
  {
    id: "p-email-uni-1",
    category: "phishing",
    difficulty: "medium",
    prompt: 'Email: „UK Bratislava — váš prístup do AIS2 bude zablokovaný o 24 hodín."',
    visual: {
      kind: "email",
      from: "IT UK Bratislava",
      fromEmail: "it-support@uniba-portal-update.eu",
      subject: "Povinná aktualizácia AIS2 — zablokujeme prístup k zápisom",
      body: "Platnosť vášho prístupu vyprší. Kliknite a aktualizujte údaje do 24 hodín.",
      cta: "Aktualizovať AIS2",
    },
    options: [
      bad("a", "Kliknem — nechcem prísť o zápis predmetov", "critical"),
      ok("b", "Prihlásim sa priamo na ais2.uniba.sk — nie cez link z emailu"),
    ],
    explanation:
      "Univerzitné systémy (AIS2, MAIS) posielajú notifikácie z domény školy (`uniba.sk`, `stuba.sk`...). `uniba-portal-update.eu` je cudzí registrant. Phishing cieli na zápisové termíny, kedy sú študenti pod tlakom.",
  },
  {
    id: "f-scholarship-fake-1",
    category: "fake_vs_real",
    difficulty: "medium",
    prompt:
      'Email: „Erasmus+ Slovensko: boli ste vybraní na štipendium 4 500€. Pre aktiváciu pošlite overovací poplatok 80€."',
    options: [
      bad("a", "Pošlem 80€ — 4 500€ za to stojí", "critical"),
      ok("b", "Ignorujem — Erasmus+ nikdy nepýta poplatok vopred"),
    ],
    explanation:
      "Erasmus+ granty sa prideľujú výhradne cez koordinátora na škole — bez pred-poplatkov, bez emailového výberu mimo prihlásenia. Falošné štipendiá fungujú na princípe advance fee fraud.",
  },
];

const TEST_SIZE = 15;

export function getTestQuestions(): Question[] {
  // Shuffle and take TEST_SIZE, ensuring some category mix.
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);

  // Pick at least 2 from each category for balanced test
  const cats: Category[] = ["phishing", "url", "fake_vs_real", "scenario", "honeypot"];
  const selected: Question[] = [];
  const used = new Set<string>();

  for (const c of cats) {
    const quota = c === "honeypot" ? 4 : 2;
    const fromCat = shuffled.filter((q) => q.category === c).slice(0, quota);
    for (const q of fromCat) {
      if (!used.has(q.id)) {
        selected.push(q);
        used.add(q.id);
      }
    }
  }
  // Fill the rest randomly — but cap honeypot at 4/15 (~27 %) so the
  // expanding honeypot bank (E9.x) does not flip default test into a
  // paranoia-trainer with too few real scam scenarios.
  const HONEYPOT_CAP = 4;
  let honeypotCount = selected.filter((q) => q.category === "honeypot").length;
  for (const q of shuffled) {
    if (selected.length >= TEST_SIZE) break;
    if (used.has(q.id)) continue;
    if (q.category === "honeypot" && honeypotCount >= HONEYPOT_CAP) continue;
    selected.push(q);
    used.add(q.id);
    if (q.category === "honeypot") honeypotCount++;
  }

  // Final shuffle so categories aren't grouped
  return selected.sort(() => Math.random() - 0.5).slice(0, TEST_SIZE);
}

/**
 * Compute time limit (seconds) for a question based on:
 *  - text length of the visual context (reading)
 *  - prompt + options length (comprehension + decision)
 *  - difficulty bump
 *
 * Slovak average reading speed ~ 4 words/sec when scanning.
 * We use chars/sec ≈ 22 (≈4 words/sec * ~5 chars/word) for reading,
 * then add a fixed comprehension + decision buffer.
 */
export function getQuestionById(id: string): Question | null {
  return QUESTIONS.find((q) => q.id === id) ?? null;
}

export function getQuestionTimeLimit(q: Question): number {
  const visualText = visualToText(q.visual);
  const optionsText = q.options.map((o) => o.label).join(" ");
  const totalChars = q.prompt.length + visualText.length + optionsText.length;

  // Reading time: ~22 chars/sec
  const readingSec = totalChars / 22;
  // Comprehension + decision buffer
  const comprehensionSec = 4;
  // Difficulty bump: easy +0, medium +2, hard +4
  const diffBump = q.difficulty === "easy" ? 0 : q.difficulty === "medium" ? 2 : 4;

  const raw = readingSec + comprehensionSec + diffBump;

  // Clamp 8 .. 30 seconds (round to whole seconds, +20% safety margin)
  const withMargin = raw * 1.2;
  return Math.max(8, Math.min(30, Math.round(withMargin)));
}

function visualToText(v?: Visual): string {
  if (!v) return "";
  switch (v.kind) {
    case "sms":
      return `${v.sender} ${v.body} ${v.link ?? ""}`;
    case "email":
      return `${v.from} ${v.fromEmail} ${v.subject} ${v.body} ${v.cta ?? ""}`;
    case "url":
      return v.url;
    case "instagram":
      return `${v.account} ${v.body} ${v.cta ?? ""} ${v.price ?? ""}`;
    case "listing":
      return `${v.site} ${v.title} ${v.price} ${v.location ?? ""} ${v.description}`;
    case "call":
      return `${v.caller} ${v.number} ${v.hint ?? ""}`;
    case "text":
      return `${v.label} ${v.body}`;
  }
}
