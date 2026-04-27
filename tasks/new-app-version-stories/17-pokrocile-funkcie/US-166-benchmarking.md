# US-166 – Systém poskytuje pokročilú analytiku a benchmarking

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-166                               |
| **Priorita** | P3                               |
| **Stav** | Draft                                |
| **Feature** | Pokročilé funkcie                 |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **porovnať výsledky respondentov môjho testu s anonymizovanými bench­markovými dátami platformy**
> aby som **mohol objektívne interpretovať výsledky v kontexte iných organizácií alebo populácie**.

---

## Kontext

Benchmarking je hodnotný feature pre HR a L&D profesionálov: „Naši zamestnanci
dosiahli priemerne 72 bodov – platforma benchmark je 68 bodov." Benchmark dáta sú
prísne anonymizované agregáty naprieč rôznymi testami a autormi.

---

## Akceptačné kritériá

- [ ] **AC-1:** Pre predefinované platfornmové testy (US-020) platforma zobrazí benchmark percentil pozíciu priemerného skóre autora medzi všetkými testmi daného typu.
- [ ] **AC-2:** Benchmark dáta sú derivované z anonymizovaného poolu: min. 100 attemptov naprieč min. 5 rôznymi testami toho istého typu pred zobrazením benchmarku.
- [ ] **AC-3:** Benchmark je zobrazený ako percentilový rank (napr. „Vaši respondenti sú v top 35%") a ako distribučný histogram.
- [ ] **AC-4:** Benchmark je aktualizovaný mesačne (nie real-time) – materializovaný view `mv_benchmark_{test_type_slug}` s pg_cron refresh.
- [ ] **AC-5:** Autor môže opt-out z prispevania dát do benchmarku (možnosť v nastaveniach testu `contribute_to_benchmark BOOLEAN DEFAULT TRUE`). Opt-out nezobrazí benchmark pre tento test.
- [ ] **AC-6:** Benchmark zobrazenie obsahuje disclaimer: „Benchmark je anonym. agregát. Nezahŕňa Vaše individuálne dáta."
- [ ] **AC-7:** Pre vlastné (custom) testy autora (nie platformové) benchmark nie je dostupný (nedostatočný pool porovnateľných testov).
- [ ] **AC-8:** Benchmark dáta sú dostupné v PDF reporte (US-130) ako doplnková sekcia ak je benchmark k dispozícii.

---

## Technické poznámky

- Benchmark materializovaný view: `CREATE MATERIALIZED VIEW mv_benchmark_iq_general AS SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY score) AS median_score, ... FROM attempts JOIN tests ON ... WHERE test_type = 'iq_general' GROUP BY ...`.
- Minimálny pool 100 attemptov / 5 testov: view nezobrazuje dáta pod týmto prahom.
- Opt-out flag: attempts autorových testov s `contribute_to_benchmark = FALSE` sú vylúčené z benchmark query pomocou JOIN condition.

---

## Edge Cases

- Test type benchmark má < 100 attemptov: benchmark sekcia v dashboarde zobrazí „Benchmark bude dostupný po dosiahnutí dostatočného počtu respondentov platformy."
- Autor opt-out a neskôr opt-in: dáta z opt-out obdobia sa spätne **nepridávajú** do benchmarku (privacy by design).

---

## Závislosti

- Závisí na: US-103 (analytika), US-020 (predefinované testy – benchmark je relevantný len pre ne)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: minimálny pool threshold, opt-out exclusion
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: benchmark dáta nie sú reverzne identifikovateľné
