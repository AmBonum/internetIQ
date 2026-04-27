# US-143 – Systém umožňuje GDPR žiadosti dotknutých osôb (DSR)

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-143                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Legal a privacy                   |
| **Rola** | Respondent / dotknutá osoba + Systém |

---

## User Story

> Ako **respondent (dotknutá osoba)**
> chcem **mať možnosť uplatniť práva podľa GDPR (prístup, výmaz, prenositeľnosť)**
> aby som **mal kontrolu nad svojimi osobnými dátami v súlade s GDPR čl. 15–20**.

---

## Kontext

GDPR garantuje dotknutým osobám práva: mať prístup k svojim dátam, požiadať o výmaz
(„právo byť zabudnutý"), požiadať o opravu, obmedziť spracovanie a preniesť dáta.
Platforma musí tieto žiadosti (DSR – Data Subject Requests) spracovať do 30 dní.
Identifikácia respondenta je komplikovaná (nemajú účet) – overenie identity prebieha
cez emailovú adresu a attempt token.

---

## Akceptačné kritériá

- [ ] **AC-1:** Respondent môže podať DSR cez dedikovaný formulár na `/gdpr-request`: email adresa, typ žiadosti (prístup / výmaz / oprava / prenositeľnosť / obmedzenie), voliteľný popis.
- [ ] **AC-2:** Po podaní formulára systém odošle overovací email na zadanú adresu s jednorazovým potvrdzovacom linkom (token expiry 48h). DSR sa spracuje **len po kliknutí na overovací link** (ochrana pred zneužitím tretou osobou).
- [ ] **AC-3:** **Právo na prístup**: systém automaticky vygeneruje JSON/PDF so všetkými personal dátami viazanými na daný email (attempts, intake odpovede, consent záznamy, event log). Generovanie prebieha do 30 dní, respondent dostane email s download linkom (signed URL, expiry 7 dní).
- [ ] **AC-4:** **Právo na výmaz**: systém vymaže alebo anonymizuje všetky osobné dáta respondenta: intake polia s PII → NULL, email → NULL, attempt_id ostáva (referenčná integrita), odpovede na otvorené otázky → NULL, result_access_tokens zmazané.
- [ ] **AC-5:** **Výmaz neplatí pre**: zákonné povinnosti uchovávania (napr. fakturačné záznamy ak existujú, audit log akceptácie VOP – `test_consents`).
- [ ] **AC-6:** **Právo na prenositeľnosť**: výstup je štruktúrovaný JSON (kompatibilný s US-133 schémou) obsahujúci osobné dáta respondenta.
- [ ] **AC-7:** Každá DSR žiadosť je zaznamenaná v `dsr_requests(id, email_hash, request_type, submitted_at, verified_at, completed_at, status)`. Status: `pending_verification → verified → processing → completed / rejected`.
- [ ] **AC-8:** Pokiaľ autor testu je tiež správca (joint-controller) respondentových dát, DSR formulár obsahuje upozornenie, že niektoré dáta patria pod správu autora testu a platforma ich vie anonymizovať, nie garantovane vymazať zo systémov autora.

---

## Technické poznámky

```sql
CREATE TABLE dsr_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_hash    TEXT NOT NULL,   -- HMAC-SHA256(email, secret)
  request_type  TEXT NOT NULL CHECK (request_type IN ('access','erasure','rectification','portability','restriction')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at   TIMESTAMPTZ,
  token_hash    TEXT,            -- HMAC-SHA256(verification_token, secret)
  completed_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending_verification'
);
```

- Anonymizácia (nie hard-delete): `UPDATE attempts SET respondent_email = NULL, ... WHERE respondent_email_hash = ?`.
- 30-dňový SLA: pg_cron alert ak DSR zostane v stave `verified` > 25 dní (interné upozornenie).

---

## Edge Cases

- Respondent podá duplicitnú žiadosť pred dokončením prvej: systém informuje „Máte jednu aktívnu žiadosť. Spracujeme ju do 30 dní."
- Overovací link expiruje: respondent môže podať novú žiadosť.
- Email respondenta neexistuje v DB (nenašiel sa): systém odošle generickú odpoveď „Ak sme spravovali Vaše dáta, spracujeme ju" (bezpečnostný dôvod – neodhaľovať existenciu záznamu).

---

## Závislosti

- Závisí na: US-140 (PP popisuje DSR práva), US-012–013 (zbierané dáta), US-132 (result_access_tokens treba zmazať)
- Blokuje: nič priamo (terminálna legal story)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: anonymizácia zachováva attempt_id, výmaz zmazáva result_access_tokens
- [ ] Integračný test: DSR email verifikácia flow end-to-end
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy/legal review: 30-dňový SLA mechanizmus overený, audit log kompletný
