# INTEGRATION — Ako toto MVP naintegrovať do existujúceho `subenai.sk`

Tento dokument je **plán pre vývojára / AI agenta** ktorý má MVP namountovať do už bežiacej `subenai.sk` codebase.

---

## 1. Predpoklady

Existujúca codebase `subenai.sk` má:
- vlastný frontend framework (Next.js / TanStack / iné)
- vlastnú DB (Supabase / iné)
- vlastný auth (Supabase Auth / NextAuth / iné)
- vlastný design systém

**Toto MVP prináša:**
- kompletné UI (admin + user app) v React 19 + TanStack Router
- doménový model (typy, entity, vzťahy)
- mock dáta pripravené na seed
- design tokeny (dark theme, lime→emerald accent — 1:1 so subenai.sk)

---

## 2. Tri integračné stratégie

### A) Subdoména / sub-route (najrýchlejšie)
Nasadiť toto MVP ako-je na `app.subenai.sk` alebo `subenai.sk/app`:
1. Pripojiť Lovable Cloud (Supabase) cez chat
2. Replace mock store za Supabase queries (krok 5)
3. Deploy ako samostatnú TanStack Start aplikáciu
4. Marketing landing zostane na pôvodnej `subenai.sk`

**Výhoda**: minimálna integračná práca.
**Nevýhoda**: dva codebases, dva deploy pipelines.

### B) Postupný port komponent (odporúčané)
Skopírovať postupne **dáta + komponenty + routes** do existujúceho subenai.sk:
1. Skopírovať `src/lib/platform/types.ts` → existujúci projekt
2. Skopírovať `src/lib/admin-mock-data.ts` (alebo lepšie: prerobiť na DB queries hneď)
3. Skopírovať `src/components/ui/*` (shadcn) — ak ich projekt ešte nemá
4. Skopírovať `src/components/admin/*` a `src/components/user/*`
5. Skopírovať `src/styles.css` design tokeny (alebo merge so existujúcimi)
6. Postupne portovať routes do existujúcej routing štruktúry

### C) Full rewrite cez tento MVP
Nahradiť celé `subenai.sk` týmto repozitárom, doplniť marketing landing. Najväčší zásah.

---

## 3. Krok-za-krokom — Stratégia B (odporúčaná)

### Krok 1: DB schéma
Aplikovať migrácie podľa `DATABASE.md`:
- vytvor enumy
- vytvor tabuľky (profiles, user_roles, teams, questions, answer_sets, answers, tests, test_questions, sessions, session_answers, …)
- vytvor RLS politiky
- vytvor `has_role()` SECURITY DEFINER funkciu

```sql
-- has_role helper (povinné, anti-recursion)
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
```

### Krok 2: Seed dát
```bash
# v MVP repo vyexportuj mock dáta
bun run scripts/export-seed.ts   # vytvor si tento script (viď DATA.md §3)
# alebo manuálne: skopíruj polia z src/lib/admin-mock-data.ts
```
INSERT do Supabase cez SQL Editor alebo `supabase db seed`.

### Krok 3: Auth napojenie
Predpoklad: subenai.sk už používa Supabase Auth. Ak nie:
- enable Lovable Cloud (cez chat command)
- nastav email/password + Google OAuth (cez `lovable.auth.signInWithOAuth`)
- pri registrácii v triggeri vlož row do `profiles` a default `user_roles` (role='user')

```sql
create function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, display_name, avatar_initials)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), upper(left(new.email,2)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
```

### Krok 4: Skopíruj kód do existujúceho projektu

**Povinné súbory:**
```
src/lib/platform/types.ts              → tvoj-projekt/src/lib/platform/types.ts
src/lib/admin-mock-data.ts             → (typy si nechaj, mock arrays vyhoď)
src/components/ui/*                    → ak ich nemáš (shadcn)
src/components/admin/*                 → admin UI
src/components/user/*                  → user app shell, share dialog
src/components/app/page-header.tsx     → app page header
src/styles.css                         → merge design tokeny (oklch, primary, sidebar, …)
```

**Routes** — buď skopíruj 1:1 (ak používaš TanStack Router) alebo prepíš na svoj routing:
```
src/routes/app.*.tsx        → /app/* sekcia
src/routes/admin*.tsx       → /admin/* sekcia
src/routes/admin/*.tsx
src/routes/t.$shareId.tsx   → verejný respondent flow
src/routes/s.$slug.tsx      → CMS sub-page
```

### Krok 5: Replace store za Supabase queries

V `src/lib/admin/store.ts` (a `src/lib/platform/store.ts`) zameň každú repo metódu:

**Pred (mock):**
```ts
export const adminRepo = {
  questions: {
    list: () => state.questions,
    create: (q) => { state.questions.unshift(q); emit(); return q; },
    update: (id, patch) => { /* in-memory */ },
    delete: (id) => { state.questions = state.questions.filter(q => q.id !== id); emit(); },
  },
};
```

**Po (Supabase + TanStack Query):**
```ts
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (q: Omit<AdminQuestion, "id" | "created_at">) => {
      const { data, error } = await supabase.from("questions").insert(q).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });
}
```

**Privilegované operácie** (user/role management, audit insert, anonymizácia) → cez `createServerFn` + `supabaseAdmin` (viď `tanstack-supabase-integration` v stack docs):

