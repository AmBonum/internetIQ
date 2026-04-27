# US-102 – Autor vidí detail a odpovede konkrétneho respondenta

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-102                             |
| **Priorita** | P1                             |
| **Stav** | Draft                              |
| **Feature** | Admin dashboard                 |
| **Rola** | Autor / administrátor testu        |

---

## User Story

> Ako **autor testu**
> chcem **vidieť detailné informácie a odpovede konkrétneho respondenta**
> aby som **mohol vyhodnocovať jednotlivé záznamy, identifikovať vzory a prijaté rozhodnutia odôvodniť konkrétnymi dátami**.

---

## Kontext

Detail respondenta je rozšírenie zoznamu (US-101). Zobrazuje všetky dostupné dáta
pre konkrétny attempt vrátane intake dát, odpovedí na otázky a časových metrík.
Prístup k PII musí byť auditovaný.

---

## Akceptačné kritériá

- [ ] **AC-1:** Detail respondenta zobrazuje:
  - **Identifikácia**: attempt ID, dátum/čas začatia a dokončenia, celkový čas, stav
  - **Intake dáta**: všetky vyplnené intake polia (vrátane PII, vizuálne výrazne označené ako „Osobné údaje")
  - **Odpovede**: každá otázka s textom otázky, odpoveďou respondenta a časom odpovede (sekúnd na otázku)
  - **Skóre**: celkové skóre, percentil, kategoriálne skóre (ak sú definované)
- [ ] **AC-2:** PII sekcia (intake dáta) je kolapsovateľná a predvolene skrytá; pri rozbalení sa zaznamená do audit logu (US-163): `(event='pii_accessed', attempt_id, admin_session_id, accessed_at)`.
- [ ] **AC-3:** Odpovede anonymizovaných polí (US-042) sú zobrazené ako `[anonymizované]` – bez možnosti odkrytia.
- [ ] **AC-4:** Autor môže z detailu stránky exportovať tento jeden záznam ako PDF (US-130) alebo JSON (US-132).
- [ ] **AC-5:** Autor môže označiť attempt flagom (napr. „Podozrivý", „Vylúčený", „Vybraný") s voliteľnou poznámkou; flagy sú viditeľné v zozname respondentov.
- [ ] **AC-6:** Pre sady testov detail zobrazuje odpovede naprieč všetkými testami v sade v záložkovom rozvrhnutí (tab per test).
- [ ] **AC-7:** Autor môže resetovať attempt respondenta (nastaviť späť na `pending`) – po potvrdení; reset je zaznamenaný v audit logu.
- [ ] **AC-8:** URL stránky je záložkovateľná; nová admin session sa po prihlásení vráti na tento detail.

---

## Technické poznámky

- Aggregovaný read query: JOIN `test_attempts`, `attempt_answers`, `intake_submissions`, `attempt_scores`.
- Audit log pre PII prístup: INSERT do `audit_log` pri každom rozbalení sekcie (client-side event → server endpoint).
- Flag system: `attempt_flags(attempt_id FK, flag_type ENUM, note TEXT, flagged_by, flagged_at)`.
- Reset flow: `UPDATE test_attempts SET status = 'pending', completed_at = NULL WHERE id = {id}` + audit log.

---

## Edge Cases

- Attempt bol anonymizovaný (US-164): celá PII sekcia zobrazuje `[vymazané]`.
- Autor expanduje PII a okamžite obnovuje stránku: audit log zaznamená iba prvé rozbalenie (debounce 30s).
- Otázka bola medzičasom z testu odstránená (edit po publikovaní): odpoveď je stále dostupná s poznámkou „Otázka bola odstránená z aktívnej verzie testu".

---

## Závislosti

- Závisí na: US-101 (zoznam), US-163 (audit log), US-042 (anonymizácia)
- Blokuje: US-130 (PDF export per respondent)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: PII audit log, anonymizácia zobrazenie, flag system
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: PII prístup auditovaný
