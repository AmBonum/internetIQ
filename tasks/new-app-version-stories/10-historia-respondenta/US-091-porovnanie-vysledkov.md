# US-091 – Respondent porovnáva výsledky z viacerých testov

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-091                             |
| **Priorita** | P3                             |
| **Stav** | Draft                              |
| **Feature** | História respondenta            |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **vizuálne porovnať svoje výsledky naprieč testami v sade**
> aby som **pochopil svoje silné a slabé stránky v rôznych oblastiach a získal komplexnejší pohľad na výsledky**.

---

## Kontext

Porovnávacia stránka je rozšírenie histórie (US-090) pre sady testov s viac ako 1
testom. Zobrazuje výsledky vizuálne (graf, tabuľka) pre lepší insight. Je to
P3 funkcia – vizuálny enhancement, niečo nav-yše k základnej histórii.

---

## Akceptačné kritériá

- [ ] **AC-1:** Ak respondent dokončil 2+ testy v sade, je dostupné tlačidlo „Porovnať výsledky".
- [ ] **AC-2:** Porovnávacie zobrazenie obsahuje: tabuľku s výsledkami každého testu (skóre, percentil, čas) a vizuálny graf (radar/bar chart) ak testy obsahujú kategoriálne skóre.
- [ ] **AC-3:** Graf je renderovaný klientsky (nie screenshot) – prístupný aj bez vizuálu (tabuľková alternatíva pre screen readery).
- [ ] **AC-4:** Zobrazenie je dostupné iba v rámci platnej respondentskej session.
- [ ] **AC-5:** Pre testy bez bodovaniaj sa zobrazí iba tabuľka so stavom dokončenia a časom; graf sa nezobrazuje (žiadne prázdne grafy).

---

## Technické poznámky

- Graf: `recharts` alebo `chart.js` – lightweight, SSR-kompatibilná.
- Dáta: composited z `attempt_score` tabuľky pre vybraté testy v session.
- A11y: `<table>` fallback pod grafom pre screen readery.

---

## Edge Cases

- Testy v sade majú rôzne kategórie skóre (nekompatibilné): radar chart nie je možný – zobraziť iba tabuľku.
- Jeden test bol prerušený: zahrnutý v tabuľke ako „nedokončený", vynechaný z grafového porovnania.

---

## Závislosti

- Závisí na: US-090 (história)
- Blokuje: –

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] A11y audit: grafová/tabuľková dualita
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