```ts
// src/lib/admin/users.functions.ts
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const suspendUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    // verify caller is admin
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Response("Forbidden", { status: 403 });
    await supabaseAdmin.from("profiles").update({ suspended: true }).eq("id", data.userId);
    await supabaseAdmin.from("audit_log").insert({
      actor_id: context.userId, action: "user.suspend", target_type: "user", target_id: data.userId, pii_access: false,
    });
    return { ok: true };
  });
```

### Krok 6: Verejný respondent flow (`/t/$shareId`)
Toto je **public route**, prebieha bez prihlásenia. Preto **nepoužívať `requireSupabaseAuth`**, ale public server fn s `supabaseAdmin` scoped cez `share_id`:

```ts
// src/lib/public/take-test.functions.ts
export const getPublicTest = createServerFn({ method: "GET" })
  .inputValidator((i) => z.object({ shareId: z.string().min(8).max(64) }).parse(i))
  .handler(async ({ data }) => {
    // explicit safe-column projection — nikdy nevracaj owner_id, password_hash, segmentation
    const { data: test, error } = await supabaseAdmin
      .from("tests")
      .select("id, title, description, intake_fields, gdpr_purpose, allow_behavioral_tracking, status")
      .eq("share_id", data.shareId)
      .eq("status", "published")
      .single();
    if (error || !test) throw new Response("Not found", { status: 404 });
    return test;
  });
```

### Krok 7: AI generátor otázok
Existujúci skeleton: `src/lib/ai-generate.functions.ts`. Po enable Lovable Cloud:
```ts
const apiKey = process.env.LOVABLE_API_KEY;
const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
  body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [...] }),
});
```

### Krok 8: Audit + GDPR
- Každý admin endpoint zapisuje do `audit_log` (server-side, cez `supabaseAdmin`)
- Pri prístupe k PII (respondents, intake_data) → `pii_access: true`
- DSR endpointy: `/app/legal/dsr` (user request) → `/admin/dsr` (admin spracovanie)
- Cron job na anonymizáciu sessions (viď `DATABASE.md` §5)

### Krok 9: Email
Lovable Email feature (po enable Lovable Cloud): pozvánky pre respondent groups, notifikácie milestones, DSR confirmations.

### Krok 10: Deploy
- TanStack Start app deployuje na Cloudflare Workers (default Lovable target)
- Subenai.sk DNS: `app.subenai.sk` CNAME → Cloudflare
- Alebo: build statického frontu + napojiť na existujúci hosting

---

## 4. Checklist pred go-live

- [ ] Všetky tabuľky majú RLS enabled
- [ ] Žiadne tabuľky s `to anon` broad policy okrem CMS pages s `published_at is not null`
- [ ] `service_role_key` nikde v klientskom kóde (overiť `git grep VITE_SUPABASE_SERVICE`)
- [ ] `password_hash` na tests, žiadne plaintext heslá
- [ ] PII access loggovaný v `audit_log`
- [ ] Anonymizačný cron beží
- [ ] DSR endpoint funkčný (test access + erase request)
- [ ] Rate limiting na `/t/$shareId` submit (proti spamu)
- [ ] HTTPS redirect a HSTS na doméne
- [ ] Cookie consent banner (ak GDPR purpose = marketing)
- [ ] Backup DB nastavený (Supabase má automaticky)

---

## 5. Časový odhad (rough)

| Fáza | Čas |
|---|---|
| DB schéma + RLS + seed | 1-2 dni |
| Auth napojenie + profiles trigger | 0.5 dňa |
| Skopírovanie kódu + design tokens | 1 deň |
| Replace mock store → Supabase (admin) | 2-3 dni |
| Replace mock store → Supabase (user app) | 2 dni |
| Verejný flow `/t/$shareId` | 1 deň |
| AI generátor + Lovable Cloud | 0.5 dňa |
| Audit + GDPR + cron | 1 deň |
| Email + notifikácie | 1 deň |
| QA + go-live checklist | 1-2 dni |
| **Spolu** | **~12-15 dní** pre 1 dev |

---

## 6. Časté chyby (čomu sa vyhnúť)

1. **Roly na `profiles`** — privilege escalation. VŽDY `user_roles` + `has_role()` (viď [memory rule](#user-roles)).
2. **`SUPABASE_SERVICE_ROLE_KEY` v klientskom kóde** — nikdy. Service-role len v `*.server.ts` alebo `createServerFn`.
3. **Broad `to anon` policies** — leakuje cudzie dáta. Public read len cez `createServerFn` so safe-column projection.
4. **Loaders volajúce auth-protected serverFn** — SSR nemá session, 401-uje build. Volaj z komponenty cez `useServerFn` + `useQuery`, alebo daj route pod `_authenticated` layout.
5. **Plaintext heslá na testoch** — `password_hash` len, Argon2id alebo `crypt(password, gen_salt('bf'))`.
6. **Žiadny audit pri PII** — povinná podmienka pre GDPR compliance.

---

## 7. Kontakt / ďalšie kroky

Po dokončení integrácie:
- testovať respondent flow end-to-end (incognito browser)
- vygenerovať 100 fake sessions a overiť dashboard analytiky
- penetration test verejných endpointov (`/t/*`, `/s/*`)
- spustiť security scan (Lovable má built-in `security--run_security_scan`)

Hotovo. Otázky? Otvor issue v repe alebo skontaktuj autora MVP.
