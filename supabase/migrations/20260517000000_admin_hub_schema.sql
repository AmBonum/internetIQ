-- ============================================================================
-- AH-1 — admin-hub schema foundation
-- Source: admin-hub/docs/DATABASE.md §1–§5
-- ============================================================================
-- This migration is additive only. It MUST NOT alter or drop:
--   tables: attempts, test_sets, sponsors, donations, subscriptions
--   views: public_sponsors, footer_sponsors, attempts_anon
--   functions: hash_test_set_password, verify_test_set_password,
--              purge_expired_respondent_pii, purge_expired_attempts,
--              purge_unused_test_sets, forbid_attempt_score_changes
--
-- Section order (function-before-policy is mandatory):
--   AH-1.1 — Enums + has_role() SECURITY DEFINER
--   AH-1.2 — Identity tables + handle_new_user trigger
--   AH-1.3 — Content tables (categories, topics, answer_sets, answers,
--            questions, templates, trainings)
--   AH-1.4 — Test + session tables + forbid_session_score_changes trigger
--   AH-1.5 — Governance tables + audit_log immutability trigger
--   AH-1.6 — CMS + config tables with singleton seed rows
--   AH-1.7 — RLS policies for all 29 new tables (cross-cutting)
--   AH-1.8 — pg_cron stubs (commented out, manual activation post-merge)
-- ============================================================================

-- ============================================================================
-- AH-1.1 — Enums (12) + has_role() helper
-- ============================================================================
-- has_role() must exist BEFORE any RLS policy that references it (AH-1.7).
-- Roles NEVER live on public.profiles — only in public.user_roles. The
-- SECURITY DEFINER function with a pinned search_path is the canonical
-- privilege check used by every admin policy.

CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TYPE public.test_status AS ENUM ('draft', 'published', 'archived');

CREATE TYPE public.question_type AS ENUM (
  'single', 'multi', 'scale_1_5', 'scale_1_10', 'nps', 'matrix', 'ranking',
  'slider', 'short_text', 'long_text', 'date', 'time', 'file_upload',
  'image_choice', 'yes_no'
);

CREATE TYPE public.question_status AS ENUM (
  'draft', 'approved', 'deprecated', 'pending', 'flagged', 'published', 'archived'
);

CREATE TYPE public.gdpr_purpose AS ENUM (
  'marketing', 'research', 'recruitment', 'education', 'internal_training'
);

CREATE TYPE public.session_status AS ENUM ('in_progress', 'completed', 'abandoned');

CREATE TYPE public.training_status AS ENUM ('published', 'draft', 'archived');

CREATE TYPE public.report_reason AS ENUM (
  'spam', 'inappropriate', 'harassment', 'misinformation', 'other'
);

CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');

CREATE TYPE public.team_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TYPE public.dsr_type AS ENUM ('access', 'erase', 'portability');

CREATE TYPE public.dsr_status AS ENUM ('open', 'in_progress', 'completed', 'rejected');

-- has_role: anti-recursion privilege check. Used by every admin RLS policy.
-- SECURITY DEFINER bypasses the caller's RLS on user_roles. STABLE allows
-- Postgres to memoize the result within a single query. search_path is
-- pinned to defend against schema-injection from a malicious caller.
-- plpgsql (not sql) is used so the body parses lazily — user_roles is
-- created in AH-1.2, which lands in the same migration but after this
-- function. A pure-SQL function would fail at CREATE time because its
-- body is fully parsed (relation-resolved) before the table exists.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  found_role boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) INTO found_role;
  RETURN found_role;
END;
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated;
