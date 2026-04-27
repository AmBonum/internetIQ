# US-111 – Systém zbiera behaviorálne dáta pri súhlase

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-111                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Sledovanie a súhlas               |
| **Rola** | Systém / platforma                   |

---

## User Story

> Ako **systém**
> chcem **automaticky zaznamenávať behaviorálne udalosti respondenta keď dal analytický súhlas**
> aby som **autorovi testu poskytoval hodnotné metriky o priebehu testovania**.

---

## Kontext

Behaviorálne sledovanie je žiadúce pre autora (vidí kde respondenti strácajú čas,
kde odchádzajú) ale je podriadené súhlasu (US-110). Táto story pokrýva konkrétnu
sadu udalostí a ich technickú implementáciu. Záznamy sú pseudonymizované –
viazané na `attempt_id`, nie na identity PII.

---

## Akceptačné kritériá

- [ ] **AC-1:** Pri `analytics_consent_given = TRUE` systém (bez ďalšej akcie respondenta) automaticky zaznamenáva udalosti v tabuľke `attempt_events`:
  - `question_view` – timestamp zobrazenia každej otázky
  - `question_answer_submitted` – timestamp záznamu odpovede
  - `question_skip` – ak respondent preskočí otázku (ak test povolí skip)
  - `test_section_start` – začiatok každej časti testu
  - `test_section_end` – koniec každej časti
- [ ] **AC-2:** `attempt_events` obsahuje `time_delta_ms INTEGER` (čas od predošlej udalosti v ms), čo umožňuje derivovanie „čas strávený na otázke" bez ukladania absolutného času klienta (privacy by design – iba delta).
- [ ] **AC-3:** Povinné systémové udalosti sa zbierajú **vždy** (bez ohľadu na consent): `test_started`, `completed`, `intake_completed`, `abandoned`. Tieto sú potrebné pre funkcionalitu (nie analytiku).
- [ ] **AC-4:** Zápis udalostí ide cez dedikovaný endpoint `/api/attempt/{attemptId}/event` (nie priamo do Supabase z klienta). Endpoint validuje: attempt existuje, attempt patriaci requestorovi, consent flag = true pre analytické udalosti.
- [ ] **AC-5:** Batch zápis: klient môže poslať array udalostí v jednom requeste (max 50 event/batch, max 1 batch/5s), aby sa znížil počet HTTP requestov.
- [ ] **AC-6:** Endpoint je rate-limitovaný na Cloudflare Edge: max 20 req/min per attempt_id.
- [ ] **AC-7:** `attempt_events` má RLS politiku: respondent číta iba vlastné (cez session), admin číta len eventy vlastného testu, nikto nemôže čítať eventy iných testov.
- [ ] **AC-8:** Dáta z `attempt_events` sú automaticky anonymizovane po 90 dňoch: `attempt_id` foreign key zostáva, ale nullable polia sa nullujú (pg_cron alebo scheduled Edge Function).

---

## Technické poznámky

```sql
CREATE TABLE attempt_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id  UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL CHECK (event_type IN (
                'question_view','question_answer_submitted','question_skip',
                'test_section_start','test_section_end',
                'test_started','completed','intake_completed','abandoned')),
  question_id UUID REFERENCES questions(id),
  time_delta_ms INTEGER,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON attempt_events(attempt_id, created_at);
```

- Anonymizácia po 90 dňoch: UPDATE SET metadata = NULL, question_id = NULL WHERE event_type NOT IN ('test_started','completed','intake_completed','abandoned') AND created_at < now() - INTERVAL '90 days'.

---

## Edge Cases

- Respondent odvolá consent v strede testu: zápis na endpoint pre analytické typy vráti 403; batch eventy pred odobratím sú already committed (neretroaktívne mazanie).
- Batch príde s 51 eventmi: 400 Bad Request, žiadny event sa neuloží (transakcia celého batchu).
- Attempt nepatrí tokenu v session: 403 Forbidden, žiadny event sa neuloží.

---

## Závislosti

- Závisí na: US-110 (consent mechanizmus), US-080 (test flow – zdroj udalostí)
- Blokuje: US-103 (analytika v dashboarde – čerpá z attempt_events)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: batch limit, consent guard, systémové udalosti vždy zapisujú
- [ ] Integračný test: endpoint bez platného session tokenu vracia 403
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: iba delta časy (nie absolútne timestamps klienta), RLS overené
