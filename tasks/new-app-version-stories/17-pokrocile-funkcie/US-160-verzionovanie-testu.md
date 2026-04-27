# US-160 – Autor spravuje verzie testu

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-160                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Pokročilé funkcie                 |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **mať možnosť vytvoriť novú verziu testu bez straty historických dát**
> aby som **mohol aktualizovať otázky alebo nastavenia a zároveň zachovať porovnateľnosť výsledkov**.

---

## Kontext

Testy sa v čase menia – otázky sa opravujú, pridávajú nové, menia váhy. Bez
verzionovania históriu respondentov nie je možné správne interpretovať (iná verzia
testu → iné výsledky). Verzionanový systém zabezpečí, že každý attempt je viazaný
na konkrétnu verziu definície testu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Každý test má atribút `version INTEGER NOT NULL DEFAULT 1` a tabuľku `test_versions(id, test_id, version, definition JSONB, created_at, is_active BOOLEAN)`.
- [ ] **AC-2:** Autor môže „Vypublikovať novú verziu" z edit stránky testu. Pri publikovaní sa aktívna verzia zmení, predošlá sa archivuje (is_active = FALSE, ale dáta ostávajú).
- [ ] **AC-3:** Nové attempts (respondenti) vždy dostanú aktuálnu aktívnu verziu. Existujúce attempts ostávajú viazané na verziu, v ktorej boli vyplnené.
- [ ] **AC-4:** V admin dashboarde sú výsledky respondentov označené verziou (napr. „v1", „v2"). Porovnanie medzi verziami je vizuálne rozlíšené.
- [ ] **AC-5:** Autor môže zobraziť diff medzi dvoma verziami (added/removed/changed otázky, changed settings) v prehľadnom diff UI.
- [ ] **AC-6:** Draft verzia (US-161) nie je verejná – respondenti vidia vždy len aktívnu (published) verziu.
- [ ] **AC-7:** Maximálny počet verzií per test: 10. Pri dosiahnutí limitu autor musí manuálne archivovať/vymazať staré verzie.
- [ ] **AC-8:** JSON export (US-133) zahŕňa `version_id` per attempt.

---

## Technické poznámky

```sql
CREATE TABLE test_versions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  version      INTEGER NOT NULL,
  definition   JSONB NOT NULL,
  is_active    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, version)
);

-- attempts.test_version_id FK na test_versions(id)
ALTER TABLE attempts ADD COLUMN test_version_id UUID REFERENCES test_versions(id);
```

- Diff UI: simple custom diff cez deep-equal comparison `definition` JSONB objektov (knižnica `fast-json-patch` alebo vlastná implementácia).

---

## Edge Cases

- Autor publikuje novú verziu kým respondent práve vypĺňa test: respondent dokončí test v starej verzii (jeho `test_version_id` je immutable).
- Test dosiahol 10 verzií: UI blokuje ďalšie publikovanie a zobrazí správu s odkazom na správu verzií.
- Mazanie starej verzie: povolené len ak na ňu nie sú naviazané žiadne attempts.

---

## Závislosti

- Závisí na: US-010–013 (definícia testu), US-080 (attempt flow)
- Blokuje: US-161 (draft verzie buildujú na tomto systéme)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: attempt vždy dostane aktívnu verziu, limit 10 verzií
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
