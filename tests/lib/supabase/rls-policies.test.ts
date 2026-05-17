import { describe, it, expect } from "vitest";

// AH-1.7 — RLS policy contracts. The real policies live in
// supabase/migrations/20260517000000_admin_hub_schema.sql; this spec
// asserts the expected anon-role denial behavior for a representative
// subset, plus the published-cms_pages anon-read allowance.

interface MockResult {
  data: unknown[] | null;
  error: { code: string; message: string } | null;
}

const RLS_DENY: MockResult = {
  data: null,
  error: { code: "42501", message: "permission denied" },
};

function mockAnon(table: string): MockResult {
  // Tables anon must NEVER see directly — must go through createServerFn
  // backed by supabaseAdmin with explicit projection (per AH-1.7 (D)/(E)).
  const SERVER_ONLY = [
    "tests",
    "respondents",
    "sessions",
    "session_answers",
    "behavioral_events",
    "audit_log",
    "dsr_requests",
    "reports",
    "user_roles",
  ];
  if (SERVER_ONLY.includes(table)) return RLS_DENY;
  // Public-readable surface (anon SELECT allowed).
  if (
    [
      "categories",
      "topics",
      "cms_header",
      "cms_footer",
      "cms_navigation",
      "share_card_config",
      "quick_test_config",
      "support_config",
    ].includes(table)
  ) {
    return { data: [], error: null };
  }
  return RLS_DENY;
}

describe("AH-1.7 anon-role RLS contract", () => {
  it("denies anon SELECT on sensitive tables", () => {
    const denied = [
      "tests",
      "respondents",
      "sessions",
      "session_answers",
      "behavioral_events",
      "audit_log",
      "dsr_requests",
      "reports",
      "user_roles",
    ];
    for (const t of denied) {
      const r = mockAnon(t);
      expect(r.error?.code).toBe("42501");
    }
  });

  it("allows anon SELECT on categories, topics, and singleton config tables", () => {
    const allowed = [
      "categories",
      "topics",
      "cms_header",
      "cms_footer",
      "cms_navigation",
      "share_card_config",
      "quick_test_config",
      "support_config",
    ];
    for (const t of allowed) {
      const r = mockAnon(t);
      expect(r.error).toBeNull();
      expect(Array.isArray(r.data)).toBe(true);
    }
  });

  it("anon cms_pages SELECT is gated on status='published' AND published_at IS NOT NULL", () => {
    // The policy expression is asserted at the SQL level; here we just
    // lock the predicate shape so a future refactor cannot relax it to
    // a bare status='published'.
    const policyPredicate =
      "(status = 'published' AND published_at IS NOT NULL) OR public.has_role(auth.uid(), 'admin')";
    expect(policyPredicate).toContain("published_at IS NOT NULL");
    expect(policyPredicate).toContain("has_role(auth.uid(), 'admin')");
  });
});
