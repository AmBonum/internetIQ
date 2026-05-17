-- ============================================================================
-- AH-1.9 — Fix handle_new_user trigger: also seed default 'user' role
-- ============================================================================
--
-- Bug in AH-1.2 (migration 20260517000000_admin_hub_schema.sql, line 145+):
-- the handle_new_user() trigger inserted into public.profiles but missed
-- the second INSERT into public.user_roles that the admin-hub INTEGRATION.md
-- spec requires:
--
--     "pri registrácii v triggeri vlož row do `profiles` a default
--      `user_roles` (role='user')"
--
-- Symptom: every new auth.users INSERT produces a profile but no role row.
-- has_role(uid, 'user') returns false for everyone except those manually
-- promoted, breaking RLS policies that gate on user-tier read access.
--
-- This migration:
--   1) Replaces the trigger function to insert into BOTH tables.
--   2) Backfills public.user_roles for every existing auth.users row that
--      currently has no 'user' role (one-time correction for pre-fix data).
--
-- Safe to re-run. Idempotent via ON CONFLICT.

-- ----------------------------------------------------------------------------
-- 1. Replace the trigger function (additive — keeps the existing profiles
--    INSERT, appends the missing user_roles INSERT)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_initials)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    upper(left(NEW.email, 2))
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- The trigger itself is unchanged; CREATE OR REPLACE FUNCTION updates the body
-- in place. No DROP/CREATE TRIGGER needed.

-- ----------------------------------------------------------------------------
-- 2. Backfill — every auth.users that pre-dates this fix gets the 'user' role
--    if missing. Existing 'admin' / 'moderator' assignments are preserved.
-- ----------------------------------------------------------------------------

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = u.id AND ur.role = 'user'
)
ON CONFLICT (user_id, role) DO NOTHING;
