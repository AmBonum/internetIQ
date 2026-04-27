# FEATURE MAP – Internet IQ Test Platform

> **Živý dokument.** Aktualizuj pri každom novom merge do `main`.
> Posledná aktualizácia: 2026-04

---

## Prehľad architektúry

```
┌─────────────────────────────────────────────────────────────────┐
│  Cloudflare Pages (SSR Worker)                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐ │
│  │  TanStack Start      │  │  Edge Functions                  │ │
│  │  React 19 · Vite     │  │  (Supabase / CF Worker)          │ │
│  │  Tailwind v4         │  │  • auth callbacks                │ │
│  └──────────────────────┘  │  • contact form                  │ │
│                            │  • data export                   │ │
│                            │  • csp-report                    │ │
│                            └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
  Supabase (PostgreSQL)          Cloudflare R2 / Storage
  Auth · RLS · pg_cron           (backups, file uploads)
```

---

## Hierarchia rolí

```
anonymný návštevník
   └─ respondent (registrovaný, default)
        └─ author (self-service upgrade, ToS)
             └─ platform_admin (manuálne pridelené)
```

Rola je **aditívna** – každá vyššia rola obsahuje všetky práva nižšej.

---

## Mapa funkcionalít

### Legenda stavu

| Symbol | Stav         | Popis                              |
|--------|--------------|------------------------------------|
| ✅     | Implementovaná | V produkcii alebo feature branch   |
| 🔧     | Plánovaná    | Story existuje, čaká na dev        |
| 📋     | Draft        | Story existuje, AC môžu sa meniť   |
| 💡     | Nápad        | Zaznamenaný, bez story             |

---

### 01 – Autentifikácia a roly

| Story | Název | Stav |
|-------|-------|------|
| US-001 | Prístup autora/admin k testu cez password | 📋 |
| US-002 | Prístup respondenta cez zdieľaný link | 📋 |
| US-003 | Inštitucionálni klienti – tím admini | 📋 |
| US-190 | Registrácia a prihlásenie (Supabase Auth + Google OAuth) | 📋 |
| US-191 | Registrácia z landing page / summary (claiming attempts) | 📋 |
| US-193 | Roly a oprávnenia (additive role model, JWT sync, RLS) | 📋 |

---

### 02 – Tvorba testu

| Story | Název | Stav |
|-------|-------|------|
| US-010 | Povinné vstupné polia pri tvorbe testu | 📋 |
| US-011 | Voliteľná segmentácia respondentov | 📋 |
| US-012 | GDPR deklarácia účelu zberu dát | 📋 |
| US-013 | GDPR compliance vrstva | 📋 |

---

### 03 – Výber testov

| Story | Název | Stav |
|-------|-------|------|
| US-020 | Preddefinovaný katalóg testov | 📋 |
| US-021 | Filtrovanie katalógu | 📋 |
| US-022 | Vlastný test z knižnice otázok | 📋 |
| US-023 | Filtrovanie knižnice otázok | 📋 |
| US-024 | Kapacitné limity | 📋 |

---

### 04 – Správa otázok

| Story | Název | Stav |
|-------|-------|------|
| US-030 | Správa knižnice otázok | 📋 |
| US-031 | Metadáta otázok | 📋 |
| US-032 | 15 typov odpovedí | 📋 |

---

### 05 – Zber dát respondenta

| Story | Název | Stav |
|-------|-------|------|
| US-040 | Konfigurácia vlastných intake polí | 📋 |
| US-041 | Validačné pravidlá intake polí | 📋 |
| US-042 | Pokročilé nastavenia polí | 📋 |

---

### 06 – Bezpečnosť a heslá

| Story | Název | Stav |
|-------|-------|------|
| US-050 | Admin heslo k testu | 📋 |
| US-051 | Heslo respondenta | 📋 |
| US-052 | Politika hesiel | 📋 |
| US-053 | Argon2id uloženie hesiel | 📋 |

---

### 07 – Generovanie testu

| Story | Název | Stav |
|-------|-------|------|
| US-060 | Generovanie custom odkazu | 📋 |
| US-061 | Summary stránka po vytvorení | 📋 |
| US-062 | Email po vytvorení testu | 📋 |

---

### 08 – Custom link

| Story | Název | Stav |
|-------|-------|------|
| US-070 | Landing page respondenta | 📋 |
| US-071 | Vstup chránený heslom + rate limiting | 📋 |

---

### 09 – Priebeh testovania

