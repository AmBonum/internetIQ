# FEATURES — Route-by-route inventár MVP

Tento dokument popisuje **každú stránku** v MVP, čo robí, aké dáta číta/zapisuje (cez ktorý store), a stav (hotové / placeholder).

> Všetky dáta sú **in-memory mock** v `src/lib/platform/store.ts` (user app) a `src/lib/admin/store.ts` (admin). Pri integrácii nahradiť za Supabase queries — viď `INTEGRATION.md`.

---

## 1. Verejné (unauthenticated)

| Route | Súbor | Popis | Stav |
|---|---|---|---|
| `/` | `routes/index.tsx` | Landing page (subenai.sk štýl, hero + features) | ✅ |
| `/login` | `routes/login.tsx` | Prihlásenie (mock — len redirect na `/app`) | ✅ UI |
| `/register` | `routes/register.tsx` | Registrácia | ✅ UI |
| `/forgot-password` | `routes/forgot-password.tsx` | Reset hesla — request | ✅ UI |
| `/reset-password` | `routes/reset-password.tsx` | Reset hesla — formulár | ✅ UI |
| `/admin-login` | `routes/admin-login.tsx` | Admin login | ✅ UI |
| `/s/$slug` | `routes/s.$slug.tsx` | Verejný sub-page (CMS marketing stránka) | ✅ |
| `/t/$shareId` | `routes/t.$shareId.tsx` | Vyplnenie testu cez share link (respondent flow) | ✅ |
| `/docs` | `routes/docs.tsx` | Statické dokumenty | ✅ |

---

## 2. Užívateľská aplikácia (`/app/*`)

Layout: `routes/app.tsx` (sidebar + outlet, používa `components/user/AppShell.tsx`).
Wraps: `components/app/page-header.tsx` (eyebrow + accent gradient nadpis).
Data: `src/lib/platform/store.ts` + `src/lib/user-mock-data.ts`.

| Route | Súbor | Popis | Stav |
|---|---|---|---|
| `/app` | `app.index.tsx` | Dashboard — KPI, recent tests, notifications preview | ✅ |
| `/app/tests` | `app.tests.index.tsx` | Zoznam testov (filter, search, status badges) | ✅ |
| `/app/tests/new` | `app.tests.new.tsx` | Wizard pre vytvorenie testu (intake → questions → settings → publish) | ✅ |
| `/app/tests/$testId` | `app.tests.$testId.tsx` | Detail testu (results, analytics, share, edit) | ✅ |
| `/app/sets/$setId` | `app.sets.$setId.tsx` | Zoznam odpovedí v sade (read-only pre usera) | ✅ |
| `/app/audiences` | `app.audiences.tsx` | Respondent groups (CRUD, import emailov, tagy) | ✅ |
| `/app/teams` | `app.teams.tsx` | Tímy a roly (owner/editor/viewer) | ✅ |
| `/app/library` | `app.library.tsx` | Knižnica otázok (reuse v testoch) | ✅ |
| `/app/templates` | `app.templates.tsx` | Šablóny testov (preddefinované) | ✅ |
| `/app/history` | `app.history.tsx` | História sessions a verzií | ✅ |
| `/app/notifications` | `app.notifications.tsx` | Notifikácie (filter podľa typu, mark read) | ✅ |
| `/app/help` | `app.help.tsx` | FAQ accordion (dark border cards + chevron) | ✅ |
| `/app/account/profile` | `app.account.profile.tsx` | Profil (display name, avatar) | ✅ |
| `/app/account/security` | `app.account.security.tsx` | Bezpečnosť (zmena hesla, 2FA toggle) | ✅ UI |
| `/app/legal/dsr` | `app.legal.dsr.tsx` | GDPR — vlastné DSR žiadosti | ✅ |

---

## 3. Admin panel (`/admin/*`)

Layout: `routes/admin.tsx` (`components/admin/AdminSidebar.tsx` + outlet).
Header: `components/admin/PageHeader.tsx`.
Data: `src/lib/admin/store.ts` (reactive store cez `useSyncExternalStore`).
Konfirmácie: `components/admin/ConfirmDialog.tsx`.

