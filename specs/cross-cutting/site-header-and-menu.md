# Site Header and Responsive Navigation Menu

## Application Overview

SiteHeader is a sticky, full-width header rendered in __root.tsx and therefore visible on every route of the subenai application. It provides two responsive layouts: a desktop variant (md+, ≥768px) with inline nav links and a CTA pill, and a mobile variant (below md, <768px) with a hamburger trigger that opens a Radix Sheet from the right. Active-link highlighting uses most-specific-match-wins logic. The mobile Sheet auto-closes when the router pathname changes via a useEffect dependency on pathname.

## Test Scenarios

### 1. Happy paths — desktop nav

**Seed:** ``

### TC-01: Všetky štyri navigačné odkazy sú viditeľné a funkčné na desktopovom viewporte

**File:** `tests/site-header/happy-path.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 1280×800.
    - expect: Header obsahuje nav element s aria-label="Hlavná navigácia".
  2. Skontroluj prítomnosť štyroch nav odkazov v hlavnej navigácii.
    - expect: Link s textom "Testy" s href="/testy" je viditeľný.
    - expect: Link s textom "Školenia" s href="/skolenia" je viditeľný.
    - expect: Link s textom "Podporiť projekt" s href="/podpora" je viditeľný.
    - expect: Link s textom "Kontakt" s href="/kontakt" je viditeľný.
  3. Klikni na link "Testy".
    - expect: URL sa zmení na /testy.
    - expect: Stránka sa načíta bez 404.
  4. Klikni na link "Školenia".
    - expect: URL sa zmení na /skolenia.
  5. Klikni na link "Podporiť projekt".
    - expect: URL sa zmení na /podpora.
  6. Klikni na link "Kontakt".
    - expect: URL sa zmení na /kontakt.

### TC-02: Logo odkazuje na domovskú stránku na každej route

**File:** `tests/site-header/happy-path.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/testy s viewportom 1280×800.
    - expect: Stránka /testy sa načíta úspešne.
  2. Klikni na logo odkaz s aria-label="subenai — domov" v headeri.
    - expect: URL sa zmení na /.
    - expect: Domovská stránka sa zobrazí.
  3. Zopakuj na /skolenia — otvor stránku, klikni logo.
    - expect: URL sa vráti na /.

### TC-03: CTA pill naviguje na /test a zobrazuje správny text podľa viewportu

**File:** `tests/site-header/happy-path.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 1280×800 (lg+).
    - expect: CTA pill má aria-label="Spustiť rýchly test".
    - expect: Viditeľný text CTA obsahuje slovo "rýchly" (span.hidden.lg:inline je zobrazený).
  2. Zmeň viewport na 900×700 (md, pod lg breakpointom 1024px).
    - expect: CTA pill zobrazuje len "Spustiť test →" (span s "rýchly" je skrytý).
    - expect: aria-label zostáva "Spustiť rýchly test".
  3. Klikni na CTA pill.
    - expect: URL sa zmení na /test.
    - expect: Stránka testu sa načíta.

### TC-04: Mobilný hamburger otvára Sheet a zobrazuje všetky navigačné položky

**File:** `tests/site-header/happy-path.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: Desktop nav (div.md:flex) nie je viditeľný.
    - expect: Tlačidlo s aria-label="Otvoriť menu" je viditeľné v headeri.
  2. Klikni na tlačidlo "Otvoriť menu".
    - expect: Radix Sheet sa otvorí z pravej strany.
    - expect: Sheet obsahuje tlačidlo s aria-label="Zavrieť menu".
    - expect: Sheet obsahuje logo odkaz s aria-label="subenai — domov".
    - expect: Sheet obsahuje linky: "Testy", "Školenia", "Podporiť projekt", "Kontakt" ako vertikálny zoznam.
    - expect: Sheet obsahuje CTA link s aria-label="Spustiť rýchly test" a textom "Spustiť test" v dolnej časti.
  3. Klikni na tlačidlo "Zavrieť menu".
    - expect: Sheet sa zavrie.
    - expect: Tlačidlo "Otvoriť menu" je opäť dostupné.

