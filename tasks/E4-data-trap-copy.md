# E4 — Data-trap: copy & taxonómia citlivých polí

> **Status:** návrh na schválenie · vytvorené 2026-04-26 · súčasť
> [E4.1 story](./stories/E4.1-data-trap-copy-and-taxonomy.md)

Tento dokument je **single source of truth** pre E4.2 (komponent
`<TrapDialog />`) a E4.3 (integrácia do `ResultsView`). Všetky
warning texty + detekčné patterny + sensitivity klasifikácia musia
ostať v jednom súbore — ak sa zmení tón na jednom poli, treba
prepočítať konzistenciu cez celý zoznam.

**Prísna pripomienka:** TrapDialog NIKDY neperzistuje hodnoty.
Všetko žije v `useState` a umiera so zatvorením tabu. Žiadny
Supabase write, žiadny localStorage, žiadny analytics event s
hodnotou poľa. Výnimkou sú aggregátne **anonymné** events typu
`trap_warning_shown` (kategória poľa, nie obsah) — gated cez
analytics consent.

---

## Tone-of-voice (5 bodov)

1. **Prísny ale nie posmešný.** Popisujeme reálne riziko, nie
   chybu používateľa. Žiadne "ha-ha, naletel/a si!".
2. **Empatický gate.** Otvorenie warningu má znieť ako "máš
   šťastie že si si to vyskúšal/a u nás, nie u podvodníka" —
   užívateľ má odísť poučený, nie zahanbený.
3. **Tykáme.** Celá appka tyká (matchne consent dialog, share
   text, review feedback). Vykanie len v právnych textoch
   (`/privacy`, `/cookies`).
4. **Faktický popis dôsledku.** Čo presne sa môže stať pri
   reálnom úniku — bez "možno", bez "často", bez "trestné" (to
   nie vždy je pravda). Sourcing: SK-CERT, dataprotection.gov.sk,
   ECB/Visa fraud reporty.
5. **Akčné odporúčanie na konci.** Vždy 1 konkrétna rada — kam
   sa ten údaj bezpečne zadáva, alebo ako to overiť.

Žiadne anglické výrazy bez slovenského prekladu pri prvom výskyte
(napr. "OTP (jednorazový kód zo SMS)") — nestratíme dosah na
seniorov a netechnické publikum.

---

## Sensitivity taxonómia

Drives vizuálnu intenzitu warning boxu (border + ikona + krátky
chip v hlavičke). Hodnota = primárny dôsledok pri reálnom úniku.

| Level | Vizuál | Príklady dôsledkov |
|---|---|---|
| **kritická** | `border-destructive`, 🚨 ikona, "KRITICKÉ" chip | okamžitá finančná škoda alebo identity theft (RČ, karta+CVV, heslo, OTP) |
| **vysoká** | `border-warning`, ⚠️ ikona, "VYSOKÉ" chip | sekundárny útok / phishing-vector (IBAN, plná adresa, email+heslo dvojica) |
| **stredná** | `border-muted-foreground/50`, ℹ️ ikona, "STREDNÉ" chip | nepríjemné ale nie zničujúce (samostatný email bez hesla, telefón) |

---

## Tabuľka polí (8 položiek)

Každé pole má **detekčný pattern** (regex alebo predicate JS) +
**3 negative test patterns** (vstupy ktoré by NEMALI trigger
warning, kvôli false-positive prevention).

### 1. `birth_number` — Rodné číslo (kritická 🚨)

| Vec | Hodnota |
|---|---|
| **Label v UI** | "Rodné číslo" |
| **Input type** | `text` |
| **Pattern** | `^\s*\d{6}\s*\/?\s*\d{3,4}\s*$` (po trim) |
| **Trigger condition** | Pattern match **AND** label/placeholder obsahuje `rodné`, `RČ`, `birth` |
| **Negative tests** | `123456` (too short), `06.04.2026` (date), `0901 234 567` (telefón) |
| **Title** | 🚨 Rodné číslo si práve dal/a niekomu cudziemu |
| **Body** | Toto je jeden z najcitlivejších údajov v SR. Patrí len banke, štátu a zamestnávateľovi — stačí zopár ďalších údajov a útočník si môže v tvojom mene zobrať pôžičku alebo otvoriť účet. Nikdy ho nezadávaj do náhodných formulárov, ani do "ankety o výhre". |

### 2. `card_number` — Číslo platobnej karty (kritická 🚨)

