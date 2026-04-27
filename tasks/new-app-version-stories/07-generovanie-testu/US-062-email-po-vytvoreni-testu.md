# US-062 – Systém odošle autorovi email po vytvorení testu

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-062                             |
| **Priorita** | P1                             |
| **Stav** | Draft                              |
| **Feature** | Generovanie testu               |
| **Rola** | Systém / platforma                 |

---

## User Story

> Ako **autor testu**
> chcem **dostať potvrdzovací email po úspešnom vytvorení testu**
> aby som **mal zálohu dôležitých informácií o teste (link, summary), ktorú si môžem archivovať a kedykoľvek si prečítať**.

---

## Kontext

Potvrdzovací email slúži aj ako doručenie prístupu k admin stránke, keby autor
zabudol URL. Je to tiež právna stopa – dokazuje, kedy bol test vytvorený a akú
konfiguráciu mal. Email musí byť odoslaný asynchronne (nie blokovať UI).

---

## Akceptačné kritériá

- [ ] **AC-1:** Email sa odosiela na adresu zadanú v povinnom vstupnom formulári (US-010) okamžite po úspešnom vytvorení testu (asynchronná fronta, max 2 minúty oneskorenie).
- [ ] **AC-2:** Predmet emailu: `„Váš test bol úspešne vytvorený – [Názov testu]"`
- [ ] **AC-3:** Email obsahuje tieto informácie:
  - Meno autora (z US-010)
  - Názov testu / sady
  - Custom link pre respondentov (klikateľný)
  - Odkaz na admin summary stránku
  - Účel testovania (US-012)
  - Typ a počet testov/otázok
  - Stav respondentského hesla: „Heslo nastavené: ÁNO / NIE" (bez zobrazenia samotného hesla)
  - Dátum a čas vytvorenia
  - Odkaz na Privacy Policy
- [ ] **AC-4:** Email **neobsahuje** plain-text heslá ani admin heslo v akejkoľvek forme.
- [ ] **AC-5:** Email má HTML aj plain-text verziu (multipart); HTML verzia je responzívna (mobile-first).
- [ ] **AC-6:** Ak odoslanie emailu zlyhá, systém to zaznamená do error logu, retry 3× s exponential backoff; po vyčerpaní retries zaznamená incident (nie blokuje vytvorenie testu).
- [ ] **AC-7:** Email obsahuje patičku s: názvom platformy, odkazom na unsubscribe z transakcionalnych emailov, kontaktnou adresou.
- [ ] **AC-8:** Email je odosielaný cez overenú doménu (SPF, DKIM, DMARC nakonfigurované) aby nepadol do spamu.

---

## Technické poznámky

- Email provider: Resend, Postmark alebo Sendgrid – konfigurovateľné cez env variable `EMAIL_PROVIDER`.
- Templates: serverové handlebars/react-email šablóny; nie inline HTML v kóde.
- Async odoslanie: Supabase Edge Function alebo Queue (pg_notify + worker).
- Unsubscribe: implementovať List-Unsubscribe header (RFC 8058) a one-click unsubscribe endpoint.
- DKIM/SPF: konfigurácia v DNS a email provider – dokumentovať v DEPLOYMENT.md.

---

## Edge Cases

- Emailová adresa autora neexistuje (typo): bounced email sa zaznamená; UI to neindikuje (autor nevidí bounce v reálnom čase).
- Email padol do spamu: autor si môže znovu odoslať email z admin summary stránky (resend akcia, max 3×/deň).
- Test vytvorený počas výpadku email providera: retry mechanizmus sa postará o doručenie po obnovení.

---

## Závislosti

- Závisí na: US-061 (summary stránka – obsah emailu), US-060 (custom link)
- Blokuje: US-121 (notifikačný systém)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: email template renderovanie, retry logika
- [ ] Integračný test: vytvorenie testu → email odoslaný (s test email providerom)
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] DEPLOYMENT.md aktualizovaný o email konfiguráciu