| Story | Název | Stav |
|-------|-------|------|
| US-080 | Priebeh vyplnenia jedného testu | 📋 |
| US-081 | Sekvenčné vyplnenie sady testov | 📋 |
| US-082 | Záverečná summary stránka | 📋 |
| US-083 | Uloženie a pokračovanie neskôr | 📋 |

---

### 10 – História respondenta

| Story | Název | Stav |
|-------|-------|------|
| US-090 | História pokusov v sade | 📋 |
| US-091 | Porovnávacie grafy výsledkov | 📋 |
| US-092 | Výsledky emailom | 📋 |

---

### 11 – Admin dashboard

| Story | Název | Stav |
|-------|-------|------|
| US-100 | Admin auth inline gate | 📋 |
| US-101 | Zoznam respondentov | 📋 |
| US-102 | Detail respondenta | 📋 |
| US-103 | Čas a analytické metriky | 📋 |

---

### 12 – Sledovanie a súhlas

| Story | Název | Stav |
|-------|-------|------|
| US-110 | Analytics consent banner | ✅ |
| US-111 | Zbieranie behaviorálnych eventov | 📋 |

---

### 13 – Notifikácie

| Story | Název | Stav |
|-------|-------|------|
| US-120 | Konfigurácia notifikácií | 📋 |
| US-121 | Systém odosielania notifikácií | 📋 |

---

### 14 – Export

| Story | Název | Stav |
|-------|-------|------|
| US-130 | PDF report | 📋 |
| US-131 | CSV export | 📋 |
| US-132 | Email výsledkov respondentovi | 📋 |
| US-133 | JSON export | 📋 |
| US-134 | Agregovaný pack export | 📋 |

---

### 15 – Legal a privacy

| Story | Název | Stav |
|-------|-------|------|
| US-140 | Privacy Policy | ✅ |
| US-141 | Cookie Policy | ✅ |
| US-142 | Terms of Service | ✅ |
| US-143 | GDPR DSR requesty | 📋 |

---

### 16 – Help centrum

| Story | Název | Stav |
|-------|-------|------|
| US-150 | FAQ sekcia | 📋 |
| US-151 | Inline kontextová pomoc | 📋 |
| US-152 | Onboarding wizard | 📋 |

---

### 17 – Pokročilé funkcie

| Story | Název | Stav |
|-------|-------|------|
| US-160 | Verziovanosť testov | 📋 |
| US-161 | Draft stavy testov | 📋 |
| US-162 | Skupiny respondentov | 📋 |
| US-163 | Audit log | 📋 |
| US-164 | Anonymizácia a mazanie dát | 📋 |
| US-165 | Šablóny testov | 📋 |
| US-166 | Benchmarking | 📋 |
| US-167 | Podmienené otázky | 📋 |

---

### 18 – Zálohovanie databázy

| Story | Název | Stav |
|-------|-------|------|
| US-180 | Automatické zálohovanie (pg_dump + R2 + GPG) | 📋 |
| US-181 | Obnova zo zálohy (PITR, pg_restore, runbook) | 📋 |

---

### 19 – Používateľské účty

| Story | Název | Stav |
|-------|-------|------|
| US-190 | Registrácia a prihlásenie | 📋 |
| US-191 | Registrácia z landing a summary | 📋 |
| US-192 | Profil a nastavenia (vrátane session mgmt) | 📋 |
| US-193 | Role a oprávnenia | 📋 |
| US-194 | História testov respondenta | 📋 |
| US-195 | Zdieľanie a export výsledkov | 📋 |
| US-196 | Používateľ vytvára test ako autor | 📋 |
| US-197 | Platform admin správa (základ) | 📋 |

---

### 20 – Kontaktný formulár

| Story | Název | Stav |
|-------|-------|------|
| US-200 | Kontaktný formulár (Turnstile, rate limit, GDPR) | 📋 |
| US-201 | Admin správa dotazov (inbox, filter, status) | 📋 |

---

### 21 – Super admin konzola

| Story | Název | Stav |
|-------|-------|------|
| US-210 | Admin tabuľka používateľov (CRUD, role, deaktivácia) | 📋 |
| US-211 | Admin správa testov, sád, otázok | 📋 |
| US-212 | Admin správa vyplnených testov (attempts) | 📋 |

---

### 22 – Bezpečnosť

| Story | Název | Stav |
|-------|-------|------|
| US-220 | App-wide hardening (OWASP, CSP, rate limit, supply-chain) | 📋 |

---

### 23 – Transparentnosť dát

| Story | Název | Stav |
|-------|-------|------|
| US-230 | Používateľ vidí zozbierané dáta (localStorage + DB) | 📋 |
| US-231 | Správa vlastných dát (edit, delete, export, re-auth gate) | 📋 |