### TC-05: Kliknutie na nav link v Sheet naviguje na správnu route a Sheet sa automaticky zatvorí

**File:** `tests/site-header/happy-path.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: Stránka sa načíta na /.
  2. Klikni na tlačidlo "Otvoriť menu" a počkaj kým sa Sheet otvorí.
    - expect: Sheet je viditeľný a obsahuje nav linky.
  3. Klikni na link "Testy" vo Sheet.
    - expect: URL sa zmení na /testy.
    - expect: Sheet sa automaticky zatvorí (tlačidlo "Zavrieť menu" nie je viditeľné).
    - expect: Tlačidlo "Otvoriť menu" je opäť dostupné v headeri.

### TC-06: Aktívna route je zvýraznená na desktopovom nav

**File:** `tests/site-header/happy-path.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/testy s viewportom 1280×800.
    - expect: Link "Testy" má class obsahujúci "text-foreground" ale nie "text-muted-foreground" (aktívny stav).
  2. Skontroluj ostatné nav linky ("Školenia", "Podporiť projekt", "Kontakt").
    - expect: Každý neaktívny link má class obsahujúci "text-muted-foreground" a neobsahuje len "text-foreground" bez muted variantu.

### 2. Happy paths — aktívny link a nested routes

**Seed:** ``

### TC-07: Nested route /testy/eshop zvýrazňuje len položku "Testy", nie iné položky

**File:** `tests/site-header/active-link.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/testy/eshop s viewportom 1280×800.
    - expect: Stránka sa načíta (alebo zobrazí 404 ak neexistuje, ale header je stále prítomný).
  2. Skontroluj triedu nav linku "Testy".
    - expect: Link "Testy" má class "text-foreground" bez "text-muted-foreground" — je označený ako aktívny.
  3. Skontroluj triedy nav linkov "Školenia", "Podporiť projekt", "Kontakt".
    - expect: Každý z týchto linkov má class "text-muted-foreground" — nie sú aktívne.

### TC-08: Aktívna route je zvýraznená v mobile Sheet

**File:** `tests/site-header/active-link.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/skolenia s viewportom 375×667.
    - expect: Stránka /skolenia sa načíta.
  2. Klikni na tlačidlo "Otvoriť menu".
    - expect: Sheet sa otvorí.
  3. Skontroluj class nav linku "Školenia" v Sheet.
    - expect: Link "Školenia" má class obsahujúci "bg-primary/10" a "text-foreground" (aktívny stav v Sheet).
  4. Skontroluj ostatné linky v Sheet.
    - expect: Linky "Testy", "Podporiť projekt", "Kontakt" majú class "text-muted-foreground" a nemajú "bg-primary/10".

### 3. Negative scenarios

**Seed:** ``

### TC-09: Hamburger button nie je viditeľný na desktopovom viewporte (md+)

**File:** `tests/site-header/negative.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 1280×800.
    - expect: Tlačidlo s aria-label="Otvoriť menu" má CSS class "md:hidden" a nie je viditeľné (display: none alebo visibility skrytá).
  2. Skontroluj že desktop nav div (class obsahujúci "hidden md:flex") je viditeľný.
    - expect: Nav linky a CTA pill sú priamo viditeľné bez potreby otvoriť Sheet.

### TC-10: Desktop nav nie je viditeľný na mobilnom viewporte (pod md)

**File:** `tests/site-header/negative.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: Desktop nav div (class "hidden md:flex") nie je viditeľný.
  2. Skontroluj že nav linky "Testy", "Školenia", "Podporiť projekt", "Kontakt" nie sú priamo prístupné v strome mimo Sheet.
    - expect: Tieto linky sú dostupné len cez Sheet (sú v DOM ale v skrytom paneli alebo neexistujú mimo Sheetu).

### TC-11: Stránka na neexistujúcej route stále zobrazuje header so všetkými nav linkami

