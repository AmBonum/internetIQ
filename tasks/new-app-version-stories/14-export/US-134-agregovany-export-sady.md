# US-134 – Autor exportuje agregovaný prehľad testovacej sady

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-134                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Export                            |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testovacej sady (test pack)**
> chcem **exportovať agregovaný prehľad výsledkov celej sady naprieč všetkými testami**
> aby som **mohol hodnotiť celkovú výkonnosť skupiny respondentov na úrovni sady**.

---

## Kontext

Testovacie sady (packs) obsahujú viacero testov. Autor potrebuje celkový pohľad –
nie len per-test dáta. Agregovaný export kombinuje výsledky respondentov naprieč
testami v sade, zobrazuje cross-test skóre a umožňuje porovnanie v kontexte sady.
Tento export je doplnok k per-test exportom (US-130, US-131, US-133).

---

## Akceptačné kritériá

- [ ] **AC-1:** Export je dostupný len pre testovacie sady (packs). Pre samostatné testy nie je relevantný.
- [ ] **AC-2:** Agregovaný export (CSV alebo PDF) obsahuje per-respondent sumáre: attempt_id, skóre per test, celkové skóre sady, completion status per test, celkový čas sady.
- [ ] **AC-3:** PDF verzia obsahuje kompaktný cross-test leaderboard (anonymizovaný – len attempt_id, nie mená) ak autor skórovanie povolil.
- [ ] **AC-4:** Autor môže filtrovať export: len respondenti, ktorí dokončili všetky testy v sade vs. všetci respondenti.
- [ ] **AC-5:** Pre každý test v sade je v CSV/JSON stĺpcová skupina prefixovaná názvom testu (napr. `[Test A] skore`, `[Test A] cas`).
- [ ] **AC-6:** Respondentom, ktorí nespustili niektorý test v sade, sa zobrazí `null` hodnota (nie 0) pre dané stĺpce.
- [ ] **AC-7:** Export zdieľa rovnaký rate-limit mechanizmus ako US-130/US-131 (export_rate_limits per test_pack_id).
- [ ] **AC-8:** Exportovaný súbor obsahuje metadata sady: `pack_id`, `pack_name`, `tests_in_pack[]`, `generated_at`.

---

## Technické poznámky

- Agregácia: query JOIN medzi `pack_attempts`, `attempts`, `attempt_scores` per test.
- Cross-test skóre: `SUM(score) / max_possible_sum * 100` ako percentuálny total.
- Null vs. 0: `LEFT JOIN` na testy zabezpečí NULL pre nespustené testy.

---

## Edge Cases

- Sada obsahuje 5 testov, respondent dokončil 3: export s filtrom „len kompletní" ho vylúči; bez filtra ho zahrnie s null pre 2 testy.
- Jeden z testov v sade bol medzitým archivovaný: export ho napriek tomu zahrnie (historické dáta), s poznámkou `[archivovaný]` v stĺpcovom hlavičke.
- Sada má 0 respondentov: export obsahuje len header riadok s upozornením v metadata.

---

## Závislosti

- Závisí na: US-081 (test pack flow), US-131 (CSV mechanizmus), US-130 (PDF mechanizmus)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: null vs 0 pre nespustené testy, filter kompletní/všetci
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
