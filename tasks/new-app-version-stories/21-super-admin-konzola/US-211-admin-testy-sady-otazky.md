# US-211 – Super admin: správa testov, sád a otázok

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-211                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Super admin konzola               |
| **Rola** | Platform admin                       |

---

## User Story

> Ako **platform admin**
> chcem **vidieť a spravovať všetky testy, sady testov a otázky naprieč celou platformou**
> aby som **mohol moderovať obsah, riešiť porušenia pravidiel a udržiavať kvalitu knižnice**.

---

## Kontext

Autori vedia spravovať len vlastný obsah (US-196). Platform admin potrebuje
globálny prehľad s možnosťou vypnutia, úpravy metadát a trvalého mazania
pri porušení pravidiel.

---

## Akceptačné kritériá

### Testy (`/admin/tests`)
- [ ] **AC-1:** Tabuľka všetkých testov: Názov, Autor (email), Vytvorený, # respondentov, Status (active / draft / disabled). Filtrovanie podľa autora, statusu, dátumu.
- [ ] **AC-2:** Admin môže prepnúť test medzi `active` a `disabled` (platform-level disable – nadradené nad autorovým statusom). Dôvod je povinný. Autor dostane email s odôvodnením.
- [ ] **AC-3:** Admin môže editovať metadata testu: názov, popis, viditeľnosť. Zmeny sa logujú s hodnotami `before / after`.
- [ ] **AC-4:** Admin môže trv alo vymazať test (soft-delete → `deleted_at` timestamp). Trvalé vymazanie (hard-delete) vyžaduje 2-krokové potvrdenie a je nezvratné.

### Sady testov (`/admin/test-packs`)
- [ ] **AC-5:** Tabuľka všetkých sád testov so stĺpcami: Názov, Autor, # testov v sade, # úspešných dokončení, Status. Rovnaké action set ako pre testy (disable / edit / delete).
- [ ] **AC-6:** Detail sady zobrazuje usporiadanie testov v sade a umožňuje zmenu poradia (drag-and-drop, rovnaký komponent ako autor – US-196).

### Otázky (`/admin/questions`)
- [ ] **AC-7:** Tabuľka globálnej knižnice otázok: Text (skrátený), Typ odpovede, Autor, Použitá v # testoch, Status (active / pending_review / disabled).
- [ ] **AC-8:** Admin môže schváliť (`pending_review → active`), zamiestnuť (`active → disabled`) alebo požiadať o úpravu (status `needs_revision` + povinný komentár zaslaný autorovi emailom).
- [ ] **AC-9:** Bulk akcie pre otázky: označiť viacero → disabled / delete. Bulk delete vyžaduje, aby otázky neboli použité v žiadnom aktívnom teste.

---

## Technické poznámky

- `tests.platform_disabled` boolean stĺpec (default false). RLS a query layer musia rešpektovať `platform_disabled = false` pre non-admin prístupy.
- Soft-delete: `deleted_at TIMESTAMPTZ` na `tests`, `test_packs`, `questions`. Hard-delete len admin Edge Function.
- Admin zmeny logované do `audit_log(entity_type, entity_id, action, old_value jsonb, new_value jsonb, actor_id, created_at)`.

---

## Edge Cases

- Admin deaktivuje test, ktorý je aktuálne v progrese (respondent vyplňa): test sa dokonči, nové pokusy sú zablokované.
- Bulk delete otázok kde niektoré sú v aktívnych testoch: akcia sa čiastočne vykoná (úspešné sú označené ✓, zlyhané zobrazujú dôvod „používaná v aktívnom teste").

---

## Závislosti

- Závisí na: US-030 (question library), US-196 (autor spravuje testy), US-197 (admin konzola základ)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: `platform_disabled` filter v RLS, audit log zápis, bulk delete guard
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
