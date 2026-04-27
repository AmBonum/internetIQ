# US-190 – Používateľ sa registruje a prihlasuje do platformy

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-190                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Používateľské účty                |
| **Rola** | Akýkoľvek používateľ (respondent / autor) |

---

## User Story

> Ako **používateľ platformy**
> chcem **môcť si vytvoriť účet a prihlásiť sa**
> aby som **mal prístup k svojej histórii, nastaveniam a mohol spravovať vlastné testy**.

---

## Kontext

Doteraz platforma fungovala bez stálych účtov – autori mali per-test admin heslo
a respondenti mali session-based prístup. Nový unifikovaný účtový systém
(Supabase Auth) nahrádza obe ad-hoc schémy. Jeden účet môže mať rolu respondent
aj autor súčasne – nie sú to navzájom exkluzívne role. Existujúce per-test
heslá (US-050) zostávajú ako doplnkový prístupový mechanizmus pre respondentov
bez účtu (backward compat).

---

## Akceptačné kritériá

- [ ] **AC-1:** Registrácia je dostupná z: hlavného navigačného menu, landing stránky testu (respondent flow – US-191), summary stránky po dokončení testu, a z admin/autor flow.
- [ ] **AC-2:** Registračný formulár vyžaduje: email, heslo, potvrdenie hesla. Meno/prezývka je voliteľná pri registrácii (doplniteľná neskôr v profile). Heslová politika rovnaká ako US-052 (min 12 chars, complexity).
- [ ] **AC-3:** Po registrácii Supabase Auth odošle verifikačný email. Účet je funkčný len po kliknutí na verifikačný link (email confirmation required). Neoverený účet má `status = 'unverified'` a obmedzené oprávnenia.
- [ ] **AC-4:** OAuth login (Google) je podporovaný ako alternatíva k email/heslu. OAuth používateľ nemá password – password reset flow sa na neho nevzťahuje.
- [ ] **AC-5:** Prihlásenie: email + heslo, alebo OAuth. Neúspešné pokusy: po 5 zlyhaní za 15 min je IP/email rate-limited (Supabase Auth built-in alebo Cloudflare WAF rule).
- [ ] **AC-6:** „Zabudnuté heslo": odošle reset link platný 1h. Reset vyžaduje nové heslo spĺňajúce politiku (US-052). Starý JWT token je invalidovaný po resete.
- [ ] **AC-7:** Pri registrácii sa vytvorí `public.profiles` záznam (trigger po `auth.users INSERT`): `{ id: auth.user.id, display_name, avatar_url, created_at, default_role: 'respondent' }`.
- [ ] **AC-8:** Nový účet má automaticky rolu `respondent`. Povýšenie na `author` alebo `platform_admin` je explicitná akcia (US-193). Downgrade role nie je možný sebaobsluhou – len platform admin.

---

## Technické poznámky

```sql
-- profiles tabuľka (extends auth.users)
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles (multi-role support)
CREATE TABLE public.user_roles (
  user_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('respondent','author','platform_admin')),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role)
);

-- trigger: auto-assign 'respondent' role on registration
CREATE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id) VALUES (NEW.id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'respondent');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

- Supabase Auth JWT: `app_metadata.roles` array je synchronizovaný s `user_roles` tabuľkou cez DB trigger (pre RLS policy use).
- Session duration: 8h inactivity / 24h absolute (konzistentné s US-100 admin session).

---

## Edge Cases

- Používateľ sa zaregistruje s emailom, ktorý existuje ako OAuth účet: Supabase Auth zlúči účty ak je `link_identities` povolené, inak vráti chybu s pokyny na prihlásenie cez Google.
- Verifikačný email neprišiel: resend funkcia dostupná po 60 sekundách (rate limit).
- Admin deaktivuje účet (US-197): deaktivovaný účet dostane 401 pri každom pokuse o prihlásenie s jasnou správou.

---

## Závislosti

- Závisí na: Supabase Auth, US-052 (heslová politika)
- Blokuje: US-191–197 (všetky account stories závisia na tejto základnej registrácii)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: trigger auto-assign respondent role, rate limit prihlásenia
- [ ] E2E test: registrácia → verifikácia emailu → prihlásenie
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: minimálne PII pri registrácii, meno voliteľné
