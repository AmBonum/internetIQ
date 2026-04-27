# US-090 – Respondent prehliada históriu testov v sade

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-090                             |
| **Priorita** | P2                             |
| **Stav** | Draft                              |
| **Feature** | História respondenta            |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **vidieť prehľad všetkých testov, ktoré som vyplnil v rámci sady, vrátane výsledkov každého testu**
> aby som **mohol sledovať svôj postup naprieč sadou a porovnať výsledky z jednotlivých testov**.

---

## Kontext

História je relevantná iba pre sady testov (pack testu s 2+ testami). Pre jednoduchý
test postačuje výsledková stránka (US-082). Prístup k histórii je viazaný na
respondentskú session alebo obnovovací token; nie je trválo dostupný bez emailu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Po dokončení aspoň jedného testu v sade vidí respondent sekciu „História testov" na pack overview stránke.
- [ ] **AC-2:** História zobrazuje pre každý dokončený test: názov testu, dátum a čas dokončenia, výsledok (skóre/percentil ak dostupné), čas vyplnenia (minúty), stav (dokončený / prerušený).
- [ ] **AC-3:** Pre nedokončené testy v sade zobrazuje stav „Nezahájený" alebo „Prerušený" (z US-083) s tlačidlom „Pokračovať".
- [ ] **AC-4:** História je zoriadená chronologicky (najnovšie hore).
- [ ] **AC-5:** Respondent je informovaný, že história je dostupná iba po dobu platnosti session; pre trvalý prístup odporúčame stiahnuť výsledky (US-092).
- [ ] **AC-6:** História neobsahuje dáta iných respondentov – prísna session-based izolácia.
- [ ] **AC-7:** Pre test bez bodovaniaj zobrazí „Dokončené" bez čísselného skóre.

---

## Technické poznámky

- Query: `SELECT * FROM test_attempts WHERE pack_session_id = {sessionId} ORDER BY completed_at DESC`.
- Session izolácia: každý `pack_session_id` je unikátny per-respondent; RLS zabraňuje crossing.
- Bez trvalého účtu: história exspiruje s pack session (4 hodiny prvotnej session + 72 hodín pri resume).

---

## Edge Cases

- Respondent vyplnil test v sade dvakrát (admin resetoval attempt): história zobrazuje obe, najnovšie hore s tagom „(opakovanie)".
- Sada má iba 1 test: história nie je zobrazená (zbytočná); výsledky sú priamo na US-082.

---

## Závislosti

- Závisí na: US-081 (sada testov), US-082 (výsledky)
- Blokuje: US-091 (porovnanie výsledkov)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: session izolácia
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
