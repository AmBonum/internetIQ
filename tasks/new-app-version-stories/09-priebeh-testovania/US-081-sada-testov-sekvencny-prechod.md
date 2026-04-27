# US-081 – Respondent prechádza sadou testov sekvenčne

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-081                             |
| **Priorita** | P1                             |
| **Stav** | Draft                              |
| **Feature** | Priebeh testovania              |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **v prípade sady testov vidieť prehľad všetkých testov a prechádzať ich sekvenčne**
> aby som **mal kontrolu nad postupom a vedel, koľko testov musím ešte dokončiť**.

---

## Kontext

Sada testov (pack) obsahuje 2–5 testov. Respondent ich vypĺňa za sebou. Každý
test v sade je samostatná jednotka s vlastnými otázkami. Ďalší test je sprístupnený
iba po dokončení predchádzajúceho (sequencing constraint). Respondent vidí celkový
postup v sade kedykoľvek.

---

## Akceptačné kritériá

- [ ] **AC-1:** Pre sadu testov sa zobrazí „Pack overview" stránka so zoznamom všetkých testov v sade, ich stavom (nezahájený / v procese / dokončený) a odhadovanou dĺžkou každého.
- [ ] **AC-2:** Respondent môže zvoliť **Spustiť všetky testy** (sekvenčne automaticky) alebo **Vybrať konkrétny test** zo zoznamu.
- [ ] **AC-3:** Pri voľbe „Spustiť všetky testy": testy sa vykonajú v poradí definovanom autorom; po dokončení jedného testu systém automaticky ponúkne spustenie nasledujúceho (nie automatický redirect – respondent musí potvrdiť).
- [ ] **AC-4:** Testy, ktoré respondent ešte nedokončil, nesmú byť dostupné pred dokončením predchádzajúceho (lock/unlock logika).
- [ ] **AC-5:** Respondent môže prerušiť sadu po dokončení jedného z testov a pokračovať neskôr (stav je uložený server-side).
- [ ] **AC-6:** Progress indikátor zobrazuje: „Test X z Y" pre aktuálny test V sade aj globálne „Dokončené X/Y testov".
- [ ] **AC-7:** Dokončený test v sade je označený vizuálne (checkmark) a nie je možné ho znovu vyplniť bez adminskeho resetu.
- [ ] **AC-8:** Systém uchováva stav sady (`pack_session`) na server-side; respondent môže otvoriť sadu z iného zariadenia a vidieť rovnaký stav.

---

## Technické poznámky

- Schéma: `pack_sessions(id UUID, pack_id FK, session_id, test_order JSONB, completed_tests UUID[], started_at, last_activity_at)`.
- Lock logika: endpoint `/t/{shareId}/pack/{packId}/test/{testIndex}` overí, že predchádzajúce testy sú `completed` pred povolením prístupu.
- Auto-sequence: po dokončení testu server vráti `next_test_available: true/false` a `next_test_id`.
- Stav uložený server-side: `pack_sessions.completed_tests` je array UUID skompletovaných testov.

---

## Edge Cases

- Respondent otvorí priamy link na test 3 v sade bez dokončenia testu 2: server odmietne prístup a presmeruje na pack overview.
- Autor zmení poradie testov v sade keď respondent vyplňuje sadu: respondent dokončí aktuálnu session s pôvodným poradím (snapshot).
- Respondent dokončí všetky testy v sade: zobrazí pack completion summary (US-082).

---

## Závislosti

- Závisí na: US-080 (základný test flow), US-060 (custom link)
- Blokuje: US-082 (pack summary), US-090 (história respondenta)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: lock/unlock logika, pack session state
- [ ] E2E test: sada 3 testov – dokončenie prvého → unlock druhého → completion
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
