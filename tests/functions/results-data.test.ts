import { describe, it, expect, vi, beforeEach } from "vitest";

import { onRequestPost, __test__ } from "../../functions/api/results-data";
import { signEduAuthorToken } from "../../functions/_lib/jwt";

const env = {
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_stub",
  JWT_SECRET: "test-secret",
};

interface ServerState {
  setRow?: {
    id: string;
    creator_label: string | null;
    passing_threshold: number;
    question_ids: string[];
    collects_responses: boolean;
  } | null;
  attempts?: Array<Record<string, unknown>>;
}

function buildRequest(body: unknown, cookie?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers.cookie = `subenai_edu_author=${cookie}`;
  return new Request("https://subenai.sk/api/results-data", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function mockSupabase(state: ServerState) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/rest/v1/test_sets")) {
      return new Response(JSON.stringify(state.setRow ?? null), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/rest/v1/attempts")) {
      return new Response(JSON.stringify(state.attempts ?? []), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not stubbed", { status: 500 });
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("computeAggregate (E12.4 helper)", () => {
  it("returns zeroed stats when no scores", () => {
    const r = __test__.computeAggregate([], 70);
    expect(r).toMatchObject({ count: 0, avg_score: 0, pass_count: 0, histogram: [0, 0, 0, 0] });
  });

  it("counts pass_rate, distribution buckets, and median correctly", () => {
    const r = __test__.computeAggregate([10, 30, 70, 80, 95], 70);
    expect(r.count).toBe(5);
    expect(r.min_score).toBe(10);
    expect(r.max_score).toBe(95);
    expect(r.median_score).toBe(70);
    // Buckets: 0-24 / 25-49 / 50-74 / 75-100. Score 70 lands in "50-74".
    expect(r.histogram).toEqual([1, 1, 1, 2]);
    expect(r.pass_count).toBe(3);
    expect(r.pass_rate).toBe(60);
  });

  it("avg with one decimal precision", () => {
    const r = __test__.computeAggregate([10, 20], 70);
    expect(r.avg_score).toBe(15);
  });
});

describe("readCookie helper", () => {
  it("extracts the named cookie from a Cookie header", () => {
    const req = new Request("https://x.sk/", {
      headers: { cookie: "a=1; subenai_edu_author=tok" },
    });
    expect(__test__.readCookie(req, "subenai_edu_author")).toBe("tok");
  });
  it("returns null when header missing", () => {
    const req = new Request("https://x.sk/");
    expect(__test__.readCookie(req, "subenai_edu_author")).toBeNull();
  });
});

describe("POST /api/results-data — auth + payload", () => {
  it("401 no_session when cookie missing", async () => {
    const r = await onRequestPost({ request: buildRequest({ set_id: "set-1" }), env });
    expect(r.status).toBe(401);
    expect((await r.json()).error).toBe("no_session");
  });

  it("401 token_bad_signature on cookie signed with another secret", async () => {
    const wrongToken = await signEduAuthorToken("set-1", "another-secret");
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-1" }, wrongToken),
      env,
    });
    expect(r.status).toBe(401);
    expect((await r.json()).error).toBe("token_bad_signature");
  });

  it("403 set_mismatch when body set_id != cookie set_id", async () => {
    const cookieToken = await signEduAuthorToken("set-cookie", env.JWT_SECRET);
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-other" }, cookieToken),
      env,
    });
    expect(r.status).toBe(403);
    expect((await r.json()).error).toBe("set_mismatch");
  });

  it("returns aggregate stats and rows ordered by created_at desc", async () => {
    mockSupabase({
      setRow: {
        id: "set-1",
        creator_label: "Trieda 9.A",
        passing_threshold: 70,
        question_ids: ["q1", "q2", "q3", "q4", "q5"],
        collects_responses: true,
      },
      attempts: [
        {
          id: "a1",
          share_id: "AAAAAAAA",
          respondent_name: "Jana",
          respondent_email: "jana@x.sk",
          final_score: 90,
          percentile: 90,
          total_time_ms: 12000,
          created_at: "2026-05-02T08:00:00.000Z",
        },
        {
          id: "a2",
          share_id: "BBBBBBBB",
          respondent_name: "Peter",
          respondent_email: "peter@x.sk",
          final_score: 50,
          percentile: 30,
          total_time_ms: 9000,
          created_at: "2026-05-01T08:00:00.000Z",
        },
      ],
    });
    const cookieToken = await signEduAuthorToken("set-1", env.JWT_SECRET);
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-1" }, cookieToken),
      env,
    });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.set_id).toBe("set-1");
    expect(body.creator_label).toBe("Trieda 9.A");
    expect(body.question_count).toBe(5);
    expect(body.rows).toHaveLength(2);
    expect(body.stats.count).toBe(2);
    expect(body.stats.avg_score).toBe(70);
    expect(body.stats.pass_count).toBe(1);
  });

  it("404 set_not_found when test_set missing", async () => {
    mockSupabase({ setRow: null });
    const cookieToken = await signEduAuthorToken("set-1", env.JWT_SECRET);
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-1" }, cookieToken),
      env,
    });
    expect(r.status).toBe(404);
    expect((await r.json()).error).toBe("set_not_found");
  });
});