---

## Dátový model – prehľad tabuliek

| Tabuľka | Popis |
|---------|-------|
| `auth.users` | Supabase Auth managed |
| `public.profiles` | Rozšírený profil (meno, avatar) |
| `public.user_roles` | Aditívne roly (respondent, author, platform_admin) |
| `public.tests` | Definície testov |
| `public.test_packs` | Sady testov |
| `public.questions` | Knižnica otázok |
| `public.attempts` | Vyplnené testy (respondent × test) |
| `public.attempt_answers` | Odpovede na otázky v rámci pokusu |
| `public.contact_inquiries` | Support dotazy (US-200) |
| `public.inquiry_status_log` | Historia zmien statusu dotazu (US-201) |
| `public.dsr_requests` | GDPR Data Subject Requests (US-143) |
| `public.audit_log` | Auditná stopa všetkých admin/user akcií |
| `public.admin_data_access_log` | Log de-anonymizačných prístupov (US-212) |
| `public.platform_settings` | Systémové nastavenia (US-197) |
| `public.sponsors` | Sponsori (E10) |
| `public.growth_survey` | Post-test feedback (E2) |

---

## GDPR compliance mapa

| Právo (GDPR čl.) | Pokrytie |
|-----------------|---------|
| čl. 13/14 – Informovanie | US-140 (Privacy Policy), US-012 (GDPR účel) |
| čl. 15 – Prístup | US-230 (/moje-data stránka) |
| čl. 16 – Oprava | US-231 (editácia profilu s re-auth) |
| čl. 17 – Vymazanie | US-231 (account deletion), US-164 (anonymizácia), US-143 (DSR) |
| čl. 20 – Prenosnosť | US-231 (JSON export), US-133/134 (exporty) |
| čl. 21 – Námietka | US-231 (odvolanie súhlasov), US-110 (consent management) |
| čl. 25 – Privacy by design | US-013, US-220 (minimum data, encryption) |
| čl. 32 – Bezpečnosť | US-053 (argon2id), US-180/181 (backup), US-220 (hardening) |
| čl. 33/34 – Notifikácia o porušení | US-220 (INCIDENT_RESPONSE.md) |

---

## Bezpečnostný model – súhrn

- **Transport:** HTTPS everywhere, HSTS preload
- **Autentifikácia:** Supabase Auth JWT (1h/7d), argon2id passwords
- **Autorizácia:** Row Level Security na všetkých tabuľkách
- **Anti-spam:** Cloudflare Turnstile na formulároch, honeypot polia
- **Rate limiting:** Cloudflare WAF per-endpoint pravidlá
- **Injection ochrana:** Zod validácia + parametrizované Supabase queries
- **Supply-chain:** npm audit v CI, Gitleaks pre secrets scan
- **Audit:** `audit_log` tabuľka, `admin_data_access_log`
- **Incident response:** `INCIDENT_RESPONSE.md` runbook

---

## Cesty (routes)

| Path | Popis | Auth |
|------|-------|------|
| `/` | Homepage | public |
| `/test/:slug` | Respondent landing | public |
| `/test/firma/:slug` | Firm test pack | public |
| `/kurzy/:slug` | Kurz detail | public |
| `/r/:shareId` | Zdieľaný výsledok | public |
| `/dashboard` | Respondent dashboard | respondent |
| `/dashboard/my-tests` | Autor – moje testy | author |
| `/moje-data` | Transparentnosť dát | public |
| `/admin` | Platform admin redirect | platform_admin |
| `/admin/users` | Správa používateľov | platform_admin |
| `/admin/tests` | Správa testov | platform_admin |
| `/admin/test-packs` | Správa sád | platform_admin |
| `/admin/questions` | Správa otázok | platform_admin |
| `/admin/attempts` | Správa pokusov | platform_admin |
| `/admin/inquiries` | Inbox dotazov | platform_admin |
| `/privacy` | Privacy Policy | public |
| `/cookies` | Cookie Policy | public |
| `/privacy#tos` | Terms of Service | public |

---

## Planované epiky (roadmap)

| Epika | Popis | Stories |
|-------|-------|---------|
| E10 – Sponzorstvo | Platené sponzorstvo, Stripe webhook | US-10.1–10.5 |
| E11 – Podpora + info stránky | /podpora, /sponzori, /o-projekte, changelog | US-11.1–11.8 |
| E12 – Edu schema | Školy, vzdelávanie, respondent intake | US-12.1–12.3 |
