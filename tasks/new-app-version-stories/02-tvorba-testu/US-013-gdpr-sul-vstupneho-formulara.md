# US-013 – Systém zabezpečuje GDPR súlad vstupného formulára

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-013                           |
| **Priorita** | P0                           |
| **Stav** | Draft                            |
| **Feature** | Tvorba testu – vstupný formulár |
| **Rola** | Systém / platforma               |

---

## User Story

> Ako **platforma**
> chcem **zabezpečiť, že celý vstupný formulár pre tvorbu testu je v plnom súlade s GDPR a slovenskou legislatívou**
> aby som **ochránila subjekty dát, minimalizovala právne riziká a mohla preukázať súlad pri audite**.

---

## Kontext

Táto story je systémová (nie user-facing v pravom zmysle) a definuje požiadavky na
compliance vrstvu formulára. Pokrýva minimalizáciu dát, informovaný súhlas,
účelové obmedzenie, transparentnosť a práva dotknutých osôb. Je predpokladom pre
US-010, US-011 a US-012.

---

## Akceptačné kritériá

- [ ] **AC-1:** Každé pole zbierané vo formulári musí mať priradený právny základ spracovania (`legal_basis ENUM('consent','legitimate_interest','contract','legal_obligation')`) zaznamenaný v systémovej konfigurácii.
- [ ] **AC-2:** Formulár zobrazuje odkaz na Privacy Policy (US-140) pred odoslaním; odkaz sa otvára v novom tabe.
- [ ] **AC-3:** Súhlas so spracovaním osobných údajov je granulárny: oddelené checkboxy pre obligatórne spracovanie (pre fungovanie služby) a voliteľné marketingové spracovanie; nie je možné ich spojiť do jedného checkboxu.
- [ ] **AC-4:** Systém ukladá kompletný súhlas-record: `{ field_id, consent_given, timestamp, ip_hash (SHA-256 prvých 3 oktetov), form_version }` – auditovateľné, nemenné.
- [ ] **AC-5:** Formulár obsahuje viditeľnú sekciu „Vaše práva" s odkazmi na: právo na prístup, opravu, vymazanie, prenosnosť a námietku.
- [ ] **AC-6:** Retencia dát: pri vytvorení testu systém automaticky nastaví `data_retention_days = 365` (1 rok) ako default; autor môže skrátiť, nie predĺžiť nad 730 dní (2 roky).
- [ ] **AC-7:** Formulár je dostupný bez akýchkoľvek tracking cookies (vykoná sa až po súhlase z ConsentBanner).
- [ ] **AC-8:** Celý wizard formulára je dostupný v slovenčine; anglický preklad je voliteľný v budúcej iterácii.

---

## Technické poznámky

- `form_version`: sémantické číslo verzie formulára uložené pri každom súhlase – pri zmene formulára sa inkrementuje, aby bolo auditovateľné, ktorú verziu autor odsúhlasil.
- Retenčný job: Supabase Edge Function alebo pg_cron, ktorá denne skontroluje záznamy s exspirovaným `expires_at` a spustí anonymizačný flow (US-164).
- IP hash: nikdy neukladaj presnú IP; SHA-256 prvých 3 oktetov umožňuje grobe geolokáciu bez PII.
- Existujúci `ConsentBanner` a `ConsentPreferencesDialog` komponent musia zostať kompatibilné s touto vrstvou.

---

## Edge Cases

- Autor odmietne marketingový súhlas ale odsúhlasí obligatórne spracovanie: systém pokračuje, marketingové polia sa nepredvypĺňajú ani neukladajú.
- CONSENT_VERSION sa zmení po odoslaní formulára: starý consent ostáva platný do jeho expirácie; nový consent sa vyžiada pri ďalšom vstupe.
- Autor žiada vymazanie svojich dát pred vypršaním retenčnej doby: systém musí spracovať žiadosť do 30 dní (GDPR čl. 17).

---

## Závislosti

- Závisí na: US-010, US-011, US-012 (definujú, čo sa zbiera), US-140 (Privacy Policy)
- Blokuje: US-060 (generovanie testu bez platného GDPR záznamu nie je povolené), US-164 (anonymizácia)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: granulárny consent model, form_version inkrementácia
- [ ] GDPR checklist prejdený s legal review
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy Policy aktualizovaná o nové spracovanie dát
