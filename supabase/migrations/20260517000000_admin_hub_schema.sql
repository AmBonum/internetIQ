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

-- ============================================================================
-- AH-1.2 — Identity tables + handle_new_user trigger
-- ============================================================================
-- Role NEVER stored on profiles — only in user_roles, gated by has_role().
-- RLS is enabled on all four tables here; the actual POLICIES land in AH-1.7
-- to keep policy code colocated and reviewable. Until then these tables are
-- read-locked to authenticated users (RLS-default-deny).

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  avatar_initials text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.team_role NOT NULL DEFAULT 'viewer',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX team_members_user_id_idx ON public.team_members (user_id);
CREATE INDEX team_members_team_id_idx ON public.team_members (team_id);

-- handle_new_user: seeds a profiles row whenever auth.users gets an INSERT.
-- SECURITY DEFINER + pinned search_path are required so the function can
-- write to public.profiles regardless of the caller's RLS posture.
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
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- AH-1.3 — Content tables (categories, topics, answer_sets, answers,
--                          questions, templates, trainings)
-- ============================================================================
-- categories + topics are reference tables. answer_sets and answers form
-- the canonical answer key (answers CASCADE on set delete). questions FK
-- to categories with SET NULL on delete to preserve historical questions
-- even when a category is removed. RLS enabled; policies in AH-1.7.

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  color text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.answer_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  branch_slugs text[] NOT NULL DEFAULT '{}',
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.answer_sets ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id uuid NOT NULL REFERENCES public.answer_sets(id) ON DELETE CASCADE,
  text text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  explanation text,
  position int NOT NULL DEFAULT 0
);
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;

CREATE INDEX answers_set_position_idx ON public.answers (set_id, position);

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.question_type NOT NULL,
  prompt text NOT NULL,
  options jsonb,
  matrix_rows jsonb,
  matrix_cols jsonb,
  correct jsonb,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  branch_slug text,
  difficulty text,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.question_status NOT NULL DEFAULT 'draft',
  answer_set_id uuid REFERENCES public.answer_sets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE INDEX questions_category_branch_idx
  ON public.questions (category_id, branch_slug);

CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  question_ids uuid[] NOT NULL DEFAULT '{}',
  gdpr_purpose public.gdpr_purpose NOT NULL DEFAULT 'research',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX templates_gdpr_purpose_idx ON public.templates (gdpr_purpose);

CREATE TABLE public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  topic_slug text,
  status public.training_status NOT NULL DEFAULT 'draft',
  content jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AH-1.4 — Test + session tables + forbid_session_score_changes trigger
-- ============================================================================
-- This is the largest block. It backs AH-5 (test builder) and AH-8
-- (respondent flow). password_hash is TEXT only — never store plaintext.
-- sessions.respondent_id is NULLABLE so the AH-1.8 anonymization cron can
-- null it out post-retention without violating the FK contract.
-- forbid_session_score_changes mirrors the existing
-- forbid_attempt_score_changes pattern: once a session is 'completed',
-- the score becomes immutable. Demographic / intake fields stay editable
-- so the AH-7 DSR flow can still scrub PII.

CREATE TABLE public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  share_id text NOT NULL UNIQUE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status public.test_status NOT NULL DEFAULT 'draft',
  version int NOT NULL DEFAULT 1,
  password_hash text,
  segmentation text[] NOT NULL DEFAULT '{}',
  gdpr_purpose public.gdpr_purpose NOT NULL DEFAULT 'research',
  intake_fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  branches jsonb NOT NULL DEFAULT '[]'::jsonb,
  notif_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  anonymize_after_days int,
  allow_behavioral_tracking boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;

CREATE INDEX tests_owner_id_idx ON public.tests (owner_id);
CREATE INDEX tests_share_id_idx ON public.tests (share_id);
CREATE INDEX tests_slug_idx ON public.tests (slug);

