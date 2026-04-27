# US-103 – Autor sleduje časové a analytické metriky

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-103                             |
| **Priorita** | P2                             |
| **Stav** | Draft                              |
| **Feature** | Admin dashboard                 |
| **Rola** | Autor / administrátor testu        |

---

## User Story

> Ako **autor testu**
> chcem **vidieť agregované časové a analytické metriky o teste a respondentoch**
> aby som **mohol vyhodnocovať efektivitu testu, identifikovať problematické otázky a optimalizovať obsah**.

---

## Kontext

Analytický prehľad je doplnok k zoznamu respondentov. Zobrazuje agregované dáta –
trendy, distribúcie, „drop-off" body. Dáta sú agregované bez identifikácie individuálnych
respondentov (ochrana súkromia, GDPR princíp).

---

## Akceptačné kritériá

- [ ] **AC-1:** Prehľad zobrazuje tieto karty/KPI metriky:
  - Celkový počet respondentov (all time)
  - Počet dokončených testov (+ % completion rate)
  - Priemerný čas vyplnenia (minúty)
  - Počet aktívnych dnes (stav in_progress dnes)
  - Priemerné skóre (ak je bodovanie definované)
- [ ] **AC-2:** Graf „Respondenti v čase": líniový graf zobrazujúci počet nových respondentov per deň (posledných 30 dní); filtrovateľný na 7d / 30d / 90d / celé obdobie.
- [ ] **AC-3:** Graf „Completion funnel": vizualizácia poklesu respondentov naprieč krokmi testu (landing → intake → test → dokončenie).
- [ ] **AC-4:** Tabuľka „Otázky podľa priemerného času odpovede": zoznam otázok zoradených od najdlhšej po najkratšiu priemernú dobu odpovede – identifikuje ťažké otázky.
- [ ] **AC-5:** Tabuľka „Distribúcia odpovedí": pre `single_choice` a `multi_choice` otázky zobrazuje percentuálne rozdelenie vybraných možností.
- [ ] **AC-6:** Všetky dáta sú agregované: žiadna metrika nesmie identifikovať konkrétneho respondenta (minimum agregovanej vzorky: 5 respondentov – pod 5 sa hodnota nezobrazuje).
- [ ] **AC-7:** Analytická stránka má sekciu „Kvalita dát": zobrazuje počet čiastkových (prerušených) odpovedí, null hodnôt per pole, out-of-range hodnôt – pomáha autorovi vyčistiť dáta.
- [ ] **AC-8:** Export analytického prehľadu ako PDF report (US-130) je dostupný z analytickej stránky.

---

## Technické poznámky

- Agregácie: materializované view v PostgreSQL (`mv_test_analytics`) aktualizované každých 15 minút (pg_cron).
- Completion funnel: event-based tracking z `attempt_events(attempt_id, event_type ENUM('landing_view','intake_completed','test_started','completed'), event_at)`.
- Minimálna vzorka 5: `WHERE count >= 5` v agregačnom query; pre menšie vzorky zobraziť „Nedostatok dát".
- Grafy: `recharts` alebo ekvivalent – server-rendered fallback (tabuľka pre export).

---

## Edge Cases

- Test s < 5 respondentmi: distribučné grafy sa nezobrazujú s textom „Zbierajú sa dáta (min. 5 respondentov)".
- Autor exportuje prehľad ako PDF: PDF obsahuje snímku grafov + tabuľky – nie interaktívna verzia.
- Test bol archivovaný: analytika ostáva dostupná read-only.

---

## Závislosti

- Závisí na: US-101 (zoznam – ako sa generujú aggregate query na rovnakých attempt dátach)
- Blokuje: US-130 (PDF export analytiky)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: minimálna vzorka 5 logika, materializované view kalkulácia
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: žiadna individuálna identifikovateľnosť v agregovaných metrikách
