# US-162 – Autor organizuje respondentov do skupín

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-162                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Pokročilé funkcie                 |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **môcť organizovať respondentov do skupín (napr. oddelenia, tímy, kohorty)**
> aby som **mohol porovnávať výsledky medzi skupinami a generovať skupinové reporty**.

---

## Kontext

Firemní zákazníci typicky testujú viacero oddelení, tímov alebo skupín kandidátov.
Grouping umožňuje „Group A vs. Group B" porovananie bez potreby vytvárať
samostatné testy. Skupiny sú definované autorom – nie respondentmi.

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor môže vytvoriť skupiny pre test v admin dashboarde: názov skupiny (max 80 znakov), voliteľný popis (max 200 znakov). Max 20 skupín per test.
- [ ] **AC-2:** Respondentom je skupina priradená jedným z troch spôsobov:
  - **Manuálne**: autor priradí respondenta (attempt) do skupiny v dashboarde
  - **Cez link**: pre každú skupinu sa vygeneruje unikátny podlink (napr. `/t/{shareId}?g={groupId}`), respondenti cez skupinový link sú automaticky priradení
  - **Pravidlom**: autor definuje pravidlo (napr. „ak intake pole Oddelenie = Marketing → Skupina Marketing")
- [ ] **AC-3:** Skupinový link (`?g={groupId}`) neprezrádza respondentovi, v akej skupine je (pre blind-testing).
- [ ] **AC-4:** V admin dashboarde je záložka „Skupiny" so aggregate porovnaním: priemerné skóre, completion rate, čas per skupina – ako tabuľka aj graf.
- [ ] **AC-5:** Respondent môže byť v max 1 skupiny per test. Priradenie do druhej skupiny nahradí predošlé priradenie (s logovanie zmeny).
- [ ] **AC-6:** Skupinové dáta sú dostupné v CSV/JSON exporte ako `group_name` stĺpec (US-131/US-133).
- [ ] **AC-7:** Pravidlá automatického priraďovania sú vyhodnocované server-side pri dokončení intake (nie client-side).
- [ ] **AC-8:** Skupiny s < 5 respondentmi sú v aggregate prehľade anony zobrazené ako „Príliš málo respondentov" (rovnaká minimálna vzorka ako US-103).

---

## Technické poznámky

```sql
CREATE TABLE test_groups (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id  UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  slug     TEXT NOT NULL,          -- pre group link parameter
  rules    JSONB,                  -- auto-assignment rules
  UNIQUE (test_id, slug)
);

ALTER TABLE attempts ADD COLUMN group_id UUID REFERENCES test_groups(id);
```

- Group link: `?g={groupId}` parameter je validovaný server-side; neplatný groupId = attempt bez skupiny (nie chyba).

---

## Edge Cases

- Respondent použije skupinový link, ale pravidlo ho priradí do inej skupiny: pravidlo má prednosť.
- Skupinový link s expirovaným alebo zmazaným `groupId`: attempt sa vytvorí bez skupiny.
- Autor zmaže skupinu: existujúce attempts dostanú `group_id = NULL` (nezmazané).

---

## Závislosti

- Závisí na: US-060 (share link systém), US-080 (attempt flow), US-040 (intake polia – základ pre pravidlá)
- Blokuje: US-163 (audit log môže logovať skupinové zmeny)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: auto-assignment pravidlá, minimálna vzorka 5 v aggregate
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
