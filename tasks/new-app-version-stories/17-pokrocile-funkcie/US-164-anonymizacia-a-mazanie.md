# US-164 – Systém anonymizuje a maže stará dáta respondentov

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-164                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Pokročilé funkcie                 |
| **Rola** | Systém / platforma                   |

---

## User Story

> Ako **systém**
> chcem **automaticky anonymizovať alebo mazať osobné dáta respondentov po vypršaní retenčnej doby**
> aby som **splnil princíp minimalizácie dát (GDPR čl. 5(1)(e)) a obmedzenia uchovávania**.

---

## Kontext

Každý test má definovanú retenčnú dobu (nastaviteľnú autorom pri nastavení GDPR –
US-012). Po vypršaní tejto doby sú osobné dáta automaticky anonymizované alebo
zmazané. Štatistické/agregované dáta môžu zostať. Toto je automatický background
process bez nutnosti manuálneho zásahu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Test má pole `data_retention_days INTEGER NOT NULL DEFAULT 365`. Autor ho nastavuje v GDPR sekcii (US-012), min 30 dní, max 3650 dní (10 rokov).
- [ ] **AC-2:** Automatická rutina (pg_cron, každú noc o 03:00 UTC) anonymizuje attempts kde `completed_at < now() - INTERVAL '{retention_days} days'`:
  - Intake PII polia (`respondent_email`, `respondent_name`, custom PII polia) → NULL
  - Odpovede na `is_sensitive = TRUE` otázky → NULL
  - `attempt_events.metadata` → NULL (AC-8 US-111 – tieto sú prefiltrované skôr)
  - `ip_hash` → NULL
- [ ] **AC-3:** Agregované metriky (skóre, completion time, anonymized counts) **zostávajú** po anonymizácii – len PII a citlivé odpovede sa nullejú.
- [ ] **AC-4:** Každá anonymizácia sa zaznamená v `audit_log` (US-163): `action = 'auto_anonymization'`, `resource_id = attempt_id`, `actor_type = 'system'`.
- [ ] **AC-5:** Autor dostane email 7 dní pred začiatkom prvej vlny anonymizácii (napr. „30 respondentov bude anonymizovaných dňa X"). Informačný email, nie opt-out (retenčná doba je právna povinnosť).
- [ ] **AC-6:** Archivovaný test si zachová anonymizované dáta indefinitívne (pre historické štatistiky) – nie je zmazaný celý test.
- [ ] **AC-7:** Manuálne okamžité zmazanie respondenta (admin akcia z US-102): maže PII okamžite, bez čakania na cron job.
- [ ] **AC-8:** Hard-delete `attempts` záznamu je možný **len** cez DSR výmaz (US-143) alebo manuálne admin zmazanie. Automatická rutina len anonymizuje (nulluje), nie hard-delete.

---

## Technické poznámky

```sql
-- pg_cron job
SELECT cron.schedule('anonymize-expired-attempts', '0 3 * * *', $$
  UPDATE attempts a
  SET respondent_email = NULL,
      respondent_name  = NULL,
      ip_hash          = NULL
  FROM tests t
  WHERE a.test_id = t.id
    AND a.completed_at < now() - (t.data_retention_days || ' days')::INTERVAL
    AND a.anonymized_at IS NULL;
$$);
```

- `attempts.anonymized_at TIMESTAMPTZ NULL` – nie-NULL → already processed.
- Custom PII intake polia: `attempt_intake_answers` SET `answer_value = NULL` WHERE `field_id` IN (SELECT súbor is_pii = TRUE poli).

---

## Edge Cases

- Author zmení `data_retention_days` na kratšiu dobu: attempts z minulosti, ktoré by boli anonymizované pri novej dobe, sa anonymizujú pri najbližšom cron run.
- Attempt je aktívny (`status = 'in_progress'`) a retenčná doba vypršala: cron preskočí (anonymizuje len `completed` alebo `abandoned`).
- Respondent podal DSR výmaz počas anonymizácie: DSR výmaz má prednosť (NULL všetko + hard-delete).

---

## Závislosti

- Závisí na: US-012 (retenčné nastavenia), US-163 (audit log záznamy), US-040 (is_pii flag na intake poliach)
- Blokuje: US-143 (DSR výmaz repoužíva anonymizačnú logiku)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: in_progress attempt neovplývnený, anonymized_at idempotencia
- [ ] Integračný test: cron job simulácia s expired attempts
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: audit log záznamy anonymizačných udalostí overené
