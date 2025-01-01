# 🚀 Deployment Guide — Internet IQ Test

Ako rozbehať túto appku na **vlastnom hostingu zadarmo** (Cloudflare Pages + Supabase Free + tvoja doména z Websupportu).

**Cena: 0 €/mesiac** · Kapacita: 100 000+ requestov/deň zadarmo · Bez vendor lock-inu.

---

## 📦 Čo budeš potrebovať

- ✅ GitHub účet (zadarmo) — https://github.com
- ✅ Supabase účet (zadarmo) — https://supabase.com
- ✅ Cloudflare účet (zadarmo) — https://dash.cloudflare.com/sign-up
- ✅ Doménu na Websupporte (alebo ktoromkoľvek registrátorovi)

Žiadnu kartu, žiadne predplatné. Vystačíš si s free tier.

---

## KROK 1 — Pripoj projekt na GitHub

1. V Lovable klikni vľavo na **Connectors** → **GitHub** → **Connect project**
2. Autorizuj Lovable GitHub App
3. Vyber účet/organizáciu
4. Klikni **Create Repository** → vyber názov (napr. `internet-iq-test`)

✅ Hotovo. Tvoj kód je teraz na GitHub a synchronizuje sa obojsmerne.

---

## KROK 2 — Vytvor si vlastnú databázu na Supabase

1. Choď na **https://supabase.com** a klikni **Start your project**
2. Sign up cez GitHub (najrýchlejšie)
3. **New project**:
   - Name: `internet-iq-test`
   - Database password: **vygeneruj silné heslo a ulož si ho**
   - Region: **Frankfurt (eu-central-1)** ← najbližšie k SK
   - Plan: **Free**
4. Počkaj ~2 minúty kým sa projekt vytvorí

### Importuj schému
1. V ľavom menu otvor **SQL Editor** → **New query**
2. Skopíruj celý obsah súboru **`DEPLOY_SETUP.sql`** (z root projektu)
3. Vlož do editora a klikni **Run**
4. Mal by si vidieť „Success. No rows returned"

### Skopíruj credentials
1. V ľavom menu otvor **Settings** (ikona ⚙️) → **API**
2. Skopíruj si tieto **dve hodnoty** (potrebuješ ich v ďalšom kroku):
   - **Project URL** (napr. `https://abcdefgh.supabase.co`)
   - **anon public** key (dlhý JWT token začínajúci `eyJ...`)

⚠️ **NIKDY nezdieľaj `service_role` key!** Iba `anon public` key je bezpečný v prehliadači.

---

## KROK 3 — Deploy na Cloudflare Pages

1. Choď na **https://dash.cloudflare.com** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Vyber svoj GitHub účet, schvál Cloudflare prístup
3. Vyber repo `internet-iq-test`
4. **Set up builds and deployments**:
   - Framework preset: **None** (alebo „Vite" ak je v zozname)
   - Build command: `bun install && bun run build`
   - Build output directory: `dist`
   - Root directory: `/`
5. **Environment variables** (klikni „Add variable"):
   ```
   VITE_SUPABASE_URL          = https://tvoj-projekt.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY = eyJ... (anon public key)
   VITE_SUPABASE_PROJECT_ID   = tvoj-projekt   (časť pred .supabase.co)
   ```
6. Klikni **Save and Deploy**

Build trvá ~3-5 minút. Keď doběhne, dostaneš URL ako `internet-iq-test.pages.dev`.

✅ **Otestuj appku na tej URL.** Ak funguje, ideš na vlastnú doménu.

---

## KROK 4 — Pripoj svoju doménu z Websupportu

### V Cloudflare Pages
1. V Cloudflare projekte: **Custom domains** → **Set up a custom domain**
2. Zadaj svoju doménu (napr. `internetiqtest.sk`)
3. Cloudflare ti ukáže DNS záznamy, ktoré treba nastaviť

### Vo Websupporte (DNS manager)
Máš dve možnosti:

**Možnosť A: Nameservery na Cloudflare** (odporúčané — zadarmo CDN, DDoS ochrana)
1. Vo Websupporte: **Domény** → tvoja doména → **Nameservery**
2. Zmeň na nameservery, ktoré ti dá Cloudflare (napr. `xxx.ns.cloudflare.com`)
3. V Cloudflare DNS sa už záznamy pridajú automaticky

**Možnosť B: Iba CNAME** (necháš nameservery vo Websupporte)
1. Vo Websupporte: **DNS záznamy** → pridaj:
   ```
   Typ:   CNAME
   Názov: @  (alebo www)
   Cieľ:  internet-iq-test.pages.dev
   TTL:   3600
   ```

DNS propagácia trvá od pár minút do 48 hodín. Cloudflare automaticky vystaví SSL certifikát (HTTPS).

---

## 🎉 Hotovo!

Tvoja appka beží na vlastnej doméne, vlastnom GitHub repe, vlastnom Supabase účte. Cena 0€.

### Ako pristúpiť k dátam dotazníka
- Supabase dashboard → **Table Editor** → `attempts`
- Export do CSV: klikni na tabuľku → menu → **Export data as CSV**

### Free tier limity (pre kontext)
| Služba | Free limit | Reálne pre 50k userov/týždeň |
|---|---|---|
| Cloudflare Pages | 100 000 requestov/deň | ✅ Bohato stačí |
| Supabase Free | 500 MB DB, 5 GB bandwidth/mesiac | ✅ Stačí ~250 000 testov |
| Supabase API requests | Neobmedzené | ✅ |

⚠️ **Pozor**: Supabase Free pauzne projekt po **7 dňoch nečinnosti**. Pri reálnom traffiku ti to nehrozí. Ak appka zaspí, klikni v Supabase **Restore project**.

---

## 🔄 Ako updatovať appku po deploy?

1. Spravíš zmenu v Lovable
2. Auto-syncne sa do GitHub
3. Cloudflare Pages auto-detekuje push a re-buildne (~3 min)

Žiadne manuálne deploy kroky.

---

## 🆘 Riešenie problémov

**Build fails na Cloudflare**
- Skontroluj, či máš v env variables všetky 3 `VITE_SUPABASE_*` hodnoty
- Logy buildu sú v Cloudflare → tvoj projekt → **Deployments** → klikni na deployment

**Appka načíta, ale data sa neukladajú**
- Otvor v prehliadači F12 → Console → pozri error
- Skontroluj v Supabase **Logs** → **Postgres logs**, či prichádzajú requesty
- Over si, že `VITE_SUPABASE_URL` aj `VITE_SUPABASE_PUBLISHABLE_KEY` sú správne (bez medzier, bez úvodzoviek)

**Doména neukazuje na appku**
- DNS propagácia môže trvať až 48h. Skontroluj na https://dnschecker.org
- Skontroluj, že CNAME ukazuje presne na `tvoj-projekt.pages.dev`
