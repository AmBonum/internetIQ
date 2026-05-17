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

-- ============================================================================
-- AH-1.6 — CMS + config tables (cms_pages, cms_header, cms_footer,
--                                cms_navigation, share_card_config,
--                                quick_test_config, support_config,
--                                app_settings)
-- ============================================================================
-- Singleton tables (cms_header, cms_footer, cms_navigation,
-- share_card_config, quick_test_config, support_config) all use a
-- CHECK (id = 1) constraint to guarantee a single row, and ship with a
-- seeded id=1 row so AH-9 loaders can always read defaults. app_settings
-- is a generic key/value bag (PK is `key text`, not a uuid).

CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  seo_title text,
  seo_description text,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

CREATE INDEX cms_pages_slug_idx ON public.cms_pages (slug);
CREATE INDEX cms_pages_status_published_idx
  ON public.cms_pages (status, published_at DESC);

CREATE TABLE public.cms_header (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  logo text,
  nav jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_header ENABLE ROW LEVEL SECURITY;
INSERT INTO public.cms_header (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.cms_footer (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  columns jsonb NOT NULL DEFAULT '[]'::jsonb,
  socials jsonb NOT NULL DEFAULT '[]'::jsonb,
  legal jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_footer ENABLE ROW LEVEL SECURITY;
INSERT INTO public.cms_footer (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.cms_navigation (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cms_navigation ENABLE ROW LEVEL SECURITY;
INSERT INTO public.cms_navigation (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.share_card_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  tiers jsonb NOT NULL DEFAULT '[]'::jsonb,
  gradient text,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.share_card_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.share_card_config (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.quick_test_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quick_test_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.quick_test_config (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.support_config (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  email text,
  hours text,
  enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.support_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.support_config (id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- AH-1.7 — RLS policies for all 29 new tables
-- ============================================================================
-- Categories of policy:
--   (A) Owner-owned: owner does CRUD via owner_id = auth.uid(); admin via
--       has_role(auth.uid(), 'admin'). Tables: tests, answer_sets,
--       templates, respondent_groups, notifications (user_id), trainings.
--   (B) Identity: user reads own row (id = auth.uid() or user_id =
--       auth.uid()); admin reads all. Tables: profiles, user_roles,
--       teams, team_members. user_roles writes are admin-only.
--   (C) Public read + admin write: anon SELECT on the published subset;
--       admin-only INSERT/UPDATE/DELETE. Tables: categories, topics,
--       trainings (status=published only via the (A) policy admin path),
--       cms_pages (status=published only), all six singletons.
--   (D) Server-fn-only: NO direct anon/auth read or write. Writes flow
--       through createServerFn handlers using supabaseAdmin (RLS bypass).
--       Authenticated test-owner SELECT is allowed via EXISTS join.
--       Tables: respondents, sessions, session_answers,
--       behavioral_events.
--   (E) Admin-only: read via has_role('admin'); writes via supabaseAdmin
--       only. Tables: audit_log, dsr_requests, reports.
--   (F) Linking: test_questions, test_versions, group_assignments — read
--       follows tests-owner read; write follows tests-owner write.
--
-- pg_policies post-migration cross-check — every name below must appear
-- at least once in pg_policies.tablename:
--   profiles, user_roles, teams, team_members,
--   categories, topics, answer_sets, answers, questions, templates, trainings,
--   tests, test_questions, test_versions, respondents, sessions,
--   session_answers, behavioral_events, respondent_groups, group_assignments,
--   notifications, audit_log, dsr_requests, reports,
--   cms_pages, cms_header, cms_footer, cms_navigation, share_card_config,
--   quick_test_config, support_config, app_settings.

-- (B) profiles
CREATE POLICY profiles_self_read ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- (B) user_roles — admin-only writes, self-read
CREATE POLICY user_roles_self_read ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_write ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (B) teams
CREATE POLICY teams_member_read ON public.teams
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY teams_owner_write ON public.teams
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- (B) team_members
CREATE POLICY team_members_self_read ON public.team_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id AND t.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY team_members_owner_write ON public.team_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id AND t.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_members.team_id AND t.owner_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

-- (C) categories — anon read, admin write
CREATE POLICY categories_public_read ON public.categories
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY categories_admin_write ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (C) topics
CREATE POLICY topics_public_read ON public.topics
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topics_admin_write ON public.topics
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (A) answer_sets — owner CRUD + admin
CREATE POLICY answer_sets_owner_read ON public.answer_sets
  FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY answer_sets_owner_write ON public.answer_sets
  FOR ALL TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- (F) answers — follow the parent answer_set
CREATE POLICY answers_via_set_read ON public.answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.answer_sets s
      WHERE s.id = answers.set_id
        AND (s.author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY answers_via_set_write ON public.answers
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.answer_sets s
      WHERE s.id = answers.set_id
        AND (s.author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.answer_sets s
      WHERE s.id = answers.set_id
        AND (s.author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- (A) questions
CREATE POLICY questions_owner_read ON public.questions
  FOR SELECT TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY questions_owner_write ON public.questions
  FOR ALL TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- (E-A hybrid) templates — admin-only writes; authenticated read
CREATE POLICY templates_auth_read ON public.templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY templates_admin_write ON public.templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (C) trainings — anon read of published; admin write
CREATE POLICY trainings_public_published_read ON public.trainings
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY trainings_admin_write ON public.trainings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (A) tests
CREATE POLICY tests_owner_read ON public.tests
  FOR SELECT TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = tests.team_id AND tm.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY tests_owner_write ON public.tests
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- (F) test_questions
CREATE POLICY test_questions_via_test_read ON public.test_questions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_questions.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY test_questions_via_test_write ON public.test_questions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_questions.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_questions.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- (F) test_versions
CREATE POLICY test_versions_via_test_read ON public.test_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_versions.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY test_versions_admin_write ON public.test_versions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_versions.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = test_versions.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- (D) respondents — NO anon access. Test-owner SELECT via session join.
--     Writes via supabaseAdmin only (RLS bypass).
CREATE POLICY respondents_via_session_read ON public.respondents
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.tests t ON t.id = s.test_id
      WHERE s.respondent_id = respondents.id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- (D) sessions
CREATE POLICY sessions_via_test_read ON public.sessions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = sessions.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- (D) session_answers
CREATE POLICY session_answers_via_test_read ON public.session_answers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.tests t ON t.id = s.test_id
      WHERE s.id = session_answers.session_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- (D) behavioral_events
CREATE POLICY behavioral_events_via_test_read ON public.behavioral_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions s
      JOIN public.tests t ON t.id = s.test_id
      WHERE s.id = behavioral_events.session_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- (A) respondent_groups
CREATE POLICY respondent_groups_owner_read ON public.respondent_groups
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY respondent_groups_owner_write ON public.respondent_groups
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- (F) group_assignments — follow the parent test
CREATE POLICY group_assignments_via_test_read ON public.group_assignments
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = group_assignments.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );
CREATE POLICY group_assignments_via_test_write ON public.group_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = group_assignments.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = group_assignments.test_id
        AND (t.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- (A) notifications — user reads own
CREATE POLICY notifications_self_read ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY notifications_self_update ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- (E) audit_log — admin-only read; writes via supabaseAdmin
CREATE POLICY audit_log_admin_read ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- (E) dsr_requests — admin-only read; writes via supabaseAdmin
CREATE POLICY dsr_requests_admin_read ON public.dsr_requests
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- (E) reports — admin-only read; writes via supabaseAdmin
CREATE POLICY reports_admin_read ON public.reports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- (C) cms_pages — anon read of published, admin write
CREATE POLICY cms_pages_public_published_read ON public.cms_pages
  FOR SELECT TO anon, authenticated
  USING (
    (status = 'published' AND published_at IS NOT NULL)
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY cms_pages_admin_write ON public.cms_pages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (C) cms_header / cms_footer / cms_navigation — anon read, admin write
CREATE POLICY cms_header_public_read ON public.cms_header
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cms_header_admin_write ON public.cms_header
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY cms_footer_public_read ON public.cms_footer
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cms_footer_admin_write ON public.cms_footer
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY cms_navigation_public_read ON public.cms_navigation
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY cms_navigation_admin_write ON public.cms_navigation
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (C) share_card_config / quick_test_config / support_config
CREATE POLICY share_card_config_public_read ON public.share_card_config
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY share_card_config_admin_write ON public.share_card_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY quick_test_config_public_read ON public.quick_test_config
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY quick_test_config_admin_write ON public.quick_test_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY support_config_public_read ON public.support_config
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY support_config_admin_write ON public.support_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- (E) app_settings — admin-only read + write (no public surface)
CREATE POLICY app_settings_admin_read ON public.app_settings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY app_settings_admin_write ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- AH-1.8 — pg_cron stubs (COMMENTED OUT — manual activation post-merge)
-- ============================================================================
-- The pg_cron extension is not enabled by default in Supabase projects.
-- After this migration runs in production, the project owner must:
--   1. Open the Supabase Dashboard -> Database -> Extensions.
--   2. Enable pg_cron (CREATE EXTENSION IF NOT EXISTS pg_cron;).
--   3. Uncomment the two cron.schedule calls below and re-run them.
-- See tasks/PLAN-2026-05-17-admin-hub-integration.md decision #9.
--
-- anonymize-sessions — runs daily at 03:00, nulls respondent_id on
-- sessions older than the parent test's anonymize_after_days window.
-- The forbid_session_score_changes trigger from AH-1.4 still permits
-- this (it only blocks score mutation).
--
-- select cron.schedule('anonymize-sessions', '0 3 * * *', $$
--   update public.sessions s set respondent_id = null
--     from public.tests t
--    where s.test_id = t.id
--      and t.anonymize_after_days is not null
--      and s.finished_at < now() - (t.anonymize_after_days || ' days')::interval
--      and s.respondent_id is not null;
-- $$);
--
-- dsr-sla-check — runs hourly, surfaces dsr_requests whose sla_due_at
-- has elapsed without being resolved. The function it calls (to be
-- added in AH-7) writes a row to notifications for every admin.
--
-- select cron.schedule('dsr-sla-check', '0 * * * *', $$
--   select 1; -- replaced in AH-7 by public.dsr_sla_check_notify()
-- $$);
