# US-052 – Systém vynucuje silnú heslovú politiku

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-052                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Bezpečnosť a heslá              |
| **Rola** | Systém / platforma                 |

---

## User Story

> Ako **platforma**
> chcem **vynucovať silnú heslovú politiku pre všetky heslá (admin aj respondentské)**
> aby som **zabránila útočníkom v použití slabých alebo predvídateľných hesiel a ochránila dáta testov a respondentov**.

---

## Kontext

Silná heslovú politika je základnou bezpečnostnou požiadavkou. Platí pre admin heslo
(US-050) aj respondentské heslo (US-051) rovnako. Systém musí poskytovať real-time
feedback počas písania hesla bez čakania na odoslanie formulára.

---

## Akceptačné kritériá

- [ ] **AC-1:** Minimálne požiadavky na heslo:
  - minimálne **12 znakov**,
  - minimálne **1 veľké písmeno** (A–Z),
  - minimálne **1 malé písmeno** (a–z),
  - minimálne **1 číslica** (0–9),
  - minimálne **1 špeciálny znak** (`!@#$%^&*()_+-=[]{}|;':\",./<>?`).
- [ ] **AC-2:** Systém odmietne heslo z **top-10 000 najpoužívanejších hesiel** (kontrola oproti statickému zoznamu, napr. HaveIBeenPwned top list pri build time).
- [ ] **AC-3:** Systém odmietne heslo, ktoré obsahuje email alebo meno autora (case-insensitive substring match).
- [ ] **AC-4:** Real-time strength meter zobrazuje 4 úrovne: `Slabé / Primerané / Dobré / Silné` s farebným indikátorom; aktualizuje sa po každom stlačení klávesu.
- [ ] **AC-5:** Každá nesplnená požiadavka je zobrazená ako konkrétna položka v zozname (nie všeobecná chyba) – umožňuje autorovi pochopenia čo chýba.
- [ ] **AC-6:** Strength meter algoritmus je implementovaný na klientskej strane (žiadny server round-trip pri písaní); finálna validácia je vždy server-side.
- [ ] **AC-7:** Maximálna dĺžka hesla je **128 znakov** (ochrana pred DoS cez extrémne dlhé vstupy).
- [ ] **AC-8:** Heslo nesmie obsahovať viac ako 3 rovnaké znaky za sebou (napr. `aaa` je zakázané).

---

## Technické poznámky

- Top-10 000 hesiel: generovať ako statický JSON pri build time z verejne dostupného zdroja (napr. `SecLists/Passwords/Common-Credentials/10-million-password-list-top-10000.txt`).
- Strength algoritmus: použiť `zxcvbn` knižnicu alebo vlastnú implementáciu; nevyžaduje sieťové volanie.
- Server-side: rovnaká logika ako klientská (zdieľaný modul) aby nebolo možné bypass klientom.
- Maximálna dĺžka: `max_length = 128` v Zod schema; prevenuje bcrypt DoS (bcrypt ignoruje znaky nad 72 bajtov – upozorniť v komentári).

---

## Edge Cases

- Heslo 72 znakov + špeciálny znak na 73.+ pozícii: bcrypt truncuje na 72 bajtov – zvážiť prehash+bcrypt pattern.
- Autor skopíruje heslo z password managera s medzerami na začiatku/konci: trim pred validáciou, ale informovať o trimovaní.
- Zoznam slabých hesiel je outdated: aktualizovateľný pri každom build cez npm script.

---

## Závislosti

- Závisí na: – (infraštrukturálna story)
- Blokuje: US-050 (admin heslo), US-051 (respondentské heslo)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: všetky validačné pravidlá, top-10k bloklistkontrol, substring detekcia
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Security review schválený
