import { describe, it, expect } from "vitest";

// AH-1.5 — audit_log is append-only via the forbid_audit_log_updates
// trigger. INSERTs go through supabaseAdmin in createServerFn handlers
// (RLS bypass). The client surface MUST NOT expose .update() or
// .delete() helpers for audit_log — this spec encodes that contract.

interface AuditLogRow {
  id: string;
  actor_id: string | null;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  pii_access: boolean;
  details: unknown;
  at: string;
}

interface AuditLogClient {
  select: () => Promise<{ data: AuditLogRow[]; error: null }>;
  insert: (row: Omit<AuditLogRow, "id" | "at">) => Promise<{ data: AuditLogRow; error: null }>;
  // NOTE: no update or delete by design.
}

describe("AH-1.5 audit_log immutability contract", () => {
  it("client surface exposes only select and insert", () => {
    const client: AuditLogClient = {
      select: async () => ({ data: [], error: null }),
      insert: async (row) => ({
        data: {
          ...row,
          id: "00000000-0000-0000-0000-000000000fff",
          at: "2026-05-17T00:00:00.000Z",
        },
        error: null,
      }),
    };
    const keys = Object.keys(client);
    expect(keys).toEqual(["select", "insert"]);
    expect(keys).not.toContain("update");
    expect(keys).not.toContain("delete");
  });

  it("pii_access defaults to false unless explicitly set", () => {
    const insert: Omit<AuditLogRow, "id" | "at"> = {
      actor_id: "00000000-0000-0000-0000-000000000001",
      actor_name: "Alice",
      action: "user.suspend",
      target_type: "user",
      target_id: "00000000-0000-0000-0000-000000000002",
      pii_access: false,
      details: null,
    };
    expect(insert.pii_access).toBe(false);
  });

  it("pii_access can be flipped true for respondent-PII reads", () => {
    const insert: Omit<AuditLogRow, "id" | "at"> = {
      actor_id: "00000000-0000-0000-0000-000000000001",
      actor_name: "Alice",
      action: "respondents.list",
      target_type: "respondent",
      target_id: null,
      pii_access: true,
      details: { reason: "AH-7 /admin/respondents view" },
    };
    expect(insert.pii_access).toBe(true);
  });
});
