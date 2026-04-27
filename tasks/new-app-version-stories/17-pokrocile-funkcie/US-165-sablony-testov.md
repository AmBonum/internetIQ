# US-165 – Autor vytvára a používa šablóny testov

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-165                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Pokročilé funkcie                 |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **môcť uložiť existujúci test ako šablónu a vytvoriť nový test podľa nej**
> aby som **nemusel opakovane nastavovať rovnaké konfigurácie pre podobné testy**.

---

## Kontext

Firmy s opakujúcimi sa testovaciami cyklami (napr. kvartálne hodnotenie, onboarding
nových zamestnancov) potrebujú rýchle vytváranie identicky konfigurovaných testov.
Šablóny sú privátne (vidí ich len autor), nie zdieľané medzi rôznymi zákazníkmi
(v V1).

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor môže označiť existujúci test ako šablónu: `tests.status = 'template'`. Šablóna nie je verejná a nemá aktívny share link.
- [ ] **AC-2:** Autor môže vytvoriť nový test „Z šablóny": vyberie zo zoznamu vlastných šablón, systém vytvorí nový draft test s rovnakými nastaveniami.
- [ ] **AC-3:** Pri vytvorení testu zo šablóny sa skopíruje: konfigurácia polí (US-040), vybrané testy/otázky, bezpečnostné nastavenia (bez hesla – heslo sa nastavuje nanovo). Respondentské dáta sa **nekopírujú**.
- [ ] **AC-4:** Autor môže pomenovať šablónu (odlišný názov od originálu). Popis šablóny (interná poznámka, max 300 znakov) je voliteľný.
- [ ] **AC-5:** Zoznam šablón je dostupný v admin dashboarde v záložke „Šablóny". Zobrazuje: názov, dátum vytvorenia, počet testov vytvorených z tejto šablóny.
- [ ] **AC-6:** Šablóna je exportovateľná ako JSON (US-133) a importovateľná späť. Toto umožňuje zdieľanie šablón mimo platformy (napr. medzi pobočkami firmy).
- [ ] **AC-7:** Ak platforma poskytuje predefinované šablóny (platform-level templates), sú oddelené od privátnych šablón autora. Platform šablóny sú read-only pre autorov.
- [ ] **AC-8:** Maximálny počet privátnych šablón per autor: 50.

---

## Technické poznámky

- `tests.status = 'template'` je nový typ v CHECK constraint (pridáme k draft/published/archived).
- Klonovanie: `INSERT INTO tests SELECT ... WHERE id = {template_id}` s reset `status = 'draft'`, `share_id = gen_random_base62()`, `created_at = now()`.
- Platform šablóny: `tests.is_platform_template = TRUE` s `author_id = NULL` (system-owned).

---

## Edge Cases

- Autor sa pokúsi publikovať šablónu priamo (nie cez klonujúci flow): server vráti 400 „Šablóny nie sú publikovateľné priamo."
- Šablóna obsahuje otázku, ktorá bola medzitým deaktivovaná (US-030): klon obsahuje túto otázku ale s varovaním „Niektoré otázky sú zastarané."
- JSON import šablóny s nekompatibilnou verziou schémy (US-133): import vráti chybu s migration guide.

---

## Závislosti

- Závisí na: US-161 (draft stav), US-133 (JSON export/import schéma)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: klonovanie nekopíruje respondentské dáta, limit 50 šablón
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
