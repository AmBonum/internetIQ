# US-132 – Respondent dostáva výsledky emailom

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-132                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Export                            |
| **Rola** | Respondent                           |

---

## User Story

> Ako **respondent**
> chcem **dostať email so svojimi výsledkami po dokončení testu**
> aby som **mal trvalý záznam výsledkov bez nutnosti udržiavať session**.

---

## Kontext

Táto story nadväzuje na US-092 (výsledky emailom ako opt-in). Tu sa špecifikuje
konkrétny obsah emailu, bezpečnostný model prístupu k výsledkom, a spôsob doručenia.
Email je opt-in pri dokončení testu (nie predtým).

---

## Akceptačné kritériá

- [ ] **AC-1:** Na completion stránke testu je formulár „Zaslať výsledky na email" s emailovým poľom (predvyplnené ak respondent zadal email v intake). Formulár je dobrovoľný a jasne označený.
- [ ] **AC-2:** Email obsahuje: priateľský súhrn výsledkov (skóre, percentil, čas), stručné hodnotenie (napr. „Nad priemerom") a odkaz na detailné výsledky (secure token link).
- [ ] **AC-3:** Email neobsahuje: plné znenia otvorených odpovedí respondenta, odpovede iných respondentov, PII nad rámec emailovej adresy prijímateľa.
- [ ] **AC-4:** Odkaz v emaile je jednorazový prístupový token (`result_access_tokens`): 64-byte crypto-random, expiry 30 dní, single-session (nie persistent auth).
- [ ] **AC-5:** Respondent môže požiadať o opätovné zaslanie emailu max 3×/deň (rate limit na emailovú adresu + IP).
- [ ] **AC-6:** Email je doručený asynchrónne (nie synchrónny req): completion stránka nevráti chybu ak email dispatch zlyhá – zaloguje sa a retry 3× (backoff).
- [ ] **AC-7:** Unsubscribe link umožňuje respondentovi odhlásiť sa zo všetkých budúcich emailov z tejto platformy (nie len z jedného testu). Stav sa uloží do `email_unsubscribes(email_hash, unsub_at)` – email je hashovaný (SHA-256), originál sa neukladá.
- [ ] **AC-8:** Ak je autorsky definovaná retention expirácia testu, odkaz na výsledky expiruje spolu s testom (whichever comes first: 30 dní alebo test expiry).

---

## Technické poznámky

- `result_access_tokens(token_hash TEXT PK, attempt_id UUID, expires_at TIMESTAMPTZ, used_at TIMESTAMPTZ)` – token hash (SHA-256 tokenu), nie plain text.
- Email unsubscribe: `HMAC-SHA256(email, platform_secret)` pre konzistentný hash (nie plain SHA-256, aby bolo odolné voči rainbow tables).
- Odosielateľ: rovnaký email provider ako US-121 (Resend / Postmark).

---

## Edge Cases

- Respondent zadá inú emailovú adresu než v intake: platná (respondent môže mať pracovný vs súkromný email).
- Email bounced (neexistujúca adresa): bounce webhook zaloguje, retry sa neopakuje pre hard bounce.
- Platforma GDPR mazanie respondenta (US-143): `result_access_tokens` s týmto `attempt_id` sú zmazané – odkaz prestane fungovať.

---

## Závislosti

- Závisí na: US-082 (completion súhrn – zdroj dát), US-092 (opt-in mechanizmus)
- Blokuje: US-143 (GDPR mazanie musí zahŕňať result_access_tokens)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: rate limit 3/deň, token single-use, unsubscribe hash
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: žiadne plain text emailové adresy v unsubscribe tabuľke
