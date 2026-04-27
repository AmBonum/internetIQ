# US-032 – Otázka podporuje všetky typy odpovedí

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-032                           |
| **Priorita** | P1                           |
| **Stav** | Draft                            |
| **Feature** | Správa otázok                |
| **Rola** | Správca systému / platforma      |

---

## User Story

> Ako **správca platformy**
> chcem **definovať pre každú otázku typ odpovede z rozšírenej množiny typov**
> aby som **mohol vytvárať rôznorodé otázky prispôsobené konkrétnym meracím cieľom a zber dát bol štruktúrovaný**.

---

## Kontext

Rôzne typy otázok si vyžadujú rôzne UI komponenty aj rôznu serverovú validáciu.
Definícia typov odpovedí je infraštrukturálna – určuje, ako systém renderuje otázku
respondentovi a ako validuje a ukladá odpoveď.

---

## Akceptačné kritériá

- [ ] **AC-1:** Systém podporuje tieto typy odpovedí (každý s konkrétnym UI komponentom):

  | Typ            | UI komponent                        | Validácia                        |
  |----------------|-------------------------------------|----------------------------------|
  | `short_text`   | jednoriadkový textový input         | min/max znakov                   |
  | `long_text`    | viacriadkový textarea               | min/max znakov                   |
  | `number`       | číselný input                       | min/max hodnota, celé/desatinné  |
  | `percentage`   | číselný input (0–100)               | rozsah 0–100                     |
  | `currency`     | číselný input s menou (dropdown)    | min/max, 2 desatinné miesta      |
  | `date`         | date picker                         | min/max dátum, formát            |
  | `time`         | time picker                         | 24h alebo 12h formát             |
  | `datetime`     | datetime picker                     | kombinovaná validácia            |
  | `range`        | slider s min/max hodnotami          | konfigurovateľný rozsah a krok   |
  | `single_choice`| radio group                         | povinná jedna odpoveď            |
  | `multi_choice` | checkbox group                      | min/max počet výberu             |
  | `email`        | email input                         | RFC 5321 formát                  |
  | `phone`        | phone input s country prefix        | E.164 formát                     |
  | `checkbox`     | single boolean checkbox             | optional/required                |
  | `rating`       | hviezdy alebo číselný rating (1–5 / 1–10) | konfigurovateľný rozsah  |

- [ ] **AC-2:** Pre typy `single_choice` a `multi_choice` je možné definovať zoznam možností (options) priamo pri otázke; minimálne 2 možnosti.
- [ ] **AC-3:** Pre každý typ odpovede je možné nastaviť `required: true | false` – povinnosť odpovede.
- [ ] **AC-4:** Pre typy s numerickými hodnotami (`number`, `percentage`, `currency`, `range`) je možné nastaviť `min` a `max` boundary.
- [ ] **AC-5:** Každý typ odpovede má serializovanú schému uloženú v `question_answer_config JSONB` – umožňuje bez-migračnú rozšíriteľnosť.
- [ ] **AC-6:** Renderovanie otázky na strane respondenta musí byť prístupné (WCAG 2.1 AA): labely, error messaging, keyboard navigation.
- [ ] **AC-7:** Neznámy typ odpovede (napr. z budúcej verzie importu) musí byť gracefully degradovaný na `short_text` s upozornením v admin UI.

---

## Technické poznámky

- `answer_type ENUM` v PostgreSQL; na rozšírenie pridať nové enum hodnoty migráciou.
- `question_answer_config JSONB` ukladá per-type konfiguráciu: `{ min, max, options: [{value, label}], step, currency, … }`.
- UI komponenty: jeden `<QuestionRenderer type={type} config={config} />` komponent s type-switch internátne.
- Validácia odpovedí: zdieľaná Zod schema medzi klientom a serverom.

---

## Edge Cases

- `multi_choice` s `min_selections > max_options`: blokujúca validácia pri tvorbe otázky.
- `range` kde `min > max`: blokujúca validácia.
- Respondent zadá veľmi dlhý text do `short_text`: server truncate a evidovanie pokusu.
- `currency` s menovým kódom, ktorý systém nepozná: odmietnutie s listom podporovaných mien.

---

## Závislosti

- Závisí na: US-031 (metadata otázky)
- Blokuje: US-080 (renderovanie testu respondentovi), US-041 (validačné pravidlá zberových polí)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: validácia každého typu odpovede vrátane boundary values
- [ ] UI testy: renderovanie každého komponentu v Storybook alebo RTL test
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Accessibility audit: WCAG 2.1 AA pre každý input komponent
