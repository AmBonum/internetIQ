import { describe, it, expect } from "vitest";
import type { Database } from "@/integrations/supabase/types";

// AH-1.8 — the regenerated Database type must carry every one of the 29
// new admin-hub tables and all 12 enums. Until the Supabase CLI is wired
// into CI, the file is hand-synced; this spec is the guard that the
// hand-sync didn't drop anything.

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

const EXPECTED_NEW_TABLES = [
  "answer_sets",
  "answers",
  "app_settings",
  "audit_log",
  "behavioral_events",
  "categories",
  "cms_footer",
  "cms_header",
  "cms_navigation",
  "cms_pages",
  "dsr_requests",
  "group_assignments",
  "notifications",
  "profiles",
  "questions",
  "quick_test_config",
  "reports",
  "respondent_groups",
  "respondents",
  "session_answers",
  "sessions",
  "share_card_config",
  "support_config",
  "team_members",
  "teams",
  "templates",
  "test_questions",
  "test_versions",
  "tests",
  "topics",
  "trainings",
  "user_roles",
] as const;

const EXPECTED_ENUMS = [
  "app_role",
  "test_status",
  "question_type",
  "question_status",
  "gdpr_purpose",
  "session_status",
  "training_status",
  "report_reason",
  "report_status",
  "team_role",
  "dsr_type",
  "dsr_status",
] as const;

describe("AH-1.8 regenerated Database types include admin-hub schema", () => {
  it("declares all admin-hub table keys", () => {
    // The cast forces a type-level keyof check: if a name is missing,
    // tsc fails the build before the test even runs.
    type AllTables = keyof Tables;
    const sample: AllTables[] = [...EXPECTED_NEW_TABLES];
    expect(sample.length).toBe(EXPECTED_NEW_TABLES.length);
  });

  it("declares all 12 admin-hub enums", () => {
    type AllEnums = keyof Enums;
    const sample: AllEnums[] = [...EXPECTED_ENUMS];
    expect(sample.length).toBe(12);
  });

  it("preserves the original subenai tables", () => {
    type AllTables = keyof Tables;
    const preserved: AllTables[] = [
      "attempts",
      "test_sets",
      "sponsors",
      "donations",
      "subscriptions",
    ];
    expect(preserved).toHaveLength(5);
  });

  it("exposes has_role under Functions", () => {
    type HasRoleArgs = Database["public"]["Functions"]["has_role"]["Args"];
    const args: HasRoleArgs = {
      _user_id: "00000000-0000-0000-0000-000000000001",
      _role: "admin",
    };
    expect(args._role).toBe("admin");
  });
});
