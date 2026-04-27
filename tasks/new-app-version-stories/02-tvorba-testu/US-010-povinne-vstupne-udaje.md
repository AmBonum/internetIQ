# US-010 – Autor vypĺňa povinné vstupné údaje

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-010                           |
| **Priorita** | P0                           |
| **Stav** | Draft                            |
| **Feature** | Tvorba testu – vstupný formulár |
| **Rola** | Autor / administrátor testu      |

---

## User Story

> Ako **autor testu**
> chcem **vyplniť povinné identifikačné údaje o sebe pred vytvorením testu**
> aby som **bol priradený k testu, mohol dostávať notifikácie a systém mal právny základ pre komunikáciu so mnou**.

---

## Kontext

Vstupný formulár je prvý krok tvorby testu. Povinné údaje slúžia na
identifikáciu autora, umožňujú odosielanie emailov (summary, notifikácie)
a tvoria právny základ spracovania dát. Formulár musí byť minimalizovaný
podľa GDPR princípu „data minimisation" – povinné sú iba tie polia,
bez ktorých systém nemôže fungovať.

---

## Akceptačné kritériá

- [ ] **AC-1:** Formulár obsahuje tieto povinné polia: `Meno a priezvisko / Názov organizácie`, `E-mail`, `Typ používateľa` (výber: Súkromná osoba / Firma / Inštitúcia / Iné).
- [ ] **AC-2:** Pole `E-mail` je validované na formát RFC 5321 na klientskej aj serverovej strane; duplicitný email pre rovnaký test nie je povolený.
- [ ] **AC-3:** Pole `Meno a priezvisko / Názov organizácie` má minimálnu dĺžku 2 znaky a maximálnu 120 znakov; špeciálne HTML znaky sú escapované pred uložením.
- [ ] **AC-4:** Pole `Typ používateľa` je povinný dropdown/radio – bez výberu nie je možné pokračovať na ďalší krok.
- [ ] **AC-5:** Pri odoslaní formulára server vykoná znovu všetky validácie nezávisle od klientskej validácie (defence in depth).
- [ ] **AC-6:** Pred odoslaním formulára autor musí potvrdiť aktívny súhlas so spracovaním osobných údajov (checkbox, nie predvyplnený, s odkazom na Privacy Policy).
- [ ] **AC-7:** Formulár zobrazuje inline chybové hlášky priamo pri príslušnom poli, nie všeobecnú chybu na vrchu stránky.
- [ ] **AC-8:** Stav formulára (vyplnené polia) sa zachová pri navigácii späť v rámci multi-krokového wizard flow (žiadna strata dát pri kliknutí „Späť").

---

## Technické poznámky

- Uloženie: `test_authors(id, display_name, email, user_type ENUM, consent_given BOOL, consent_at TIMESTAMPTZ, created_at)`.
- Email normalizácia: previesť na lowercase pred uložením a porovnaním.
- XSS ochrana: všetky textové vstupy sanitizovať (strip HTML) na serveri pred uložením.
- Wizard state: uchovávať form state v URL search params alebo React context (nie localStorage).
- GDPR: `consent_given` a `consent_at` sú auditovateľné polia – nikdy ich nemaž, len archivuj.

---

## Edge Cases

- Autor zadá email s neplatnou TLD (napr. `.loca`): server-side regex overenie odmietne.
- Autor kopíruje a vkladá celé meno s nadbytočnými medzerami: trim() pred uložením.
- JavaScript je vypnutý: formulár musí byť funkčný ako native HTML form + POST, nie len SPA fetch.
- Autor vyplní formulár, ale pred odoslaním stratí pripojenie: zobraziť informáciu o strate pripojenia; po obnovení permettovať opätovné odoslanie.

---

## Závislosti

- Závisí na: US-012 (definovanie účelu spracovania), US-013 (GDPR súlad)
- Blokuje: US-020 (výber testov), US-050 (nastavenie hesiel), US-060 (generovanie linku)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: každé validačné pravidlo pre každé pole
- [ ] Integračné test: kompletný wizard krok 1 → krok 2 bez straty dát
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] GDPR checklist: súhlas checkbox, privacy link, auditovateľné uloženie
