# US-151 – Platforma poskytuje kontextuálnu inline pomoc

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-151                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Help centrum                      |
| **Rola** | Autor testu                          |

---

## User Story

> Ako **autor testu**
> chcem **vidieť kontextuálne nápovedy priamo pri formulárových poliach a nastaveniach**
> aby som **pochopil funkciu každého nastavenia bez odchodu z aktuálnej stránky**.

---

## Kontext

Tvorba testu je komplexný multi-step proces. Autor nemusí okamžite rozumieť
každému nastaveniu (napr. čo je retention period, čo znamená `is_sensitive` príznak
otázky). Inline help tooltip alebo expandovateľný help panel redukuje onboarding
trenie bez potreby čítať dlhú dokumentáciu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Všetky formulárové polia s nesamozrejmým názvom majú `?` ikonu vedľa labelu. Klik / hover zobrazí tooltip s vysvetlením (max 2 vety).
- [ ] **AC-2:** Komplexnejšie nastavenia (napr. sekcia „Dátové polia", sekciu „Bezpečnosť") majú rozbaľovací help panel s dlhším vysvetlením a odkazom na príslušnú FAQ položku (US-150).
- [ ] **AC-3:** Tooltip je prístupný klávesnicou (focus na `?` button → Enter / Space otvára tooltip); tooltip má `role="tooltip"` a `aria-describedby` väzbu na príslušný input.
- [ ] **AC-4:** Tooltip texty sú spravované v centralizovanom konfiguračnom súbore (`src/content/help/tooltips.ts`) – nie hardcoded inline v komponentoch.
- [ ] **AC-5:** Help texty sú v slovenčine a zrozumiteľné pre netechnických používateľov (nie SQL / API terminológia v tooltip textoch).
- [ ] **AC-6:** Tooltip sa zatvára kliknutím mimo neho (blur event) alebo stlačením Escape.
- [ ] **AC-7:** Na mobilných zariadeniach tooltip je triggerable klepnutím (nie hover-only).
- [ ] **AC-8:** Výskyt každého tooltip (ako feature usage metric) sa nezaznamenáva bez analytického súhlasu (US-110).

---

## Technické poznámky

- Tooltip komponent: existujúci `ui/tooltip` (shadcn/ui alebo ekvivalent).
- `src/content/help/tooltips.ts`: `Record<string, { title: string; body: string; faqLink?: string }>`.
- WCAG 2.1 SC 1.4.13 (Content on Hover or Focus): tooltip musí byť hoverable (hover z ikony na tooltip bez zatvorenia).

---

## Edge Cases

- Tooltip text pre pole, ktoré sa dynamicky zobrazuje (napr. podmienené pole): tooltip stále funguje aj pre podmienene zobrazené polia.
- FAQ link v help paneli smeruje na archivovanú/zrušenú FAQ položku: CI link checker (podobne ako US-141) zachytí broken internal links.

---

## Závislosti

- Závisí na: US-150 (FAQ stránka – cieľ odkazov z help panelov)
- Blokuje: US-152 (onboarding wizard môže repoužívať tooltip texty)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Tooltip texty pre všetky non-obvious polia v tvorba-testu flow (min. 15 tooltipov)
- [ ] WCAG 2.1 SC 1.4.13 splnený (testované manuálne)
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