**File:** `tests/site-header/negative.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/neexistujuca-stranka s viewportom 1280×800.
    - expect: Stránka sa načíta (pravdepodobne s 404 obsahom alebo fallback layoutom).
  2. Skontroluj prítomnosť headera.
    - expect: Element <header> s navigation aria-label="Hlavná navigácia" je prítomný.
    - expect: Všetky štyri nav linky sú viditeľné.
    - expect: CTA pill je viditeľný.
    - expect: Žiadny z nav linkov nemá aktívny stav (class "text-foreground" bez "text-muted-foreground") pre danú neregistrovanú route.

### TC-12: Opakované otváranie a zatváranie Sheet na mobile nespôsobuje chyby

**File:** `tests/site-header/negative.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: Stránka sa načíta.
  2. Klikni "Otvoriť menu", počkaj 300ms, klikni "Zavrieť menu". Zopakuj 5-krát.
    - expect: Každý cyklus otvorí a zatvorí Sheet bez chýb v console.
    - expect: Po 5 cykloch je tlačidlo "Otvoriť menu" stále funkčné.
    - expect: Žiadne memory leak ani duplicitné event listenery v console.

### TC-13: Route /test nezobrazuje nav link "Spustiť test" ako aktívny (CTA nie je v NAV_ITEMS)

