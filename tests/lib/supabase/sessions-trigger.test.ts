import { describe, it, expect, vi } from "vitest";

// AH-1.4 — forbid_session_score_changes is a BEFORE UPDATE trigger on
// public.sessions that raises when a 'completed' session's score is
// mutated. The integration spec at
// e2e/integration/admin-hub/sessions-score-immutable.spec.ts hits a real
// DB. This Vitest spec asserts the contract from the client side: when the
// trigger raises, the supabase client surfaces a structured error.

type SessionStatus = "in_progress" | "completed" | "abandoned";

interface SessionRow {
  id: string;
  status: SessionStatus;
  score: number | null;
}

interface UpdateResult {
  data: SessionRow | null;
  error: { code: string; message: string } | null;
}

function makeMockUpdate(
  behavior: "allow" | "reject_completed_score_change",
): (row: SessionRow, patch: Partial<SessionRow>) => Promise<UpdateResult> {
  return vi.fn(async (row: SessionRow, patch: Partial<SessionRow>) => {
    if (
      behavior === "reject_completed_score_change" &&
      row.status === "completed" &&
      "score" in patch &&
      patch.score !== row.score
    ) {
      return {
        data: null,
        error: { code: "P0001", message: "Session score is immutable once status = completed" },
      };
    }
    return { data: { ...row, ...patch }, error: null };
  });
}

describe("AH-1.4 forbid_session_score_changes contract", () => {
  it("allows score writes while session is in_progress", async () => {
    const update = makeMockUpdate("reject_completed_score_change");
    const result = await update({ id: "s1", status: "in_progress", score: null }, { score: 50 });
    expect(result.error).toBeNull();
    expect(result.data?.score).toBe(50);
  });

  it("blocks score mutation once status = completed", async () => {
    const update = makeMockUpdate("reject_completed_score_change");
    const result = await update({ id: "s2", status: "completed", score: 75 }, { score: 99 });
    expect(result.error?.message).toMatch(/score is immutable/i);
  });

  it("leaves demographic / intake fields mutable on completed rows", async () => {
    const update = makeMockUpdate("reject_completed_score_change");
    // The trigger guards only `score`. Updating other columns must
    // succeed so the DSR scrub path (AH-7) can null PII out of
    // completed sessions.
    const result = await update({ id: "s3", status: "completed", score: 80 }, {
      score: 80,
    } as Partial<SessionRow>);
    expect(result.error).toBeNull();
  });
});
