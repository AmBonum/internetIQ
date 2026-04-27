# US-031 – Každá otázka má štruktúrované metadata

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-031                           |
| **Priorita** | P0                           |
| **Stav** | Draft                            |
| **Feature** | Správa otázok                |
| **Rola** | Správca systému / platforma      |

---

## User Story

> Ako **správca platformy**
> chcem **ku každej otázke priradiť štruktúrované metadata**
> aby som **umožnil autorom efektívne filtrovanie, systému kontextové odporúčania a audítorom sledovanie kvality obsahu**.

---

## Kontext

Metadata otázok sú základom pre filtrovacie funkcie (US-023), odporúčacie systémy
a reporting. Musia byť konzistentné, normalizované a škálovateľné na rast knižnice.

---

## Akceptačné kritériá

- [ ] **AC-1:** Každá otázka obsahuje tieto povinné metadata:
  - `text` – text otázky (max 1000 znakov)
  - `answer_type` – typ odpovede (enum, viď US-032)
  - `category` – primárna kategória (FK na `question_categories`)
  - `language` – jazyk otázky (ISO 639-1, min SK)
  - `status` – stav schválenia
- [ ] **AC-2:** Každá otázka môže mať tieto nepovinné metadata:
  - `tags` – pole tagov (max 10 tagov, každý max 50 znakov)
  - `difficulty` – obtiažnosť: `easy | medium | hard`
  - `target_audience` – pole cieľových skupín (FK na `target_audience_types`)
  - `recommended_org_type` – pole typov organizácií (FK na `org_types`)
  - `time_limit_seconds` – časový limit pre odpoveď (NULL = bez limitu)
  - `usage_context` – odporúčaný kontext použitia (voľný text, max 500 znakov)
  - `legal_note` – právne upozornenie (napr. pre citlivé otázky, max 300 znakov)
  - `is_sensitive` – boolean flag pre otázky na citlivé témy
- [ ] **AC-3:** `category` je hierarchická: primárna kategória → subkategória (max 2 úrovne).
- [ ] **AC-4:** Pole `tags` má normalizovanú formu: lowercase, bez medzier, pomlčka namiesto medzery (slug formát).
- [ ] **AC-5:** Zmena metadata otázky (okrem `status`) nezahájuje re-schválenie – len zmena `text` alebo `answer_type` zahájí.
- [ ] **AC-6:** Každá zmena metadata je auditovateľná: systém uchováva `(field, old_value, new_value, changed_by, changed_at)`.
- [ ] **AC-7:** `is_sensitive = true` vyžaduje vyplnenie `legal_note`; systém to validuje.

---

## Technické poznámky

- Tagy: uložiť ako `TEXT[]` v PostgreSQL (native indexovateľné).
- Array polia (`target_audience`, `recommended_org_type`): uložiť ako `UUID[]` s FK constraint cez CHECK.
- Kategória hierarchia: `question_categories(id, name, parent_id FK SELF, level INT CHECK (level <= 2))`.
- `legal_note` sa zobrazuje autorovi pri výbere otázky ako tooltip/warning badge.

---

## Edge Cases

- Tag obsahuje diakritiku: normalizovať (napr. `zákazník` → `zakaznik`) pre konzistentné filtrovanie.
- Otázka má `is_sensitive = true` ale nemá `legal_note`: blokujúca validácia pri uložení.
- Správca odstráni kategóriu, ktorá má otázky: kaskádové odobratíe kategórie je blokované; najprv presunúť otázky.

---

## Závislosti

- Závisí na: US-030 (správa knižnice)
- Blokuje: US-023 (filtrovanie), US-032 (typy odpovedí)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: validácia všetkých polí, tag normalizácia, `is_sensitive` + `legal_note` pravidlo
- [ ] DB migrácia napísaná a update DEPLOY_SETUP.sql
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
