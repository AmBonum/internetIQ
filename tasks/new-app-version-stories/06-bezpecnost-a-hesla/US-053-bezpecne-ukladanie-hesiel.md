# US-053 – Systém bezpečne ukladá a overuje heslá

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-053                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Bezpečnosť a heslá              |
| **Rola** | Systém / platforma                 |

---

## User Story

> Ako **platforma**
> chcem **bezpečne ukladať, overovať a spravovať heslá pomocou moderných kryptografických algoritmov**
> aby som **zaistila, že úniku databázy neznamená únik hesiel v čitateľnej forme a minimalizuje riziko credential-based útokov**.

---

## Kontext

Bezpečné ukladanie hesiel je infraštrukturálna požiadavka, ktorá je predpokladom
pre US-050 a US-051. Definuje algoritmy, parametre a bezpečnostné invarianty,
ktoré sa nesmú zmeniť bez security review.

---

## Akceptačné kritériá

- [ ] **AC-1:** Heslá sú hashované algoritmom **Argon2id** (preferovaný; Winner of Password Hashing Competition) s parametrami: `memory = 64 MB`, `iterations = 3`, `parallelism = 4`; alternatívne `bcrypt` s work factor `≥ 14` ak Argon2id nie je dostupný v runtime.
- [ ] **AC-2:** Každé heslo má unikátny **salt** (minimálne 16 bajtov, kryptograficky náhodný); salt je uložený ako súčasť hash string (nie oddelene).
- [ ] **AC-3:** Heslo v plain-texte nikdy neopustí pamäň servera: nie je logované, nie je zahrnuté v error response, nie je uložené v DB ani cache.
- [ ] **AC-4:** Overovanie hesla je implementované pomocou **constant-time comparison** (timing-safe equal) – zabraňuje timing útokom.
- [ ] **AC-5:** `tests` tabuľka obsahuje stĺpec `admin_password_hash TEXT NOT NULL` a `respondent_password_hash TEXT` (nullable) + `admin_password_changed_at TIMESTAMPTZ` pre audit.
- [ ] **AC-6:** Migrácia starej hashovacej metódy na novú (napr. z bcrypt na Argon2id) prebieha transparentne: pri úspešnom prihlásení s bcrypt hashom sa hash prepočíta na Argon2id.
- [ ] **AC-7:** Hash stĺpce sú prístupné iba serverovej vrstve; RLS politiky zabraňujú čítaniu hash stĺpcov cez Supabase klientom.
- [ ] **AC-8:** Systém neimplementuje obmedzenia histórie hesiel (password history) v P0 – táto funkcia je P3 budúca iterácia.

---

## Technické poznámky

- Argon2id v Node.js: `@node-rs/argon2` alebo `argon2` npm balík; overiť kompatibilitu s Cloudflare Workers runtime (limitovaná WASM podpora).
- Ak Cloudflare Workers nepodporuje Argon2id: použiť `bcrypt` s work factor `14` cez Supabase Edge Function (Deno), kde je podpora lepšia.
- Constant-time compare: `crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))` z Node.js built-ins.
- RLS: `CREATE POLICY "no_hash_select" ON tests USING (false) WITH CHECK (false)` pre stĺpce `*_password_hash` na read operáciách klientom.

---

## Edge Cases

- Útočník získa databázový dump: Argon2id s parametrami zaručuje, že brute-force je nerentabilný.
- Developer náhodne zaloguje parameter obsahujúci heslo: code review + lint pravidlo zakazujúce logovanie parametrov nazvaných `*password*`, `*secret*`.
- Test bol migrovaný z iného systému so plain-text heslami: jednorazový hash migration script, nie produkčný kód.

---

## Závislosti

- Závisí na: – (infraštrukturálna story)
- Blokuje: US-050 (admin heslo), US-051 (respondentské heslo), US-001 (prihlásenie)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: hash generovanie, constant-time compare, transparent upgrade
- [ ] Security audit: žiadne plain-text heslá v logoch, RLS overený
- [ ] DB migrácia napísaná + DEPLOY_SETUP.sql aktualizovaný
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
