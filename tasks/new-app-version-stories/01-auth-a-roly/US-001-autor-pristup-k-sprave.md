# US-001 – Autor sa registruje a pristupuje k správe testov

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-001                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Autentifikácia a roly           |
| **Rola** | Autor / administrátor testu        |

---

## User Story

> Ako **autor testu**
> chcem sa **zaregistrovať, prihlásiť a pristupovať k správe svojich testov**
> aby som **mohol vytvárať, editovať a spravovať testy a ich výsledky bez toho, aby k nim mal prístup niekto iný**.

---

## Kontext

Autor je primárny používateľ systému, ktorý vytvára testy, nastavuje zberové polia,
generuje custom linky a spravuje výsledky. Prístup do admin časti musí byť
chránený heslom nastaveným pri tvorbe testu – systém nevyžaduje tradičnú registráciu
cez e-mail/heslo účet, ale autentifikáciu na úrovni konkrétneho testu cez admin heslo
(pozri US-050). Ak platforma v budúcnosti pridá trvalé používateľské účty,
táto story definuje základ pre tú vrstvu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor sa dostane do sekcie „Generovať test" z hlavnej navigácie bez potreby existujúceho účtu.
- [ ] **AC-2:** Pri vytváraní testu systém vyžaduje zadanie e-mailovej adresy autora, ktorá slúži ako primárny identifikátor pre notifikácie a prístup.
- [ ] **AC-3:** Admin dashboard pre konkrétny test je chránený admin heslom (US-050); bez správneho hesla systém zobrazí chybovú hlášku a neumožní prístup.
- [ ] **AC-4:** Po zadaní správneho admin hesla systém vydá session token (napr. httpOnly cookie alebo krátko žijúci JWT) s definovanou expiráciou (max 8 hodín aktivity, max 24 hodín absolútne).
- [ ] **AC-5:** Systém nezobrazuje iné testy toho istého autora – každý test má izolovanú admin session.
- [ ] **AC-6:** Po vypršaní session je autor presmerovaný na prihlasovací formulár pre daný test a jeho pred-session stav nie je zachovaný.
- [ ] **AC-7:** Systém zaznamenáva neúspešné pokusy o prihlásenie (timestamp, IP) a po 5 neúspešných pokusoch v okne 15 minút dočasne zablokuje prístup (rate limiting).
- [ ] **AC-8:** Celý admin prístup prebieha výhradne cez HTTPS; akýkoľvek HTTP request je presmerovaný na HTTPS.

---

## Technické poznámky

- Session management: Supabase RLS + custom `admin_sessions` tabuľka alebo signed cookie s HMAC.
- Rate limiting: implementovať na úrovni Cloudflare Pages Function / Edge middleware, nie len UI.
- IP blokovanie nesmie trvalo blokovať NAT IP adresy – po 30 minútach sa limit resetuje.
- Audit log: každý úspešný a neúspešný login zaznamenať do `audit_log` (pozri US-163).
- V budúcej verzii (trvalé účty): migrovať na Supabase Auth (magic link alebo OAuth).

---

## Edge Cases

- Autor zabudne admin heslo: systém ponúkne reset cez overovací email (US-062 definuje emailovú vrstvu).
- Autor pokúša preniknúť do admin sekcie iného testu: RLS + aplikačná vrstva musia byť nezávislé kontroly.
- Platnosť session vyprší počas práce: pred-session form data sa stratia – upozorniť autora pred expiráciou (napr. 5 min pred koncom zobraziť toast).
- Autor pristupuje z viacerých tabov: každý tab musí dostať rovnakú session, nie duplicitnú.

---

## Závislosti

- Závisí na: US-050 (admin heslo), US-053 (bezpečné ukladanie hesiel)
- Blokuje: US-061 (summary page), US-100 (admin dashboard), US-121 (notifikácie)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: validácia session tokenu, rate limiting logika
- [ ] Integračné testy: login flow, expired session redirect
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Bezpečnostný audit: žiadne citlivé údaje v URL, žiadne tokeny v localStorage