CREATE TABLE public.test_questions (
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  position int NOT NULL DEFAULT 0,
  PRIMARY KEY (test_id, question_id)
);
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.test_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  published_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changelog text,
  UNIQUE (test_id, version)
);
ALTER TABLE public.test_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.respondents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  display_name text,
  anonymized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.respondents ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  respondent_id uuid REFERENCES public.respondents(id) ON DELETE SET NULL,
  intake_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  consent_given boolean NOT NULL DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  score numeric(5, 2),
  status public.session_status NOT NULL DEFAULT 'in_progress',
  segment text,
  ip_hash text
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX sessions_test_status_idx ON public.sessions (test_id, status);
CREATE INDEX sessions_respondent_idx ON public.sessions (respondent_id);

CREATE TABLE public.session_answers (
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  value text,
  is_correct boolean,
  time_ms int,
  PRIMARY KEY (session_id, question_id)
);
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;

CREATE INDEX session_answers_session_idx ON public.session_answers (session_id);

CREATE TABLE public.behavioral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.behavioral_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX behavioral_events_session_idx ON public.behavioral_events (session_id);

CREATE TABLE public.respondent_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_emails text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.respondent_groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.respondent_groups(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  invited_count int NOT NULL DEFAULT 0,
  UNIQUE (test_id, group_id)
);
ALTER TABLE public.group_assignments ENABLE ROW LEVEL SECURITY;

-- forbid_session_score_changes: once a session is completed, the score is
-- frozen. Demographic / intake fields (intake_data, segment) stay editable
-- so AH-7 DSR scrubbing can still null them out.
CREATE OR REPLACE FUNCTION public.forbid_session_score_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.status = 'completed'
     AND NEW.score IS DISTINCT FROM OLD.score THEN
    RAISE EXCEPTION 'Session score is immutable once status = completed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forbid_session_score_changes_trg ON public.sessions;
CREATE TRIGGER forbid_session_score_changes_trg
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.forbid_session_score_changes();

-- ============================================================================
-- AH-1.5 — Governance tables (notifications, audit_log, dsr_requests, reports)
-- ============================================================================
-- audit_log is append-only by trigger. Inserts go through createServerFn
-- handlers backed by supabaseAdmin (RLS bypass + service-role key); no
-- direct client write path. dsr_requests.sla_due_at defaults to
-- created_at + 72 hours, matching the subenai E12 SOP commitment (within
-- the GDPR Art. 12 §3 one-month outer limit).

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX notifications_user_read_idx
  ON public.notifications (user_id, read_at);

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name text,
  action text NOT NULL,
  target_type text,
  target_id text,
  pii_access boolean NOT NULL DEFAULT false,
  details jsonb,
  at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX audit_log_actor_at_idx ON public.audit_log (actor_id, at DESC);
CREATE INDEX audit_log_target_idx ON public.audit_log (target_type, target_id);

-- audit_log immutability: no UPDATE or DELETE, ever. INSERT happens via
-- supabaseAdmin in createServerFn handlers (RLS bypass). The trigger is
-- a defense-in-depth layer against accidental row mutation.
CREATE OR REPLACE FUNCTION public.forbid_audit_log_updates()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'audit_log rows are immutable';
END;
$$;

DROP TRIGGER IF EXISTS forbid_audit_log_update_trg ON public.audit_log;
CREATE TRIGGER forbid_audit_log_update_trg
  BEFORE UPDATE OR DELETE ON public.audit_log
  FOR EACH ROW EXECUTE FUNCTION public.forbid_audit_log_updates();

CREATE TABLE public.dsr_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_email text NOT NULL,
  type public.dsr_type NOT NULL,
  status public.dsr_status NOT NULL DEFAULT 'open',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  sla_due_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  resolved_at timestamptz
);
ALTER TABLE public.dsr_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX dsr_requests_status_sla_idx
  ON public.dsr_requests (status, sla_due_at);

CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL,
  target_id text NOT NULL,
  reason public.report_reason NOT NULL,
  status public.report_status NOT NULL DEFAULT 'open',
  note text,
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
