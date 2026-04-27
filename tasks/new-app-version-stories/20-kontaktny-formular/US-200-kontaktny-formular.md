# US-200 – Používateľ odosieľa kontaktný / podporný dotaz

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-200                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Kontaktný formulár                |
| **Rola** | Akýkoľvek návštevník (reg. aj anonym.) |

---

## User Story

> Ako **návštevník platformy**
> chcem **odoslať dotaz alebo správu prevádzkovateľovi platformy**
> aby som **dostal pomoc alebo informácie, aj keď nie som registrovaný**.

---

## Kontext

Kontaktný formulár slúži ako primárny asynchrónny kanál medzi návštevníkmi
a prevádzkovateľom. Zbiera dotazy, hlásenia problémov, obchodné záujmy.
Formulár musí byť dostupný z viacerých miest (pätička, `/contact`, help centrum).

---

## Akceptačné kritériá

- [ ] **AC-1:** Kontaktný formulár je dostupný na `/contact` a ako inline sekcia na `/help` (US-150). Odkaz „Kontakt" je v pätičke každej stránky.
- [ ] **AC-2:** Formulár obsahuje polia:
  - **Email** (povinný, validácia formátu)
  - **Typ dotazu** (select: Technická pomoc / Obchodná otázka / Nahlásenie problému / GDPR žiadosť / Iné)
  - **Predmet** (povinný, max 150 znakov)
  - **Správa** (povinný, max 2000 znakov)
  - **Meno** (voliteľné, max 100 znakov)
  - GDPR checkbox: „Súhlasím so spracovaním mojich kontaktných údajov pre účely zodpovedania môjho dotazu" (povinný, nie predzaškrtnutý)
- [ ] **AC-3:** Pre **prihláseného používateľa** je email predvyplnený z profilu (neodstrániteľný, len zobrazený).
- [ ] **AC-4:** Odoslanie formulára je chránené pred spamom: Cloudflare Turnstile (alebo Hcaptcha) `challenge` widget – nenápadný (`managed` mode), nevyžaduje kliknutie od reálnych používateľov.
- [ ] **AC-5:** Po úspešnom odoslaní sa zobrazí potvrdenie s ticket číslom (napr. „#20240427-1234") a textom „Odpovedáme zvyčajne do 2 pracovných dní." Formulár nie je reset-nuteľný opakovane (rate limit: 3 správy per email per 24h).
- [ ] **AC-6:** Záznam v DB: `contact_inquiries(id, ticket_number, email, name, inquiry_type, subject, message, status, created_at, updated_at, resolved_at, admin_note, user_id NULLABLE)`. Pre prihláseného user: `user_id` je nastavené.
- [ ] **AC-7:** Automatická potvrdzovacia odpoveď na zadaný email s ticket číslom a súhrnom správy (react-email šablóna). **Neobsahuje** celé znenie správy (ochrana pred phishing/replay).
- [ ] **AC-8:** Typ dotazu „GDPR žiadosť" zobrazí extra informáciu: „Pre formálnu GDPR žiadosť použite [tento formulár](/gdpr-request)" (link na US-143 flow) – a oba systémy fungujú paralelne.

---

## Technické poznámky

```sql
CREATE TABLE contact_inquiries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number  TEXT NOT NULL UNIQUE,   -- 'INQ-' || to_char(now(),'YYYYMMDD') || '-' || lpad(sequence::text,4,'0')
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email          TEXT NOT NULL,
  name           TEXT,
  inquiry_type   TEXT NOT NULL,
  subject        TEXT NOT NULL,
  message        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed','spam')),
  admin_note     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);
```

- Cloudflare Turnstile: server-side token verifikácia pred insertom (Edge Function).
- Rate limit: `contact_rate_limits(email_hash, sent_at[])` – rolling 24h window, max 3.
- Ticket číslo: sekvenčné per deň, nie UUID (pre human communication).

---

## Edge Cases

- Rovnaký email pošle 4. správu za 24h: `429 Too Many Requests` s informáciou kedy sa limit resetuje.
- Turnstile verifikácia zlyhá (bot): `400 Bad Request`, žiadny DB insert, žiadna odpoveď boťovi.
- Formulár odoslaný z IP v krajine s GDPR-ekvivalentom (napr. UK GDPR): prípadne pridať jazyk podľa geo-IP v V2 (nie blocker).

---

## Závislosti

- Závisí na: Cloudflare Turnstile setup (secrets), email provider (US-121 infra)
- Blokuje: US-201 (admin správa dotazov – číta z tejto tabuľky)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: rate limit, Turnstile server-side verify
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: GDPR checkbox povinný, message nie je v auto-reply
