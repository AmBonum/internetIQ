import { describe, it, expect, vi, beforeEach } from "vitest";

import { onRequestPost } from "../../functions/api/finish-edu-attempt";
import { __test__ as security__test__ } from "../../functions/_lib/security";
import { signEduAttemptToken } from "../../functions/_lib/jwt";

const env = {
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_stub",
  EDU_JWT_SECRET: "test-secret",
};

interface InsertCapture {
  body?: Record<string, unknown> | Array<Record<string, unknown>>;
}

function buildRequest(body: unknown, ip = "203.0.113.20") {
  return new Request("https://subenai.sk/api/finish-edu-attempt", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function mockSupabase(returnedAttempt: { id: string; share_id: string }, capture?: InsertCapture) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/rest/v1/attempts")) {
      if (capture) {
        const text = typeof init?.body === "string" ? init.body : "";
        try {
          capture.body = JSON.parse(text);
        } catch {
          /* ignore */
        }
      }
      return new Response(JSON.stringify(returnedAttempt), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not stubbed", { status: 500 });
  });
}

const validResultPayload = {
  share_id: "ABC23456",
  final_score: 80,
  base_score: 80,
  total_penalty: 0,
  percentile: 75,
  personality: "internet_ninja",
  breakdown: { phishing: 90 },
  insights: [],
  stats: { totalTimeMs: 12345 },
  flags: [],
  answers: [],
  total_time_ms: 12345,
};

beforeEach(() => {
  security__test__.resetAll();
  vi.restoreAllMocks();
});

describe("POST /api/finish-edu-attempt", () => {
  async function freshToken(setId = "set-1", email = "jana@skola.sk", name = "Jana") {
    return signEduAttemptToken({ set_id: setId, name, email }, env.EDU_JWT_SECRET);
  }

  it("inserts via service role with respondent_* taken from JWT (not body)", async () => {
    const cap: InsertCapture = {};
    mockSupabase({ id: "att-1", share_id: "ABC23456" }, cap);
    const token = await freshToken();
    const r = await onRequestPost({
      request: buildRequest({
        token,
        ...validResultPayload,
        // Body shouldn't be able to override identity even if it tries:
        respondent_name: "EvilGuy",
        respondent_email: "evil@example.com",
      }),
      env,
    });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.share_id).toBe("ABC23456");

    const row = Array.isArray(cap.body) ? cap.body[0] : cap.body;
    expect(row?.respondent_name).toBe("Jana");
    expect(row?.respondent_email).toBe("jana@skola.sk");
    expect(row?.test_set_id).toBe("set-1");
    // Defensive: spoofed body fields didn't sneak in.
    expect(JSON.stringify(row)).not.toContain("EvilGuy");
    expect(JSON.stringify(row)).not.toContain("evil@example.com");
  });

  it("401 token_bad_signature for token signed with a different secret", async () => {
    mockSupabase({ id: "_", share_id: "_" });
    const wrongToken = await signEduAttemptToken(
      { set_id: "set-1", name: "x", email: "x@x.sk" },
      "different-secret",
    );
    const r = await onRequestPost({
      request: buildRequest({ token: wrongToken, ...validResultPayload }),
      env,
    });
    expect(r.status).toBe(401);
    expect((await r.json()).error).toBe("token_bad_signature");
  });

  it("401 token_expired for past-expiry token", async () => {
    mockSupabase({ id: "_", share_id: "_" });
    const expired = await signEduAttemptToken(
      { set_id: "set-1", name: "x", email: "x@x.sk" },
      env.EDU_JWT_SECRET,
      -1,
    );
    const r = await onRequestPost({
      request: buildRequest({ token: expired, ...validResultPayload }),
      env,
    });
    expect(r.status).toBe(401);
    expect((await r.json()).error).toBe("token_expired");
  });

  it("400 missing_token when token is omitted", async () => {
    const r = await onRequestPost({
      request: buildRequest(validResultPayload),
      env,
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("missing_token");
  });

  it("400 invalid_shape on bad share_id format", async () => {
    const token = await freshToken();
    const r = await onRequestPost({
      request: buildRequest({ token, ...validResultPayload, share_id: "lower-case" }),
      env,
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("invalid_shape");
  });

  it("429 rate_limited after the 7th finish from same IP", async () => {
    mockSupabase({ id: "att-x", share_id: "ABC23456" });
    const token = await freshToken();
    for (let i = 0; i < 6; i++) {
      const r = await onRequestPost({
        request: buildRequest(
          { token, ...validResultPayload, share_id: `ABC2345${i}` },
          "198.51.100.20",
        ),
        env,
      });
      expect(r.status).toBe(200);
    }
    const blocked = await onRequestPost({
      request: buildRequest({ token, ...validResultPayload }, "198.51.100.20"),
      env,
    });
    expect(blocked.status).toBe(429);
  });
});
