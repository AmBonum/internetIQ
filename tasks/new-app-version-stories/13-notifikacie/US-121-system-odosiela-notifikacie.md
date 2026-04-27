# US-121 – Systém odosiela notifikácie na udalosti

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-121                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Notifikácie                       |
| **Rola** | Systém / platforma                   |

---

## User Story

> Ako **systém**
> chcem **automaticky odosielať emailové notifikácie keď nastanú nakonfigurované udalosti**
> aby som **autorom testov poskytoval včasné upozornenia bez manuálneho monitoringu**.

---

## Kontext

Notifikácie sú asynchrónne – nesmú blokovať request flow. Spúšťajú sa cez
Supabase Edge Functions alebo pg_notify trigger → queue → Edge Function worker.
Každý typ notifikácie má vlastnú email šablónu (react-email).

---

## Akceptačné kritériá

- [ ] **AC-1:** Systém odosiela notifikáciu „Nový respondent" pri `attempt.status = 'completed'` ak `enabled = TRUE` v `test_notification_config`.
- [ ] **AC-2:** Systém odosiela notifikáciu „Míľnik" keď count dokončených respondentov dosiahne `milestone_n` (z konfigurácie) – odoslaná raz per míľnik (deduplication cez `notification_sent_log`).
- [ ] **AC-3:** Systém odosiela notifikáciu „Test expiruje" 7 dní a 1 deň pred `tests.expires_at` (pg_cron job každú noc o 07:00 UTC).
- [ ] **AC-4:** Notifikácia „Anomália / podvod" sa odošle ak scoring systém deteguje: attempt čas < 20% priemerného času, identické odpovede ako iný attempt z rovnakej IP.
- [ ] **AC-5:** Každý email obsahuje: názov testu, popis udalosti, odkaz na admin dashboard, unsubscribe link (token z US-120).
- [ ] **AC-6:** Notifikácie sa **neopakovane** odosielajú: `notification_sent_log(test_id, event_type, reference_id, sent_at)` – deduplication pred každým odoslaním.
- [ ] **AC-7:** Neúspešné odoslanie sa opakuje max 3×: exponential backoff (1 min → 5 min → 15 min). Po 3 pokusoch sa zaznamená chyba do `notification_failures` a neobťažuje viac.
- [ ] **AC-8:** Objem: systém je schopný spracovať nárast 1000 notifikácií za hodinu bez degradácie použitím queue (Supabase Edge Function + Resend API alebo ekvivalent).

---

## Technické poznámky

```sql
CREATE TABLE notification_sent_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  reference_id TEXT,            -- attempt_id, milestone value, etc.
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, event_type, reference_id)
);
```

- Odosielateľ: Resend API (alebo Postmark), nie priamo SMTP. SPF/DKIM nastavené na platformovú doménu.
- Trigger architektúra: `pg_notify('notification_queue', payload::text)` z DB trigger → Edge Function subscriber.
- Pre pg_cron notifikácie (expiry): Edge Function cron job číta `tests` kde `expires_at BETWEEN now() AND now() + INTERVAL '7 days'`.

---

## Edge Cases

- Test je stlmený (`muted_until > now()`): systém notifikáciu presunie / preskočí bez záznamu do sent_log.
- Resend API je dole: worker zaznamená chybu, retry po backoff-e. Po 3 pokusoch alert do interného monitoringu (napr. Sentry).
- Míľnik 100 respondentov, ale systém prehluší a 101. respondent triggeruje check: deduplication cez `reference_id = '100'` zabráni dvojitému odoslaniu.

---

## Závislosti

- Závisí na: US-120 (konfigurácia notifikácií), US-080 (attempt completed event)
- Blokuje: nič priamo (terminálna story pre notifikačný systém)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: deduplication, retry backoff, muted test skip
- [ ] Integračný test: end-to-end odoslanie pri `attempt completed` event
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