**File:** `tests/site-header/negative.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/test s viewportom 1280×800.
    - expect: Stránka testu sa načíta.
  2. Skontroluj všetky štyri nav linky ("Testy", "Školenia", "Podporiť projekt", "Kontakt").
    - expect: Žiadny z týchto linkov nemá aktívny stav — všetky majú class "text-muted-foreground".
    - expect: CTA pill (/test) je oddelený od NAV_ITEMS a nepoužíva active-link logiku.

### 4. Edge cases — viewport

**Seed:** ``

### TC-14: Na breakpointe 768px sa prepína na desktop nav a hamburger zmizne

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 767×700 (tesne pod md breakpointom).
    - expect: Hamburger button "Otvoriť menu" je viditeľný.
    - expect: Desktop nav nie je viditeľný.
  2. Zmeň viewport na 768×700 (presne na md breakpointe).
    - expect: Desktop nav (md:flex) je teraz viditeľný s nav linkami a CTA pillom.
    - expect: Hamburger button nie je viditeľný.

### TC-15: Na viewporte 375×667 (iPhone SE) header nepresahuje šírku viewportu a CTA v Sheet je viditeľné

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: document.body.scrollWidth nie je väčší ako 375px (žiadny horizontálny scroll).
  2. Klikni "Otvoriť menu".
    - expect: Sheet sa zobrazí.
    - expect: CTA link v dolnej časti Sheet je viditeľný bez potreby scrollovania.

### 5. Edge cases — prístupnosť (accessibility)

**Seed:** ``

### TC-16: Klávesnicová navigácia na desktope prechádza cez logo, nav linky a CTA pill v správnom poradí

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 1280×800. Klikni do tela stránky pre presun fokusu.
    - expect: Stránka má fokus niekde v body.
  2. Stlač Tab niekoľkokrát a sleduj poradie fokusu v headeri.
    - expect: Fokus prechádza cez: logo odkaz "subenai — domov", potom "Testy", "Školenia", "Podporiť projekt", "Kontakt", potom CTA pill "Spustiť rýchly test".
    - expect: Každý prvok pri fokuse má viditeľný focus ring (outline alebo box-shadow).

### TC-17: Fokus je zachytený v Sheet počas jeho otvorenia na mobile (focus trap)

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: Stránka sa načíta.
  2. Klikni "Otvoriť menu".
    - expect: Sheet sa otvorí. Fokus sa presunie do obsahu Sheetu (Radix Dialog/Sheet implementuje focus trap).
  3. Stlačuj Tab opakovane.
    - expect: Fokus cyklí v rámci Sheet: logo link → nav linky → CTA link → Zavrieť menu tlačidlo → späť na prvok v Sheet.
    - expect: Fokus neopúšťa Sheet a nevracia sa na obsah pozadia.
  4. Stlač Escape.
    - expect: Sheet sa zatvorí.
    - expect: Fokus sa vráti na tlačidlo "Otvoriť menu".

### TC-18: aria-label a aria-current atribúty sú správne nastavené pre screen readery

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/testy s viewportom 1280×800.
    - expect: nav element má aria-label="Hlavná navigácia".
    - expect: Logo link má aria-label="subenai — domov".
    - expect: Logo img má alt="subenai".
    - expect: Menu ikona img má aria-hidden="true".
    - expect: CTA pill má aria-label="Spustiť rýchly test".
    - expect: Šípka span vo vnútri linkov má aria-hidden="true".
  2. Skontroluj aria-current na aktívnom linku (ak je implementovaný TanStack Routerom).
    - expect: TanStack Router pridáva class "active" na aktívny link. Ak je prítomný aj aria-current="page", je nastavený len na aktívnom linku.

### 6. Edge cases — state desync a back/forward navigácia

**Seed:** ``

### TC-19: Tlačidlo Späť prehliadača po navigácii cez Sheet neponechá Sheet otvorený

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: Stránka sa načíta.
  2. Klikni "Otvoriť menu", potom klikni na link "Testy".
    - expect: URL sa zmení na /testy.
    - expect: Sheet sa automaticky zatvorí.
  3. Klikni tlačidlo Späť prehliadača (browser back).
    - expect: URL sa vráti na /.
    - expect: Sheet zostáva zatvorený (open state je false).
    - expect: Hamburger button "Otvoriť menu" je prístupný a funkčný.

### TC-20: Hash navigácia (napr. /#sekcia) neponechá Sheet otvorený

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: Stránka sa načíta.
  2. Klikni "Otvoriť menu".
    - expect: Sheet sa otvorí.
  3. Programaticky nastav window.location.hash = '#casty-otazky' pomocou JavaScript (simulácia in-page hash navigácie).
    - expect: Pathname sa nezmení, ale hash zmena môže alebo nemusí triggernúť useEffect (záleží na implementácii — TanStack Router pathname nezahŕňa hash).
    - expect: Ak Sheet zostane otvorený, je to akceptovateľné správanie; ak sa zatvorí, tiež akceptovateľné.

### 7. Edge cases — browserové kverky a sticky header

**Seed:** ``

### TC-21: Sticky header zostáva viditeľný pri scrollovaní na dlhej stránke

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 1280×800 (domovská stránka je dlhá).
    - expect: Header je viditeľný na vrchu stránky.
  2. Scrolluj na koniec stránky (page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))).
    - expect: Header zostáva viditeľný v hornej časti viewportu (position: sticky; top: 0).
    - expect: Header má z-index: 40 (class z-40) a nie je prekrytý iným obsahom.
    - expect: Backdrop blur efekt je aplikovaný (viditeľný polotransparentný pozadie).

### TC-22: Na viewporte 375px šírka Sheet nepresahuje šírku obrazovky

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/ s viewportom 375×667.
    - expect: Stránka sa načíta bez horizontálneho scrollu.
  2. Klikni "Otvoriť menu".
    - expect: Sheet sa otvorí.
    - expect: Sheet má class "w-screen max-w-full" — zaberá celú šírku viewportu.
    - expect: Žiadny horizontálny overflow (document.body.scrollWidth ≤ 375).

### 8. Edge cases — i18n a path matching

**Seed:** ``

### TC-23: Active-link logika neoznačí nesprávny link pri podobných prefixoch routes

**File:** `tests/site-header/edge-cases.spec.ts`

**Steps:**
  1. Otvor http://localhost:8080/skolenia s viewportom 1280×800.
    - expect: Stránka /skolenia sa načíta.
  2. Skontroluj aktívny stav nav linkov.
    - expect: Link "Školenia" je aktívny (text-foreground).
    - expect: Link "Testy" nie je aktívny — /testy nie je prefix /skolenia.
    - expect: "Podporiť projekt" a "Kontakt" nie sú aktívne.
  3. Otvor http://localhost:8080/skolenia/nejakySlug.
    - expect: Link "Školenia" je aktívny (most-specific-match: /skolenia je prefix /skolenia/nejakySlug).
    - expect: Žiadny iný link nie je aktívny.
