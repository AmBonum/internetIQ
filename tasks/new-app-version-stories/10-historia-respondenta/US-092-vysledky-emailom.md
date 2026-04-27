# US-092 – Respondent obdrží výsledky emailom

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-092                             |
| **Priorita** | P2                             |
| **Stav** | Draft                              |
| **Feature** | História respondenta            |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **obdržať svoje výsledky emailom po dokončení testu**
> aby som **mal trvalú kópiu výsledkov aj po expirácii session a mohol ich zdieľať so svojím manažérom alebo si ich archivovať**.

---

## Kontext

Po expirácii respondentskej session (4 hodiny) sú výsledky prístupné iba cez email.
Email sa odosiela na adresu zadanú v intake formulári. Ak respondent email nezadal
alebo odmietol email notifikáciu, táto funkcionalita je nedostupná.

---

## Akceptačné kritériá

- [ ] **AC-1:** Po dokončení testu (US-082) je respondentovi ponúknutá voľba „Poslať výsledky na email" (ak má email v intake formulári); voľba je opt-in, nie automatická.
- [ ] **AC-2:** Ak respondent zvolí email výsledky, systém odošle email s:
  - Menom respondenta (ak zadal)
  - Názvom testu / sady
  - Dátumom a časom dokončenia
  - Výsledkami (skóre, percentil, čas) – iba pre dokončené testy
  - Odkazom na výsledkovú stránku (platný 30 dní)
  - Odkaz na Privacy Policy
- [ ] **AC-3:** Link na výsledkovú stránku v emaili je jednorazový čitateľný token (nie trvalý prístup); exspiruje po 30 dňoch.
- [ ] **AC-4:** Email **neobsahuje** odpovede respondenta na otvorené otázky (iba súhrnné štatistiky) – ochrana súkromia.
- [ ] **AC-5:** Respondent môže výsledkový email požiadať znovu z výsledkovej stránky (max 3× za 24 hodín).
- [ ] **AC-6:** Ak respondent email nezadal v intake formulári, tlačidlo „Poslať emailom" je nahradené textom: „Pre emailové výsledky zadajte email v ďalšom teste."
- [ ] **AC-7:** Email je odoslaný do 5 minút od požiadavky; pri zlyhaní systém retry 3× s exponential backoff.

---

## Technické poznámky

- Výsledkový token: `result_access_tokens(token_hash, attempt_id FK, created_at, expires_at, used_count INT)`.
- Email template: zdieľaný s US-062 (react-email alebo handlebars).
- 30-dňová expirácia: `expires_at = now() + INTERVAL '30 days'`.
- Rate limit 3×/deň: `used_count` alebo dedikovaný rate limit counter.

---

## Edge Cases

- Respondent nemá email v intake formulári ale zadá email pri požiadavke o výsledky: uložiť email iba do email-request záznamu, nie zpätne do intake dát (bez zmeny pôvodného súhlasu).
- Email sa nedoručí (bounce): systém zaznamená bounce; respondent vidí možnosť zadať iný email.
- Výsledkový link exspiroval: čítač zobrazí „Platnosť linku vypršala" bez zobrazenia výsledkov.

---

## Závislosti

- Závisí na: US-082 (výsledky), US-062 (email infraštruktúra), US-040 (intake email pole)
- Blokuje: –

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: token generovanie, 30-dňová expirácia, rate limit
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: email výsledky GDPR-konformné
