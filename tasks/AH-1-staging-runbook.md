# AH-1 staging verification runbook

Before AH-1 ships to production, the schema must be verified against a Supabase
staging project. This document is the user-facing recipe.

Reusable for every future migration epic (AH-2 design tokens does not touch DB,
but AH-9.5 question migration, AH-11 wiring epic, and any other AH-* with DB
impact will reuse this workflow).

---

## One-time staging setup (~5 minutes)

1. Open https://supabase.com/dashboard and create a new project:
   - **Name**: `subenai-staging` (or similar — does not need to match anything)
   - **Region**: same as production (eu-central-1 if applicable)
   - **Pricing plan**: Free tier is fine for AH-1 testing
   - Wait ~2 minutes for the project to provision

2. Get the connection string:
   - Project Settings → Database → Connection string
   - Pick the **URI** tab (direct connection, not pooler — we need DDL access)
   - The string looks like:
     `postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres`
   - The password is in Project Settings → Database → "Database password"
     (regenerate it once if you don't have it)

3. In the repo root:
   ```bash
   cp .env.staging.example .env.staging
   # Edit .env.staging and paste the full URI with the real password.
   # .env.staging is in .gitignore — never committed.
   ```

4. Install psql if missing (one-time):
   ```bash
   brew install libpq
   brew link --force libpq  # so `psql` is on PATH
   ```

---

## Apply the AH-1 migration to staging

Two ways. Pick one.

### Option A — Supabase CLI (recommended)

```bash
# One-time: link this repo to the staging project.
supabase login                                  # opens browser, stores token
supabase link --project-ref <staging-ref>       # ref from the URL or .env

# Per migration:
supabase db push --dry-run                      # preview SQL diff (read-only)
supabase db push                                # apply (prompts for db password)
```

### Option B — psql direct (no CLI link needed)

```bash
psql "$(grep DATABASE_URL .env.staging | cut -d= -f2- | tr -d '"')" \
     -f supabase/migrations/20260517000000_admin_hub_schema.sql
```

---

## Verify the migration landed correctly

```bash
npm run db:verify:staging
```

Expected output: 14 lines starting with `PASS [...]`, ending with
`All checks PASSED.` and exit code 0.

If any line starts with `FAIL`, the migration did not apply cleanly. Read
the line — the name of the failing invariant (e.g.
`RLS enabled on new tables` = 31 expected 32) points at the missing piece.

---

## Promote yourself as the first admin (staging)

After the schema is in, you need at least one row in `user_roles` to test
admin-gated flows. The migration creates empty tables; no admin exists yet.

```bash
# 1. Sign up via the staging Supabase Auth (use Dashboard -> Auth -> Add user,
#    or run a real sign-up flow if you have one wired locally).

# 2. Get your auth uuid:
psql "$DATABASE_URL" -c "SELECT id, email FROM auth.users LIMIT 5;"

# 3. Insert the admin role:
psql "$DATABASE_URL" -c \
  "INSERT INTO public.user_roles (user_id, role) VALUES ('<your-uuid>', 'admin');"

# 4. Verify:
psql "$DATABASE_URL" -c \
  "SELECT u.email, ur.role FROM public.user_roles ur \
   JOIN auth.users u ON ur.user_id = u.id;"
```

This is exactly the production bootstrap step from `DEPLOY_SETUP.sql` —
running it on staging first proves the recipe works.

---

## Smoke tests (manual, ~5 minutes)

After PASS + admin bootstrap:

1. **RLS on `tests`**: as anon, `SELECT count(*) FROM tests` should error
   with "permission denied" or return 0 (depending on session). As admin
   (set `request.jwt.claims` via psql), it should return 0 cleanly.

2. **`has_role()` smoke**:
   ```sql
   SELECT public.has_role('<your-uuid>', 'admin'); -- expect t
   SELECT public.has_role('<your-uuid>', 'moderator'); -- expect f
   ```

3. **`handle_new_user` trigger**: create a new auth.user via Dashboard;
   `SELECT id, email FROM public.profiles WHERE id = '<new-uuid>'` should
   return one row.

4. **`forbid_session_score_changes` trigger**: insert a `sessions` row with
   `status='completed'`, then `UPDATE sessions SET score = 99 WHERE id = ...`
   — should raise an error.

5. **audit_log immutability**: insert one `audit_log` row, then try
   `UPDATE audit_log SET action='changed' WHERE id = ...` — should raise.

---

## What to send to me when done

If everything passes on staging, paste back:

- Output of `npm run db:verify:staging` (all PASS)
- One-line confirmation that the admin bootstrap + smoke tests worked
- Any drift / unexpected behavior (so we can fix on the AH-1 branch before
  merge)

Then we mark PR #17 ready-for-review and you merge it.

---

## Production deploy (after staging is green)

Same steps, different env file:

```bash
cp .env.staging.example .env.prod   # use the production project URI
# Then:
supabase link --project-ref <prod-ref>
supabase db push
npm run db:verify:prod
# Manual admin bootstrap as above
```

---

## Cleanup

After AH-1 is on production and the staging round-trip is done, you can
keep the staging project for AH-2..AH-11 (recommended — every future
migration reuses this same workflow), or delete it via Supabase
Dashboard → Project Settings → Danger zone.
