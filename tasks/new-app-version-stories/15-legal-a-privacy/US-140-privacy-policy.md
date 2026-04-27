# US-140 – Platforma zverejňuje Privacy Policy

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-140                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Legal a privacy                   |
| **Rola** | Platforma / prevádzkovateľ           |

---

## User Story

> Ako **prevádzkovateľ platformy**
> chcem **mať zverejnenú aktuálnu Privacy Policy dostupnú z každej stránky**
> aby som **splnil zákonné povinnosti GDPR (čl. 13 a 14) a informoval dotknuté osoby o spracovaní ich dát**.

---

## Kontext

Privacy Policy je kľúčový právny dokument, ktorý musí byť dostupný pred akýmkoľvek
zbieraním osobných dát. Vzťahuje sa na dvoch správcov dát: (1) prevádzkovateľ
platformy (Internet IQ / koniec vlastníka) a (2) autor testu (spracovanie dát
respondentov). Dokument musí pokryť obe role (joint-controller alebo sub-processor
vzťah musí byť explicitne riešený).

---

## Akceptačné kritériá

- [ ] **AC-1:** Privacy Policy stránka je dostupná na permanentnej URL `/privacy-policy`. Redirect z `/gdpr` na `/privacy-policy`.
- [ ] **AC-2:** Odkaz na Privacy Policy je v pätičke každej stránky platformy (vrátane test landing stránok respondentov).
- [ ] **AC-3:** Dokument pokrýva minimálne tieto GDPR povinné sekcie (čl. 13): identita správcu, účely a právne základy spracovania, príjemcovia dát, doba uchovávania, práva dotknutých osôb (prístup, oprava, vymazanie, prenositeľnosť, námietka, obmedzenie), právo podať sťažnosť dozornému orgánu.
- [ ] **AC-4:** Privacy Policy má „Dátum poslednej aktualizácie" prominentne zobrazený (ISO 8601 formát). Zmena dokumentu musí byť logovaná (verzia + timestamp) v `legal_doc_versions(doc_type, version, changed_at, diff_summary)`.
- [ ] **AC-5:** Dokument je v slovenčine ako primárnom jazyku. Anglická verzia je nice-to-have v V2.
- [ ] **AC-6:** Privacy Policy stránka je SSR (server-side rendered) pre search engines a zachovanie SEO benefitov.
- [ ] **AC-7:** Odkaz na Privacy Policy je prítomný v consent baneri (US-110), v emailových komunikáciách, a v admin registračnom (US-001) procese.
- [ ] **AC-8:** Dokument explicitne uvádza informácie o sub-procesoroch (Supabase, Cloudflare, email provider): názov, krajina, účel, odkaz na ich privacy dokumenty.

---

## Technické poznámky

- Stránka je statický MDX alebo React komponent (nie CMS) – zmena vyžaduje deploy.
- `legal_doc_versions` tabuľka umožňuje audit histórie bez verejného zverejnenia (nie versioned URL pre staré verzie verejne).
- Ak `CONSENT_VERSION` bump je potrebný po zmene Privacy Policy: koordinovať s CLAUDE.md pravidlom (max 1× per epic batch).

---

## Edge Cases

- Externý link na sub-procesor Privacy Policy prestane fungovať (404): monitoring cez automated link checker každý mesiac.
- Respondent hovorí len angličtinou: slovenský dokument stačí na právne účely (SR jurisdikcia), angličtina V2.

---

## Závislosti

- Závisí na: nič (zakladací dokument)
- Blokuje: US-141 (Cookie Policy odkazuje na Privacy Policy), US-143 (DSR popis je súčasťou PP)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Legal review: dokument skontrolovaný právnikom alebo GDPR špecialistom
- [ ] Odkaz v pätičke prítomný a funkčný
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
