# US-161 – Autor pracuje s draft stavmi testu

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-161                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Pokročilé funkcie                 |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **mať možnosť uložiť rozrobenú verziu testu ako draft a publikovať ju neskôr**
> aby som **mohol postupne pracovať na teste bez okamžitého zverejnenia nedokončených zmien**.

---

## Kontext

Tvorba a úprava testu môže trvať niekoľko dní. Bez draft stavu akákoľvek neuložená
zmena sa stratí alebo sa okamžite zverejní. Draft stav zabezpečí bezpečné
pracovné prostredie pre autora.

---

## Akceptačné kritériá

- [ ] **AC-1:** Každý test (a každá verzia testu – US-160) môže byť v stave `draft` alebo `published`. Nové testy začínajú ako `draft`.
- [ ] **AC-2:** Respondenti nemajú prístup k testu v stave `draft`: custom link vráti „Test nie je dostupný" ak `status = 'draft'`.
- [ ] **AC-3:** V admin dashboarde sú draft testy vizuálne odlíšené (napr. badge „Draft") od publikovaných.
- [ ] **AC-4:** Autor môže prejsť z `draft` → `published` kliknutím na „Publikovať". Pre prechod je vyžadovaná validácia kompletnosti (všetky povinné sekcie vyplnené).
- [ ] **AC-5:** Autor môže stiahnuť publikovaný test späť do `draft` (unpublish). Existujúce attempts (respondenti, ktorí already dokončili) ostávajú zachované.
- [ ] **AC-6:** Auto-save: draft sa ukladá automaticky každých 30 sekúnd (debounced) a manuálne kliknutím „Uložiť draft". Vizuálna indikácia posledného uloženia (napr. „Uložené pred 2 min").
- [ ] **AC-7:** Rodné šablóny (US-165) sú implicitne v stave `template` – nie `draft`, nie `published`. Respondenti k nim nemajú prístup.
- [ ] **AC-8:** Expirácia stavu: draft testy bez aktivity > 90 dní dostanú email upozornenie autorovi. Po 180 dňoch bez aktivity sú automaticky archivované (nie zmazané).

---

## Technické poznámky

- `tests.status TEXT CHECK (status IN ('draft','published','archived','template'))`.
- Validácia pred publikovaním: server-side check (nie len klientská): povinné polia vyplnené, min. 1 test/otázka vybraná, GDPR polia prítomné.
- Auto-save: `PATCH /api/test/{id}/draft` s debounce na klientovi (500ms). Optimistic update UI.

---

## Edge Cases

- Autor má rozrobeného drfatu a vyprší mu session: pri ďalšom prihlásení vidí naposledy uložený draft (nie stratený stav).
- Publikovanie zlyhá validáciou: server vráti 422 s listom chybných polí; UI zobrazí inline chyby.
- Auto-save zlyhá (offline): UI zobrazí varovanie „Ukladanie zlyhalo. Skontrolujte pripojenie."

---

## Závislosti

- Závisí na: US-160 (verzionovanie – draft je neaktívna verzia)
- Blokuje: US-165 (šablóny sú typ draft testu)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: respondent access blocked pre draft, validácia pred publikovaním
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
