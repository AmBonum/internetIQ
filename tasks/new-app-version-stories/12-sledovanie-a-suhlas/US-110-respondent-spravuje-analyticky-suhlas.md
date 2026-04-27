# US-110 – Respondent spravuje analytický súhlas

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-110                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Sledovanie a súhlas               |
| **Rola** | Respondent                           |

---

## User Story

> Ako **respondent**
> chcem **mať možnosť udeliť alebo odobrať súhlas so sledovaním môjho správania počas testu**
> aby som **mal kontrolu nad tým, aké dáta o mne sú zbierané**.

---

## Kontext

Behaviorálne sledovanie (čas na otázku, drop-off, udalosti navigácie) je analytický
doplnok – nie nevyhnutný pre fungovanie testu. GDPR vyžaduje, aby bol tento súhlas
dobrovoľný, granulárny a kedykoľvek odvolateľný. Súhlas je viazaný na attempt, nie
na permanentný účet.

---

## Akceptačné kritériá

- [ ] **AC-1:** Na landing stránke testu (pred začatím) je samostatný checkbox „Súhlasím so zbieraním analytických dát o priebahu testu". Checkbox **nie je** predzaškrtnutý (opt-in).
- [ ] **AC-2:** Popis vedľa checkboxu obsahuje odkaz na detailné vysvetlenie, čo sa sleduje (na page alebo v modale).
- [ ] **AC-3:** Stav súhlasu (`analytics_consent: boolean`) sa uloží do záznamu `attempts.analytics_consent_at | analytics_consent_given`.
- [ ] **AC-4:** Ak respondent nesúhlasí, systém **nezbiera žiadne** behaviorálne udalosti (event_type: `question_view`, `question_blur`, `time_on_question`). Povinné udalosti pre správnosť testu (napr. `test_started`, `completed`) sú zbierané vždy.
- [ ] **AC-5:** Respondent môže počas vypĺňania testu zmeniť rozhodnutie cez settings panel (nie je skrytý). Zmena consent stavu sa uloží s timestampom `analytics_consent_changed_at`.
- [ ] **AC-6:** Po odobratí súhlasu systém **nevymaže** historicky zbierané udalosti (mazanie by sme robili len na request GDPR DSR – US-143), ale zbieranie ihneď zastaví.
- [ ] **AC-7:** Autor testu vidí v admin dashboarde, aké % respondentov dalo analytický súhlas (agregát, nie per-person).
- [ ] **AC-8:** Celý consent checkbox + vysvetľujúci text je testovaný na prístupnosť (WCAG 2.1 AA): čitateľný screenreaderom, dosegmentovateľný klávesnicou.

---

## Technické poznámky

- `attempts` tabuľka: `analytics_consent_given BOOLEAN NOT NULL DEFAULT FALSE`, `analytics_consent_at TIMESTAMPTZ`.
- `attempt_events` tabuľka: event router pred zápisom kontroluje `attempts.analytics_consent_given = TRUE` (OR event_type IN ('test_started','completed','intake_completed')).
- Server-side guard: Supabase RLS policy + Edge Function pre `/api/events` validate consent pred zápisom.

---

## Edge Cases

- Respondent klikne „Odobrať" pri otázke č. 3: udalosti od otázky č. 4 ďalej sa nezbierajú; otázky 1–3 ostávajú (pre integritu existujúcich dát).
- Obsah testu je pre respondenta povinný (firemný mandát): autor nemôže consent analytiky urobiť povinným – odporuje GDPR.
- Respondent s blokovaním JS: checkbox je viditeľný even bez JS (server-rendered form), default = unchecked.

---

## Závislosti

- Závisí na: US-070 (landing stránka – miesto pre consent UI), US-002 (respondent session)
- Blokuje: US-111 (zbieranie behaviorálnych dát)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: consent guard v event routeri, stav bez súhlasu nevytvára analytické eventy
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy/legal review: súhlas dobrovoľný, granulárny, odmietnutie bez následkov na prístup k testu
