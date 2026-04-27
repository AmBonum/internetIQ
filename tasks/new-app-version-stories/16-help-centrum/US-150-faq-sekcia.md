# US-150 – Platforma poskytuje FAQ / Q&A sekciu

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-150                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Help centrum                      |
| **Rola** | Autor testu + Respondent             |

---

## User Story

> Ako **používateľ platformy (autor aj respondent)**
> chcem **nájsť odpovede na bežné otázky v prehľadnom FAQ**
> aby som **mohol vyriešiť problém samostatne bez kontaktovania podpory**.

---

## Kontext

FAQ / Help centrum slúži ako sebasupportný kanál – znižuje agendu podpory a buduje
dôveru. Obsah je statický (nie CMS-based) v V1, udržiavaný priamo v kóde / MDX
súboroch. Je organizovaný do sekcií pre rôzne role (autori vs. respondenti).

---

## Akceptačné kritériá

- [ ] **AC-1:** Help centrum je dostupné na URL `/help`. Odkaz na `/help` je v pätičke každej stránky.
- [ ] **AC-2:** Obsah je organizovaný do kategórií: „Pre autorov testov" a „Pre respondentov", s podkategóriami (napr. Tvorba testu, Bezpečnosť, Exporty).
- [ ] **AC-3:** FAQ má rozbaľovací accordion formát (question → answer) pre prehľadnosť.
- [ ] **AC-4:** Funkčné vyhľadávanie v rámci FAQ: client-side full-text search cez titulky a obsah otázok (dostupné bez JS degraduje na statický zoznam).
- [ ] **AC-5:** Každá FAQ položka má anchor link (napr. `/help#faq-ako-exportovat-data`) pre zdieľanie konkrétnej odpovede.
- [ ] **AC-6:** Na konci každej FAQ sekcie je kontaktný formulár / email odkaz pre prípady, kde FAQ nestačí. Kontaktný email platí ako fallback.
- [ ] **AC-7:** Stránka je SSR, indexovateľná pre SEO. Každá FAQ položka má `schema.org/FAQPage` structured data markup.
- [ ] **AC-8:** Obsah FAQ je spravovaný v MDX súboroch (`src/content/help/*.mdx`) – obsah a kód oddelené.

---

## Technické poznámky

- Client-side search: `Fuse.js` alebo natívny array filter cez pre-built index (nie external search API).
- Structured data: `<script type="application/ld+json">` s `FAQPage` schema per stránka.
- Accordion: existujúci `ui/accordion` komponent (ak existuje v projekte, napr. shadcn/ui).

---

## Edge Cases

- FAQ položka neexistuje pre danú otázku: kontaktný formulár na konci každej sekcie je záchytná sieť.
- Search nenájde žiadny výsledok: „Nenašli sme odpoveď. Kontaktujte nás na [email]."

---

## Závislosti

- Závisí na: nič (independentná feature)
- Blokuje: US-151 (per-feature inline help odkazuje na FAQ položky)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Minimálne 20 FAQ položiek v obsahu (10 pre autorov, 10 pre respondentov)
- [ ] Structured data validované cez Google Rich Results Test
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