| Vec | Hodnota |
|---|---|
| **Label v UI** | "Číslo karty" |
| **Input type** | `text` (autocomplete=off) |
| **Pattern** | 13–19 číslic po odstránení medzier/pomlčiek **AND** Luhn checksum prejde |
| **Trigger condition** | Pattern match — žiadny label gate, Luhn je dostatočne presný |
| **Negative tests** | `1234 5678 9012 3456` (Luhn fail), `4111 1111 1111 1111` (Visa test, ale Luhn ✓ — záleží či akceptujeme test čísla; lepšie je `0000 0000 0000 0000` Luhn fail), `IBAN SK89 1100 0000 0026 1700 4334` (IBAN, žiadny Luhn match v 13-19 digit window) |
| **Title** | 💳 Číslo karty + tvoje meno = okamžitý risk |
| **Body** | Aj bez CVV existujú obchody (najmä mimo EU) ktoré platbu schvália len s číslom karty a expirom. Banka ti to refundne, ale niekedy o dni neskôr — a medzitým máš zablokovanú kartu. Zadávaj ho len cez oficiálne platobné brány s `https://` a logom 3-D Secure. |

### 3. `card_cvv` — CVV / CVC (kritická 🚨)

| Vec | Hodnota |
|---|---|
| **Label v UI** | "CVV" / "CVC" / "Kontrolné číslo karty" |
| **Input type** | `text` (3-4 znaky) |
| **Pattern** | `^\d{3,4}$` |
| **Trigger condition** | Pattern match **AND** label obsahuje `CVV \| CVC \| kontrolné` **OR** v rovnakom formulári je už detekovaný `card_number` |
| **Negative tests** | `2026` (rok narodenia / expir), `0901` (predčíslie telefónu), `200` (suma EUR) |
| **Title** | 🔐 CVV — len pri reálnej platbe |
| **Body** | CVV (3-4 znakov na zadnej strane karty) je posledná vrstva ochrany. Žiadny obchod ho legálne neukladá, takže ak ho pýta inde než na finálnej platobnej obrazovke (často s logom Visa Secure / Mastercard ID Check), je to podvod. Vždy. |

### 4. `iban` — Bankový účet (vysoká ⚠️)

| Vec | Hodnota |
|---|---|
| **Label v UI** | "IBAN" / "Číslo účtu" |
| **Input type** | `text` |
| **Pattern** | `^[A-Z]{2}\d{2}[A-Z0-9 ]{11,30}$` (po normalizácii medzier) — primárne `SK\d{22}` a `CZ\d{22}` |
| **Trigger condition** | Pattern match (countrysuffix-agnostic v rámci EU) |
| **Negative tests** | `SK1234` (krátky), `0901 234 567 89` (telefón s SK predvoľbou), `2026-04-26` (dátum) |
| **Title** | 🏦 IBAN je verejnejší než si myslíš — ale pozor na kontext |
| **Body** | IBAN sa pýta každá faktúra a v EU je to bežný údaj. Nebezpečie nastáva keď ho dáš spolu s menom + adresou + telefónom — to je súbor na phishing-on-banku ("dobrý deň, volám z VÚB ohľadom transakcie na účte SKxx..."). Sám o sebe nie je likvidný, ale slúži ako kotva pre cielený útok. |

### 5. `password` — Heslo k inej službe (kritická 🚨)

| Vec | Hodnota |
|---|---|
| **Label v UI** | "Heslo" / "Tvoje heslo z X" |
| **Input type** | `password` |
| **Pattern** | `value.length > 0` |
| **Trigger condition** | Akékoľvek non-empty heslo do password fieldu **mimo** našej vlastnej registrácie/loginu (kontextové: tento testík nemá login, takže každé `<input type="password">` je trap) |
| **Negative tests** | `""` (prázdne), `password` autofill (možno ignorovať ak browser vyplnil), test prostredie — admini si testujú |
| **Title** | 🔓 Heslo si práve dal/a do náhodného formulára |
| **Body** | Heslo by sa nikdy nemalo opúšťať pole `<input type="password">` na overenej doméne (banka, e-shop, work email). Ak ho znova použiješ inde — a väčšina ľudí to robí — útočník vyskúša rovnaký pár emailu+hesla na 50 najpopulárnejších stránkach (credential stuffing) a niekde sa trafí. Použi password manager (Bitwarden, 1Password, Apple Keychain). |

### 6. `otp_code` — OTP / Verifikačný kód (kritická 🚨)

| Vec | Hodnota |
|---|---|
| **Label v UI** | "OTP" / "Kód zo SMS" / "Verifikačný kód" |
| **Input type** | `text` (4-8 číslic) |
| **Pattern** | `^\d{4,8}$` |
| **Trigger condition** | Pattern match **AND** label obsahuje `OTP \| kód \| verifikác \| 2FA \| 2-faktor` |
| **Negative tests** | `2026` (rok), `1234` (PIN-like ale label mimo trigger zoznamu), `12345` (krátky kód do hry) |
| **Title** | 📱 OTP kód = živý kľúč k účtu |
| **Body** | OTP (jednorazový kód zo SMS alebo authenticator appky) je živý kľúč k tvojej banke alebo emailu. Funguje 30-60 sekúnd a útočník presne tento čas má, kým ťa drží na linke ("dobrý deň, volá vám VÚB, treba overiť transakciu"). Žiadna banka, ani Microsoft, ani Slovak Telekom **nikdy** nepýtajú OTP — ani telefonicky, ani v emaili, ani vo formulári mimo vlastnej appky. |