| Route | Súbor | Popis | Stav |
|---|---|---|---|
| `/admin` | `admin/index.tsx` | Dashboard — KPI cards, activity chart, distribution | ✅ |
| `/admin/users` | `admin/users.tsx` | Users CRUD (role: admin/moderator/user; status: active/suspended/pending) | ✅ |
| `/admin/questions` | `admin/questions.tsx` | Otázky — CRUD, AI generator (`AiQuestionGenerator`), kategória, vetva, ťažkosť | ✅ |
| `/admin/answer-sets` | `admin/answer-sets.tsx` | Zoznam sád odpovedí — search, duplicate, delete | ✅ |
| `/admin/answer-sets/$setId` | `admin/answer-sets.$setId.tsx` | Editor sady — Correct/Incorrect kolóny, link na otázky | ✅ |
| `/admin/tests` | `admin/tests.tsx` | Testy — CRUD, status, difficulty, branch | ✅ |
| `/admin/tests/$testId` | `admin/tests.$testId.tsx` | Editor testu (otázky, poradie, settings) | ✅ |
| `/admin/trainings` | `admin/trainings.tsx` | Tréningy — CRUD, duplicate | ✅ |
| `/admin/categories` | `admin/categories.tsx` | Vetvy a topiky (CRUD cez dialog) | ✅ |
| `/admin/reports` | `admin/reports.tsx` | Nahlásenia (review/resolve/dismiss → mení status v repo) | ✅ |
| `/admin/respondents` | `admin/respondents.tsx` | Respondenti (PII access logged do audit) | ✅ |
| `/admin/quick-test` | `admin/quick-test.tsx` | Config rýchleho testu (save/reset → store) | ✅ |
| `/admin/share-card` | `admin/share-card.tsx` | Share card config (tiers, gradient, save/reset → store) | ✅ |
| `/admin/pages` | `admin/pages.tsx` | CMS — sub-pages list | ✅ |
| `/admin/pages/$pageId` | `admin/pages.$pageId.tsx` | CMS editor (blocky, SEO meta, publish) | ✅ |
| `/admin/header` | `admin/header.tsx` | Header CMS (logo, nav items) | ✅ |
| `/admin/footer` | `admin/footer.tsx` | Footer CMS (kolóny, linky, socials) | ✅ |
| `/admin/navigation` | `admin/navigation.tsx` | Hlavná navigácia (drag-to-reorder mock) | ✅ |
| `/admin/audit` | `admin/audit.tsx` | Audit log (filter podľa actor/action/PII) | ✅ |
| `/admin/dsr` | `admin/dsr.tsx` | DSR queue (open/in_progress/completed/rejected, SLA) | ✅ |
| `/admin/support` | `admin/support.tsx` | Support config (email, hodiny) | ✅ |
| `/admin/settings` | `admin/settings.tsx` | Globálne nastavenia (UI hotové, persistencia ešte hardcoded — TODO) | ⚠️ |

---

## 4. Cross-cutting funkcionality

### AI generátor otázok
- Súbor: `src/lib/ai-generate.functions.ts` (createServerFn, Lovable AI Gateway-ready)
- UI: `components/admin/AiQuestionGenerator.tsx`
- Volá Lovable AI cez `process.env.LOVABLE_API_KEY` (po enable Lovable Cloud)

### Export dát
- `src/lib/admin/export.ts` — JSON/CSV export pre questions, answer-sets, tests
- `src/lib/platform/exports.ts` — export sessions / respondentov

### Share link / verejný test flow
- Admin/user vytvorí test → vygeneruje `share_id` → `/t/$shareId` umožní respondentovi vyplniť bez prihlásenia
- Intake fields → consent → questions → submit → session zapísaná do store

### GDPR
- `gdpr_purpose` pri každom teste
- `pii: boolean` na intake fields
- `anonymize_after_days` na teste (mock; v reále pg_cron job)
- DSR požiadavky: user submit cez `/app/legal/dsr`, admin spracuje cez `/admin/dsr`
- Audit log: každý PII prístup označený `pii_access: true`

---

## 5. Stav implementácie — súhrn

✅ **Plne funkčné** (CRUD + persistencia v in-memory store, ready na Supabase swap): users, questions, answer-sets, tests, trainings, categories, reports, share-card, quick-test, CMS pages/header/footer, audiences, teams, DSR

⚠️ **UI hotové, persistencia placeholder**: `/admin/settings` (globálne settings hardcoded), 2FA toggle na `/app/account/security`

❌ **Nezačaté**: skutočný backend (Supabase), AI generovanie cez Lovable Cloud (skeleton existuje), email odosielanie pozvánok, pg_cron pre anonymizáciu

---

Viď ďalej:
- **DATA.md** — kde sú mock dáta, ako sa seedujú, ako exportovať
- **DATABASE.md** — mapovanie na Supabase tabuľky + RLS
- **INTEGRATION.md** — návod ako toto naintegrovať do existujúceho subenai.sk
