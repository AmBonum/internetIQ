# US-152 – Platforma ponúka onboarding sprievodcu pre nových autorov

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-152                               |
| **Priorita** | P3                               |
| **Stav** | Draft                                |
| **Feature** | Help centrum                      |
| **Rola** | Autor testu (nový používateľ)        |

---

## User Story

> Ako **nový autor testu**
> chcem **byť prevedený krok-za-krokom onboarding sprievodcom pri prvom vytváraní testu**
> aby som **rýchlo pochopil kľúčové kroky a nastavenia bez pocitu preťaženia**.

---

## Kontext

Prvý kontakt s platformou je rozhodujúci. Nový autor čelí multi-step formuláru
(intake konfigurácia → výber testov → bezpečnosť → generovanie). Bez sprievodcu
môže byť tento proces mätúci. Onboarding wizard je jednorázový: zobrazí sa len
pri prvej návšteve, potom je vypnutý.

---

## Akceptačné kritériá

- [ ] **AC-1:** Onboarding sprievodca sa zobrazí automaticky pri prvej návšteve flow vytvorenia testu (detekcia: `localStorage['onboarding_seen']` + server-side flag `tests.is_first_test`).
- [ ] **AC-2:** Sprievodca je step-by-step overlay (product tour), nie plnoobrazovkový modal. Zvýrazňuje aktuálny UI element a zobrazuje nápovedu vedľa neho.
- [ ] **AC-3:** Sprievodca pokrýva tieto kroky (minimálne):
  1. Povinné dátové polia (čo sa pýtate respondentov)
  2. Výber testov z katalógu
  3. Bezpečnostné nastavenia (heslo)
  4. Generovanie linku
- [ ] **AC-4:** Každý krok má tlačidlo „Preskočiť krok" a „Ukončiť sprievodcu". Ukončenie sprievodcu neanuluje vyplnené dáta.
- [ ] **AC-5:** Po dokončení sprievodcu sa author nezobrazuje znova (uloží sa `localStorage['onboarding_seen'] = true` + server flag).
- [ ] **AC-6:** Sprievodca je preskočiteľný celý s voľbou „Nechcem sprievodcu" (jednoznačný dismiss pre pokročilých používateľov).
- [ ] **AC-7:** Onboarding je prístupný: klávesnicou navigovateľný (Tab/Enter/Escape), má `aria-live="polite"` pre screen reader oznámenia krokov.
- [ ] **AC-8:** Sprievodca sa nevykreslí na mobilných zariadeniach < 768px (product tours nefungujú dobre na mobile) – namiesto toho sa zobrazí statická „Začíname" sekcia s odkazmi na FAQ.

---

## Technické poznámky

- Product tour knižnica: `driver.js` alebo custom lightweight implementácia (nie `intro.js` – príliš ťažké).
- Server-side flag: `tests.onboarding_completed_at TIMESTAMPTZ NULL` – NULL = nikdy nevidel, NOT NULL = viděl.
- localStorage ako client-side cache pre rýchle rozhodnutie bez server roundtrip.

---

## Edge Cases

- Autor vyčistí localStorage: sprievodca sa znova zobrazí na klientskej strane, ale server flag zabráni zmenám.
- Autor otvorí flow vo viacerých taboch: sprievodca sa zobrazí len v prvom tabe (server flag nastavený po prvom dismiss).
- Sprievodca krok odkazuje na UI element, ktorý je skrytý (napr. advanced settings sú collapsed): sprievodca ho automaticky rozbalí pred zobrazením krokovej nápovedy.

---

## Závislosti

- Závisí na: US-151 (tooltip texty sa môžu v sprievodcovi repoužiť ako obsah krokov)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Manuálny test: kompletný prvý-run + skip flow
- [ ] Klávesnicová navigácia overená
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
