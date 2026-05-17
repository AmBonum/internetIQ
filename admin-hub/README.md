# SubenAI — MVP (Lovable prototyp)

Tento repozitár obsahuje **MVP frontendu a UI** pre platformu SubenAI (vytvorené v Lovable, postavené na TanStack Start v1 + Vite 7 + Tailwind v4). Slúži ako vizuálny a funkčný blueprint na **napojenie do existujúceho `subenai.sk` projektu**.

> **Pre agenta / vývojára:** všetky štartovacie pokyny — kde sú dáta, ako naseedovať DB, mapovanie tabuliek a stĺpcov, dizajnové tokeny — nájdeš v `docs/`. Začni tam.

---

## Štruktúra

```
src/
├── routes/                # File-based routing (TanStack Start)
│   ├── __root.tsx         # root layout
│   ├── index.tsx          # landing
│   ├── app.*.tsx          # autentifikovaná aplikácia (user)
│   ├── admin.*.tsx        # admin panel
│   ├── s.$slug.tsx        # verejný sub-page
│   └── t.$shareId.tsx     # vyplnenie testu cez share link
├── components/
│   ├── ui/                # shadcn primitives
│   ├── app/               # PageHeader a app shell komponenty
│   ├── user/              # ShareDialog, atď.
│   └── admin/             # admin-špecifické UI
├── lib/
│   └── platform/
│       ├── store.ts       # in-memory store (mock dáta) + hooks
│       ├── types.ts       # všetky TypeScript typy entít
│       └── seed.ts        # seed dát do storu
├── styles.css             # design system (oklch tokeny, 1:1 so subenai.sk)
└── router.tsx             # router setup

docs/                      # ⬅ KOMPLETNÁ DOKUMENTÁCIA (začni v docs/README.md)
├── README.md              # rozcestník + FAQ
├── SETUP.md               # step-by-step lokálne spustenie (npm/bun/git)
├── USER_GUIDE.md          # prehliadka /app/* so screenshotmi
├── ADMIN_GUIDE.md         # prehliadka /admin/* so screenshotmi
├── FEATURES.md            # route-by-route inventár všetkých stránok
├── DATA.md                # mock dáta + JSON export na seed DB
├── DATABASE.md            # Supabase schéma, enumy, RLS, indexy, cron
├── INTEGRATION.md         # plán napojenia do existujúceho subenai.sk
└── screenshots/           # PNG screenshoty použité v guide-och
```

## Tech stack

- **React 19** + TypeScript (strict)
- **TanStack Start v1** + TanStack Router (file-based v `src/routes/**`)
- **Vite 7**
- **Tailwind CSS v4** (cez `src/styles.css`, `oklch` tokeny)
- **shadcn/ui** + Radix
- **Zustand-like** in-memory store v `src/lib/platform/store.ts` (mock dáta, pripravené na zámenu za Supabase queries)
- **Dark theme** ako default, lime → emerald gradient primárka (zladené 1:1 so `subenai.sk`)

## Lokálne spustenie

```bash
npm install
npm run dev          # dev server na http://localhost:5173
npm run build        # produkčný build
```

## Čo nie je v MVP

- **Žiadny backend** — všetky dáta sú mock v pamäti (`src/lib/platform/seed.ts` + `store.ts`). Pre produkčný `subenai.sk`:
  1. Naseeduj DB podľa `docs/DATABASE.md`.
  2. Nahraď volania zo `store.ts` Supabase queries (alebo TanStack `createServerFn`).
  3. Pridaj auth (Supabase Auth alebo existujúci flow z `subenai.sk`).
- **Žiadne emaily, platby, AI** — sú to len UI flow-y.

## Mapovanie na produkčný `subenai.sk`

Originálny projekt používa rovnaký stack (TanStack Start + Cloudflare Pages + Wrangler). MVP komponenty a routes sú navrhnuté tak, aby sa **dali skopírovať priamo** do `src/routes/app/**` a `src/routes/admin/**` v produkčnom repo. Detailné mapovanie → `docs/INTEGRATION.md`.

---

**Design tokeny** sú v `src/styles.css` (sekcia `:root` a `@theme inline`). Lime primárka = `oklch(0.92 0.22 128)`, navy background = `oklch(0.14 0.025 265)`. Eyebrow badge + accent gradient nadpisy sú v `PageHeader` (`src/components/app/page-header.tsx`).
