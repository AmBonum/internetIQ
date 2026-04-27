# US-212 – Super admin: správa vyplnených testov (attempts)

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-212                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Super admin konzola               |
| **Rola** | Platform admin                       |

---

## User Story

> Ako **platform admin**
> chcem **prehľad všetkých vyplnených testov naprieč platformou s možnosťou moderovania a anonymizácie**
> aby som **mohol reagovať na DSR requesty, odhalené anomálie a plniť GDPR povinnosti**.

---

## Kontext

Attempts sú primárne ochránené RLS – autor vidí len pokusy svojich testov,
respondent len vlastné pokusy. Admin potrebuje globálny read prístup
pre support, štatistiky a GDPR plnenie.

---

## Akceptačné kritériá

- [ ] **AC-1:** `/admin/attempts` zobrazuje tabuľku všetkých pokusov: Ticket, Test, Autor testu, Timestamps, Skóre, Status (completed / abandoned / flagged). Pseudonymizovaný email respondenta (prvé 3 znaky + `***@domain`).
- [ ] **AC-2:** Filtrovanie: podľa testu, autora testu, dátumového rozsahu, statusu, rozsahu skóre.
- [ ] **AC-3:** Admin môže vidieť de-pseudonymizovaný email respondenta len po zalogovaní „dôvodu prístupu" (audit gate): free-text pole + potvrdenie. Každý de-anonymizačný prístup je auditovaný.
- [ ] **AC-4:** Admin môže označiť pokus ako `flagged` (s povinným dôvodom) – flagged pokusy sú vyradené z agregovaných štatistík autorov.
- [ ] **AC-5:** Admin môže spustiť on-demand anonymizáciu pokusu (US-164 flow): respondent data odstraňované, skóre a timestampy ostávajú pre štatistiky.
- [ ] **AC-6:** Platform-wide štatistiky panel (nad tabuľkou): celkový počet pokusov, priemerný completion rate, top 10 testov podľa počtu pokusov, trend (posledných 30 dní).
- [ ] **AC-7:** Admin môže resetovať pokus (zmena statusu na `reset`) – test môže respondent vyplniť znova. Len pre testy kde autor povolil opakované vyplnenie.

---

## Technické poznámky

- Admin SELECT na `attempts` cez service role Edge Function (nie priamo Supabase client – klient nikdy nedostane service role key).
- De-anonymizačný gate logovaný do samostatnej `admin_data_access_log(admin_id, entity_type, entity_id, reason, accessed_at)` tabuľky.
- Aggregation queries pre štatistiky bežia cez materialized view `mv_platform_stats` obnovovaná `pg_cron` každú hodinu.

---

## Edge Cases

- Attempt pre zmazaný test: ostáva v DB s `test_id` null (ON DELETE SET NULL na FK). Zobrazí sa ako „[Zmazaný test]" v tabuľke.
- Admin flaguje pokus ktorý je súčasťou benchmark datasetu (US-166): upozornenie „Tento pokus je súčasťou benchmarku. Flagovanie ho vyradí z benchmark výpočtov."

---

## Závislosti

- Závisí na: US-164 (anonymizácia), US-197 (admin auth), US-143 (DSR)
- Súvisí: US-166 (benchmarking)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: pseudonymizácia render, de-anonymizácia audit log, flag filter
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
