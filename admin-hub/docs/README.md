# 📚 SubenAI MVP — Dokumentácia

Vitaj v dokumentácii MVP. Toto je rozcestník — každý dokument rieši inú časť.

## 🚀 Pre úplne začínajúcich

1. **[SETUP.md](./SETUP.md)** — Ako si stiahnuť projekt, nainštalovať a spustiť lokálne (step-by-step, s presnými príkazmi)
2. **[USER_GUIDE.md](./USER_GUIDE.md)** — Prehliadka užívateľskej aplikácie (`/app/*`) so screenshotmi
3. **[ADMIN_GUIDE.md](./ADMIN_GUIDE.md)** — Prehliadka admin panela (`/admin/*`) so screenshotmi

## 🛠 Pre vývojárov / AI agenta

4. **[FEATURES.md](./FEATURES.md)** — Kompletný route-by-route inventár, čo robí každá stránka a aký store používa
5. **[DATA.md](./DATA.md)** — Kde sú mock dáta, ako ich exportovať na seed DB
6. **[DATABASE.md](./DATABASE.md)** — Supabase schéma, enumy, RLS politiky, indexy, cron joby
7. **[INTEGRATION.md](./INTEGRATION.md)** — Krok-za-krokom plán ako naintegrovať MVP do existujúceho `subenai.sk`

## 📸 Screenshoty

Všetky obrázky sú v [`docs/screenshots/`](./screenshots/) a referencované v `USER_GUIDE.md` a `ADMIN_GUIDE.md`.

| # | Súbor | Popis |
|---|---|---|
| 01 | `01-landing.png` | Verejná landing page |
| 02 | `02-user-dashboard.png` | `/app` — užívateľský dashboard |
| 03 | `03-admin-dashboard.png` | `/admin` — admin prehľad |
| 04 | `04-admin-answer-sets.png` | `/admin/answer-sets` — sady odpovedí |
| 05 | `05-admin-questions.png` | `/admin/questions` — otázky |
| 06 | `06-admin-tests.png` | `/admin/tests` — testy |
| 07 | `07-admin-categories.png` | `/admin/categories` — vetvy a témy |
| 08 | `08-new-test-wizard.png` | `/app/tests/new` — wizard nového testu |

---

## ⚡ Najčastejšie otázky

**Q: Kde začať?** → `SETUP.md`, potom `USER_GUIDE.md` a `ADMIN_GUIDE.md`.

**Q: Chcem to naintegrovať do `subenai.sk`. Čo čítať?** → `FEATURES.md` (pochopiť čo to robí) → `DATABASE.md` (schéma) → `INTEGRATION.md` (plán).

**Q: Kde sú dáta?** → `DATA.md`. Všetko in-memory, žiadny backend.

**Q: Ako stiahnuť celý kód?** → V `SETUP.md` sú 3 spôsoby (GitHub clone / ZIP / Lovable Code Editor).
