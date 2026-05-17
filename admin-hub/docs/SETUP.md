# SETUP — Step-by-step lokálne spustenie

Tento návod ťa prevedie od stiahnutia kódu po bežiacu aplikáciu na `http://localhost:5173`.

---

## 1. Predpoklady

| Nástroj | Verzia | Overenie |
|---|---|---|
| **Node.js** | ≥ 20 | `node -v` |
| **bun** (odporúčané) alebo `npm` | bun ≥ 1.0 / npm ≥ 10 | `bun -v` / `npm -v` |
| **git** | akákoľvek | `git --version` |

> Projekt používa `bunfig.toml`. Ak nemáš bun, funguje aj `npm` — všetko nižšie má `npm` ekvivalent.

---

## 2. Stiahnutie kódu (3 spôsoby)

### A) Git clone z GitHubu (odporúčané)

```bash
git clone https://github.com/<tvoj-user>/<repo-name>.git subenai-mvp
cd subenai-mvp
```

> Repo URL nájdeš v Lovable: Plus (+) menu → GitHub → tvoj projekt.

### B) Stiahnuť ZIP z GitHubu

1. Otvor repo na github.com
2. Zelené tlačidlo **Code** → **Download ZIP**
3. Rozbaľ ZIP, otvor terminál v priečinku

### C) Lovable Desktop — Download codebase

1. V Lovable otvor projekt
2. Klikni ikonu **`</>`** (Code Editor) v pravom hornom rohu
3. Naspodu sidebar → **Download codebase**

---

## 3. Inštalácia závislostí

```bash
bun install        # alebo: npm install
```

To stiahne všetko z `package.json` do `node_modules/`. Trvá ~30-60 s.

---

## 4. Spustenie dev servera

```bash
bun run dev        # alebo: npm run dev
```

Aplikácia bude na **`http://localhost:5173`**. Vite watch režim — každá zmena v `src/` sa hot-reloadne.

### Čo by si mal vidieť

1. Konzola: `VITE v7.x  ready in ~X ms` + `Local: http://localhost:5173/`
2. V prehliadači landing page (viď `docs/screenshots/01-landing.png`)
3. Klik na **„Moje sady testov"** → presmeruje na `/app`
4. Klik na **„Admin platformy"** (dole v sidebar) → `/admin`

---

## 5. Štruktúra projektu — kam pozerať

```
src/
├── routes/                      # každý súbor = jedna URL route
│   ├── __root.tsx               # globálny layout (html, head, body)
│   ├── index.tsx                # /  (landing)
│   ├── app.tsx                  # /app layout (sidebar + outlet)
│   ├── app.index.tsx            # /app  (dashboard)
│   ├── app.tests.index.tsx      # /app/tests
│   ├── app.tests.new.tsx        # /app/tests/new (wizard)
│   ├── admin.tsx                # /admin layout
│   └── admin/                   # /admin/* (questions, tests, answer-sets, …)
├── components/
│   ├── ui/                      # shadcn primitives (button, dialog, …)
│   ├── admin/                   # admin-špecifické komponenty
│   ├── app/page-header.tsx      # eyebrow + accent gradient nadpis
│   └── user/AppShell.tsx        # user app sidebar + topbar
├── lib/
│   ├── admin/store.ts           # admin in-memory store + adminRepo (mutácie)
│   ├── admin-mock-data.ts       # seed: questions, answer-sets, tests, …
│   ├── platform/store.ts        # user app store
│   ├── platform/types.ts        # všetky TypeScript typy (≈ DB tabuľky)
│   └── user-mock-data.ts        # seed: sessions, respondents, notifs
└── styles.css                   # Tailwind v4 + design tokeny (oklch)
```

Detailný popis každej route → **[FEATURES.md](./FEATURES.md)**.

---

## 6. Užitočné príkazy

```bash
bun run dev          # dev server (port 5173)
bun run build        # produkčný build do dist/
bun run preview      # preview produkčného buildu
bun run lint         # ESLint
```

> Lovable build/typecheck beží automaticky pri každej zmene. Lokálne ich nemusíš spúšťať ručne ak používaš Lovable.

---

## 7. Zmena dát

Mock dáta sú **deterministicky seedované**:

- **Admin entity** (otázky, sady, testy, kategórie, používatelia) → `src/lib/admin-mock-data.ts`
- **User entity** (sessions, respondents, notifikácie, audiences) → `src/lib/user-mock-data.ts`

Po zmene súboru sa store **reseduje pri ďalšom refreshu stránky**. Žiadna DB.

Mutácie cez UI (vytvor otázku, zmaž test) sa **držia v pamäti** kým neurobíš refresh — vtedy sa store znova naseeduje z mock dát.

---

## 8. Časté problémy

| Problém | Riešenie |
|---|---|
| `Port 5173 is already in use` | `bun run dev --port 5174` alebo zabi proces na 5173 |
| `Cannot find module '@/…'` | `bun install` znova; `@/` alias je nastavený v `tsconfig.json` |
| Biela stránka / 404 na refresh | `bun run dev` reštart; TanStack regeneruje `routeTree.gen.ts` |
| `routeTree.gen.ts has conflicts` | Vymaž súbor, dev server ho vygeneruje nanovo |
| Tmavé čierno-čierne nadpisy | `src/styles.css` musí byť importovaný v `__root.tsx` (default je) |

---

## 9. Ďalšie kroky

- 👤 **Chcem to pochopiť ako user** → [USER_GUIDE.md](./USER_GUIDE.md)
- 🛡️ **Chcem to pochopiť ako admin** → [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
- 🔧 **Chcem to namountovať na backend** → [INTEGRATION.md](./INTEGRATION.md)
