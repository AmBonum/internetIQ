# US-220 – Aplikácia-wide bezpečnosť (top-level hardening)

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-220                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Bezpečnosť                        |
| **Rola** | Platform (crosscutting concern)      |

---

## User Story

> Ako **prevádzkovateľ platformy**
> chcem **aby celá webová aplikácia spĺňala OWASP Top 10 a moderné best practices**
> aby som **minimalizoval plochu útoku a chránil dáta používateľov**.

---

## Kontext

Táto story pokrýva infraštruktúrne a crosscutting bezpečnostné požiadavky.
Je to evergreen story – každý sprint pridáva alebo zpevňuje vrstvy.
Nie je feature, je to baseline kvality.

---

## Akceptačné kritériá

### A. HTTP Security Headers

- [ ] **AC-1:** Cloudflare Pages `_headers` alebo Worker middleware nastavuje pre všetky odpovede:
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
- [ ] **AC-2:** Content-Security-Policy je definovaná. Direktívy:
  - `default-src 'self'`
  - `script-src 'self' 'nonce-{random}' https://challenges.cloudflare.com`
  - `style-src 'self' 'unsafe-inline'` (nutné pre Tailwind inline styles vo V1; roadmap: migrácia na nonce)
  - `connect-src 'self' https://*.supabase.co https://cloudflareinsights.com`
  - `img-src 'self' data: https:`
  - `frame-src https://challenges.cloudflare.com`
  - `report-uri /api/csp-report`
- [ ] **AC-3:** `security.txt` dostupný na `/.well-known/security.txt` s kontaktom, PGP kľúčom a expiry dátumom (obnova 1× ročne).
- [ ] **AC-4:** Hlavičky validované automatizovaným testom v CI – test číta produkčnú URL a overuje prítomnosť každej hlavičky.

### B. Rate Limiting a DoS ochrana

- [ ] **AC-5:** Cloudflare WAF rate limit pravidlá:
  - Contact form (`/api/contact`): 3 req / 24h / IP (US-200)
  - Auth endpoints (`/auth/*`): 10 req / 15 min / IP
  - Admin API (`/admin/api/*`): 60 req / min / session
  - Všetky ostatné API: 200 req / min / IP
- [ ] **AC-6:** Turnstile (Cloudflare) chráni všetky formuláre kde nečakáme API volania (contact form, registrácia, login, password reset). Server overuje Turnstile token pred spracovaním.
- [ ] **AC-7:** Honeypot pole v každom HTML formulári (skryté CSS, nie `display:none`). Bot submission detekovaný a zahadzovaný bez chybovej odpovede (silent drop).

### C. Input sanitizácia a injekcie

- [ ] **AC-8:** Všetky API inputs validované Zod schémami pred spracovaním. `z.parse()` (nie `z.safeParse()` – uncaught throw sa konvertuje na HTTP 400 v error boundary).
- [ ] **AC-9:** Všetky Supabase dotazy používajú parametrizované volania (Supabase client SDK). Žiadna string interpolácia v SQL. CI lint rule (custom ESLint rule alebo grep check) overuje absenciu `.rpc(` s template literals.
- [ ] **AC-10:** Akýkoľvek user-generated content renderovaný ako HTML (napr. otázka s formátovaním) prechádza cez DOMPurify s prísnym allowlistom tagov (`b`, `i`, `ul`, `ol`, `li`, `p`).

### D. Autentifikácia a sessions

- [ ] **AC-11:** JWT access token lifetime: 1 hodina. Refresh token lifetime: 7 dní (idle expiry). Supabase Auth nastavené v `config.toml`.
- [ ] **AC-12:** Cookies pre session: `HttpOnly; Secure; SameSite=Strict; Path=/`. Žiadna citlivá hodnota v `localStorage` (len non-sensitive preferences).
- [ ] **AC-13:** Po zmene hesla sa invalidujú všetky ostatné session tokeny (Supabase `signOut({ scope: 'others' })`).
- [ ] **AC-14:** Admin konzola (`/admin/*`) vyžaduje re-autentifikáciu ak posledná session aktivita > 30 minút (step-up auth cez OTP email, nie len refresh tokenu).

### E. Dependency a supply-chain

- [ ] **AC-15:** `npm audit` beží v CI. Build failuje ak existujú `high` alebo `critical` zraniteľnosti bez explicitného `npm audit --ignore`.
- [ ] **AC-16:** Žiadne secrets v source code. CI scan (git-secrets alebo Gitleaks) overuje každý commit. `.env*` súbory sú v `.gitignore`.
- [ ] **AC-17:** Supabase anon key je verejná (nevadí) ale service role key nesmie nikdy opustiť serverovú Edge Function. Lint rule zakazuje import `SUPABASE_SERVICE_ROLE_KEY` kdekoľvek okrem `supabase/functions/`.

### F. File upload bezpečnosť (ak aplikovateľné)

- [ ] **AC-18:** Upload endpointy (profilové fotky, importy) validujú MIME type na serveri (nie len Content-Type header – ten je klientom kontrolovateľný). Magic bytes check.
- [ ] **AC-19:** Maximálna veľkosť uploadu: 5 MB. Cloudflare Worker presadí limit pred `fetch()` do origin.
- [ ] **AC-20:** Upload do Supabase Storage s randomizovaným path (nikdy pôvodný filename od klienta). Pôvodný filename uložený len v DB metadátach.

### G. Monitoring a incident response

- [ ] **AC-21:** CSP violation reports (`/api/csp-report`) sa ukladajú do `security_logs` tabuľky a alarmujú Slack/email keď frekvencia > 10/min.
- [ ] **AC-22:** Opakované autentifikačné zlyhania (> 5× za 15 min z rovnakej IP) generujú alert (Supabase Auth log + Cloudflare Workers log).
- [ ] **AC-23:** `INCIDENT_RESPONSE.md` dokument v rootne repozitára: klasifikácia incidentov (P0–P3), kontakty, SLA pre odpoveď, kroky post-mortem.

---

## Technické poznámky

- Nonce pre CSP: každý SSR request generuje kryptograficky náhodný nonce injektovaný do `<script>` tagov cez TanStack Start server middleware.
- Gitleaks konfigurácia: `.gitleaks.toml` v repu s pravidlami pre Supabase API keys, Stripe keys, Resend API keys.

---

## Edge Cases

- CSP blokuje legitímny third-party skript (napr. nový analytics provider): rýchly fix cez CF Worker env var `EXTRA_CSP_DOMAINS` bez redeployu kódu.
- npm audit nahlási high CVE v transitive dependency kde oprava nie je dostupná: vytvorí sa GitHub Issue s mitigáciou plán a akceptačný komentár v `package.json` overrides.

---

## Závislosti

- Závisí na: US-197 (admin auth, step-up re-auth), US-200 (Turnstile použitie)
- Ovplyvňuje: všetky ostatné stories – baseline requirement

---

## Definition of Done

- [ ] Všetky AC implementované
- [ ] Automatizovaný header test v CI zelený
- [ ] `npm audit` → 0 high/critical
- [ ] INCIDENT_RESPONSE.md vytvorený
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
