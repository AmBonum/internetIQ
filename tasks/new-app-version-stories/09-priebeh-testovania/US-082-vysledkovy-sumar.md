# US-082 – Respondent vidí výsledkový sumár po dokončení

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-082                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Priebeh testovania              |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **po dokončení testu alebo celej sady testov vidieť prehľadný súhrn svojich výsledkov**
> aby som **pochopil, ako som si viedol, a mal možnosť výsledky stiahnuť alebo zdieľať**.

---

## Kontext

Výsledková stránka je záverečná obrazovka pre respondenta. Musí byť informatívna,
motivujúca a transparentná. Zobrazuje iba dáta, ku ktorým má respondent právo
(svoje vlastné výsledky), nie dáta ostatných.

---

## Akceptačné kritériá

- [ ] **AC-1:** Po dokončení testu systém zobrazí: Celkové skóre (ak test používa bodovanie), percentil (ak je k dispozícii), počet správnych/nesprávnych odpovedí (ak je test hodnotiteľný), odhadovaný percentuálny výsledok v kategóriách, čas dokončenia (celková dĺžka), dátum a čas dokončenia.
- [ ] **AC-2:** Pre sadu testov zobrazí: celkový sumár sady (agregovaný výsledok), sumár každého testu v sade osobitne, porovnanie výsledkov medzi testami.
- [ ] **AC-3:** Respondent vidí **iba svoje výsledky** – nikdy dáta iných respondentov.
- [ ] **AC-4:** Stránka ponúka akcie: `Stiahnuť výsledky (PDF)`, `Poslať výsledky emailom`, `Vidieť históriu` (US-090, ak sada).
- [ ] **AC-5:** Ak autor nevyplnil bodovanie alebo test nie je hodnotiteľný (napr. súbor otvorených otázok), zobrazí sa neutralné „Potvrdenie dokončenia" bez skóre.
- [ ] **AC-6:** Výsledková stránka je dostupná po celú dobu platnosti respondentskej session (4 hodiny); po expirácii je dostupná cez email link (US-092).
- [ ] **AC-7:** Stránka neobsahuje žiadne výzvy na zdieľanie na sociálnych sieťach (bez explicitnej požiadavky autora – ochrana súkromia respondenta).
- [ ] **AC-8:** Ak je test anonymizovaný (autor nastavil anonymizáciu polí), výsledky zobrazujú iba „Vaše odpovede boli anonymizované podľa nastavenia testu."

---

## Technické poznámky

- Scoring: `attempt_score(attempt_id FK, total_score, max_score, category_scores JSONB, calculated_at)`.
- Pre testy bez bodovaniaj: `total_score = NULL`, UI zobrazí completion confirmation.
- PDF generovanie: server-side (napr. Puppeteer alebo `@react-pdf/renderer`); nie client-side blob.
- Session-based access: výsledky dostupné iba v rámci platnej session; trvalý prístup cez email token (US-092).

---

## Edge Cases

- Respondent vyplnil test ale bodovanie ešte nebolo definované: zobraziť „Výsledky čoskoro. Kontaktujte organizátora testu."
- Sada nie je kompletne dokončená (respondent odišiel po 2/3 testoch): zobraziť čiastkový sumár dostupných testov s upozornením.
- Respondent sa pokúsi zobraziť výsledky iného respondenta cez URL manipulation: RLS + server-side session validácia zablokuje prístup.

---

## Závislosti

- Závisí na: US-080 (dokončenie testu), US-081 (sada testov)
- Blokuje: US-092 (emailové výsledky), US-090 (história)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: scoring kalkulácia, session-based access control
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
