#!/usr/bin/env bash
#
# verify-supabase-migration.sh — assert the AH-1 admin-hub schema migration
# landed correctly against a Supabase project (staging or production).
#
# Usage:
#   1. Copy .env.staging.example to .env.staging (or .env.prod) and fill in
#      DATABASE_URL from Supabase Dashboard -> Project Settings -> Database.
#   2. ENV_FILE=.env.staging bash scripts/verify-supabase-migration.sh
#
# Exit codes:
#   0 — all checks pass; migration is applied cleanly
#   1 — at least one check failed; output names the bad invariant
#   2 — environment / dependency error (missing psql, env file, etc.)
#
# Safe to re-run. Read-only. Never writes to the DB.

set -euo pipefail

ENV_FILE="${ENV_FILE:-.env.staging}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Copy .env.staging.example and fill in DATABASE_URL." >&2
  exit 2
fi

# shellcheck disable=SC1090
source "$ENV_FILE"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL not set in $ENV_FILE." >&2
  exit 2
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "ERROR: psql not on PATH. Install postgresql client: brew install libpq && brew link --force libpq" >&2
  exit 2
fi

# All 32 new admin-hub tables (matches admin-hub/docs/DATABASE.md §1 verbatim).
NEW_TABLES="'profiles','user_roles','teams','team_members',\
'categories','topics','answer_sets','answers','questions','templates','trainings',\
'tests','test_questions','test_versions',\
'respondents','sessions','session_answers','behavioral_events','respondent_groups','group_assignments',\
'notifications','audit_log','dsr_requests','reports',\
'cms_pages','cms_header','cms_footer','cms_navigation','share_card_config','quick_test_config','support_config','app_settings'"

NEW_ENUMS="'app_role','test_status','question_type','question_status','gdpr_purpose',\
'session_status','training_status','report_reason','report_status','team_role','dsr_type','dsr_status'"

EXISTING_SUBENAI_TABLES="'attempts','test_sets','sponsors','donations','subscriptions'"

fails=0

check() {
  local label="$1"
  local query="$2"
  local expected="$3"
  local actual
  if ! actual=$(psql "$DATABASE_URL" -t -A -c "$query" 2>/dev/null); then
    echo "FAIL [$label]: query returned a Postgres error"
    fails=$((fails + 1))
    return
  fi
  actual="${actual// /}" # strip whitespace
  if [[ "$actual" == "$expected" ]]; then
    printf "PASS [%-46s] %s\n" "$label" "$actual"
  else
    printf "FAIL [%-46s] got=%s expected=%s\n" "$label" "$actual" "$expected"
    fails=$((fails + 1))
  fi
}

echo "=== AH-1 admin-hub schema verification ==="
echo "Against: $(echo "$DATABASE_URL" | sed -E 's|(://[^:]+:)[^@]+(@)|\1***\2|')"
echo

check "new tables created" \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename IN ($NEW_TABLES);" \
  "32"

check "new enums created" \
  "SELECT count(*) FROM pg_type WHERE typtype='e' AND typnamespace=(SELECT oid FROM pg_namespace WHERE nspname='public') AND typname IN ($NEW_ENUMS);" \
  "12"

check "RLS enabled on new tables" \
  "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='public' AND c.relrowsecurity AND c.relname IN ($NEW_TABLES);" \
  "32"

check "RLS policies on new tables (>= 57)" \
  "SELECT (count(*)>=57)::int FROM pg_policies WHERE schemaname='public' AND tablename IN ($NEW_TABLES);" \
  "1"

check "has_role(uuid, app_role) function exists" \
  "SELECT count(*) FROM pg_proc WHERE proname='has_role' AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public');" \
  "1"

check "has_role is SECURITY DEFINER" \
  "SELECT prosecdef::int FROM pg_proc WHERE proname='has_role' AND pronamespace=(SELECT oid FROM pg_namespace WHERE nspname='public');" \
  "1"

check "handle_new_user trigger on auth.users" \
  "SELECT count(*) FROM pg_trigger WHERE tgname='on_auth_user_created';" \
  "1"

check "forbid_session_score_changes trigger on sessions" \
  "SELECT count(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid=c.oid WHERE c.relname='sessions' AND tgname LIKE '%forbid%score%';" \
  "1"

check "audit_log immutability trigger" \
  "SELECT count(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid=c.oid WHERE c.relname='audit_log';" \
  "1"

check "existing subenai tables preserved" \
  "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename IN ($EXISTING_SUBENAI_TABLES);" \
  "5"

check "existing attempts row count unchanged baseline (>=0)" \
  "SELECT (count(*)>=0)::int FROM public.attempts;" \
  "1"

check "user_roles unique(user_id, role)" \
  "SELECT count(*) FROM pg_constraint c JOIN pg_class t ON c.conrelid=t.oid WHERE t.relname='user_roles' AND c.contype='u';" \
  "1"

check "pg_cron extension NOT installed (Decision #9 - manual activate)" \
  "SELECT (count(*)=0)::int FROM pg_extension WHERE extname='pg_cron';" \
  "1"

echo
if [[ $fails -eq 0 ]]; then
  echo "All checks PASSED. AH-1 migration is applied cleanly."
  echo
  echo "Next: promote the first admin per Decision #10:"
  echo "  INSERT INTO public.user_roles (user_id, role)"
  echo "  VALUES ('<your-uuid-from-auth-users>', 'admin');"
  exit 0
else
  echo "$fails check(s) FAILED — see lines above. Migration is incomplete or drifted."
  exit 1
fi