### 7. `address_full` — Plná adresa (vysoká ⚠️)

| Vec | Hodnota |
|---|---|
| **Label v UI** | "Adresa" / "Plná adresa" / "Doručovacia adresa" |
| **Input type** | `text` |
| **Pattern** | obsahuje **ulica + číslo + PSČ** — heuristika: aspoň 1 slovo + číslo + 5-miestne PSČ (`\b\d{5}\b`) |
| **Trigger condition** | Pattern match **AND** dĺžka > 15 znakov |
| **Negative tests** | `Bratislava` (samostatné mesto, žiadne číslo + PSČ), `Hlavná 5` (žiadne PSČ), `2026 Bratislava` (rok + mesto, no street) |
| **Title** | 📬 Plná adresa = mapa pre stalking aj balíkový podvod |
| **Body** | Plná adresa (ulica + číslo + PSČ + mesto) prepojená s tvojím menom alebo telefónom otvára 3 typy útokov: (1) podvodný "doručovateľ" ti zazvoní s falošným balíkom za €1.99, (2) cielený phishing "vaša zásielka X je zadržaná na pošte Y" sa stáva uveriteľným, (3) v zriedkavom prípade aj fyzické riziká. Pre balíkový shop stačí adresa pri checkout-e, nie do náhodných ankiet. |

### 8. `email_password_pair` — E-mail + heslo (kritická 🚨)

| Vec | Hodnota |
|---|---|
| **Label v UI** | dve polia: "E-mail" + "Heslo" |
| **Input type** | dual: `email` + `password` |
| **Pattern** | oba filled v rámci rovnakého submitu / TrapDialogu |
| **Trigger condition** | E-mail validný formát **AND** password non-empty **AND** field labels nereferujú "vlastný účet na subenai.eu" (ktorý nemáme) |
| **Negative tests** | iba email bez hesla (single field), iba heslo bez emailu, dvojica vyplnená v reálnom auth dialógu | 
| **Title** | ⚡ E-mail + heslo = kompletný login balíček |
| **Body** | Dvojica e-mail + heslo je hlavný cieľ podvodov. Útočník ju otestuje na 50 najpopulárnejších službách (Google, Office 365, Netflix, Facebook, banka) a tam kde používaš rovnaké heslo, sa prihlási. Tomuto sa hovorí **credential stuffing** a 0,5–2 % pokusov vyjde. Riešenie: každá služba vlastné heslo (cez password manager) + 2FA na email a banku. |

---

## Visual mockup (placeholder)

Po E4.2 sa sem pridá screenshot ako warning vyzerá. Štruktúra:

```
┌─────────────────────────────────────┐
│ 🚨 KRITICKÉ                          │
│                                     │
│ Rodné číslo si práve dal/a          │
│ niekomu cudziemu                    │
│                                     │
│ Toto je jeden z najcitlivejších     │
│ údajov v SR. Patrí len banke...     │
│                                     │
│ [ Rozumiem · vrátiť sa ]            │
└─────────────────────────────────────┘
```

Akcia: jediné tlačidlo "Rozumiem" — žiadne "Ignorovať" / "Pokračovať
napriek tomu". Cieľ je vzdelávací moment, nie validačná prekážka.

---

## Aggregate analytics events (gated cez consent)

E4.2 môže firovať tieto events cez `track()` helper, **iba** keď
`isAllowed("analytics") === true`:

```ts
track(consent, {
  name: "trap_warning_shown",
  category: "analytics",
  properties: {
    field_id: "card_number",   // enum z tejto tabuľky
    sensitivity: "kritická",   // enum
    // NIKDY: hodnota poľa, prefix/suffix, dĺžka stringu, hash hodnoty
  },
});
```

Drift gate test (E4.2): `field_id` v event payloade musí byť member
field zoznamu z tohto súboru. Ak sa pridá nové pole, treba updatnúť
oboje (TS const v `src/lib/quiz/trap-fields.ts` + tento doc).

---

## Závislosti & otvorené otázky

- **Po schválení tohto docu** → E4.2 môže začať implementovať
  `<TrapDialog />` ako čistú UI shell + per-field validátory
  podľa pattern column.
- Otvorené: ako presne integrovať so Supabase post-test surveyom
  bez toho aby sa value reálne odoslala — zodpoviem v rámci E4.3
  (integrácia).
- Otvorené: či warning má aj export formy ("Toto je vzdelávací
  popup, žiadne dáta sa neukladajú") priamo v body-čke. Návrh:
  pridať to do **footera dialógu**, nie do textu warningu — tam
  sa stratí.

---

## Schválenie

- [ ] **PO (Lubo) reviewed:** ___ (dátum + komentár)
- [ ] **Tone konzistentný cez všetky polia:** áno / nie / treba úpravu
- [ ] **Faktická presnosť každého body textu overená:** áno / nie
- [ ] **Žiadne defamačné formulácie:** áno / nie
