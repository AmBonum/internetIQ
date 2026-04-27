# US-194 – Respondent vidí históriu všetkých svojich testov

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-194                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Používateľské účty                |
| **Rola** | Respondent (prihlásený)              |

---

## User Story

> Ako **prihlásený respondent**
> chcem **vidieť všetky testy, ktoré som absolvoval, vrátane výsledkov a informácií o autorovi testu**
> aby som **mohol sledovať svoj pokrok, porovnávať výsledky a mať trvalý prehľad o svojom vzdelaní a výkonnosti**.

---

## Kontext

História testov je hlavná hodnota respondentského účtu. Respondent vidí testy
naprieč rôznymi autormi, rôznymi dátumami, a rôznymi kontextmi (job interview,
firemné školenie, online kurz). UI je respondent dashboard – oddelené od autora
(admin) dashboardu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Respondent dashboard je dostupný na `/dashboard` po prihlásení. Záložka „Moja história" zobrazuje všetky attempts kde `attempts.user_id = auth.uid()`.
- [ ] **AC-2:** Každý záznam v zozname zobrazuje:
  - Názov testu (alebo sady testov)
  - Autor / organizácia (ak autor povolil zobrazenie svojho mena – `test.show_author BOOLEAN DEFAULT true`)
  - Dátum vyplnenia
  - Výsledok / skóre (ak bolo hodnotenie povolené autorom)
  - Status: Dokončený / Nedokončený / Expirovaný
  - Akčné tlačidlá: Zobraziť detail | Zdieľať | Exportovať
- [ ] **AC-3:** Zoznam je zoradený: najnedávnejšie prve. Filtrovateľný: podľa stavu (dokončené/nedokončené), dátumového rozsahu, názvu testu (search). Paginovaný: 20/strana.
- [ ] **AC-4:** Detail testu (`/dashboard/test/{attemptId}`) zobrazuje:
  - Všetky otázky a odpovede respondenta
  - Skóre a hodnotenie (ak autorom povolené)
  - Čas vyplnenia (per otázka ak analytický súhlas bol daný)
  - Porovnanie s priemerom iných respondentov toho testu (ak benchmark dostupný a autor povolil)
- [ ] **AC-5:** Respondent vidí informácie o autorovi testu len ak `test.show_author = TRUE`. Ak FALSE, zobrazí sa „Anonymný test".
- [ ] **AC-6:** Po 24h od dokončenia testu respondent **nezobrazuje** otázky a odpovede, iba súhrnné výsledky (skóre, percentil). Detailné odpovede sú dostupné len počas 24h okna (ochrana obsahu testu pred nezdieľaním).  Autori môžu túto politiku pre svoje testy predĺžiť alebo zrušiť.
- [ ] **AC-7:** Nedokončené (in_progress / abandoned) testy sú zobrazené so stavom „Nedokončené" a tlačidlom „Pokračovať" (ak test povolí résumé – US-083 a attempt nie je expirovaný).
- [ ] **AC-8:** Celkové agregované štatistiky respondenta v headeri dashboardu: počet dokončených testov, priemerné skóre (% z max), počet rôznych oblastí/kategórií testovaných.

---

## Technické poznámky

- `attempts.user_id` FK je základ pre všetky queries – RLS: `SELECT WHERE user_id = auth.uid()`.
- `test.show_author`: nové pole `BOOLEAN DEFAULT TRUE` na `tests` tabuľke.
- 24h detail window: `completed_at + INTERVAL '24 hours' > now()` podmienka v query / RLS policy.
- Aggregate stats: materializovaný view `mv_respondent_stats(user_id, total_attempts, avg_score, categories_tested[])` refresh každých 6h.

---

## Edge Cases

- Respondent bol anonymizovaný (US-164): attemp ostáva v zozname ale s redukovanými dátami (len dátum a test name).
- Test bol medzitým archivovaný/zmazaný autorom: attempt zostáva v histórii respondenta s názvom testu (denormalizovane uložený pri dokončení) aj keď `tests` záznam je zmazaný.
- Prúbehom 24h okna: detail stránka zobrazí odpovede s odpočítavaním „Detailné odpovede dostupné ešte X hodín".

---

## Závislosti

- Závisí na: US-191 (viazanie attempts k účtu), US-193 (respondent rola)
- Blokuje: US-195 (zdieľanie a export – vychádza z tejto histórie)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: 24h window logika, RLS na attempts, show_author flag
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
