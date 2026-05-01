import { describe, it, expect, vi, beforeEach } from "vitest";

import { onRequestPost } from "../../functions/api/delete-edu-respondent";
import { signEduAuthorToken, signEduAttemptToken } from "../../functions/_lib/jwt";

const env = {
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_stub",
  EDU_JWT_SECRET: "test-secret",
};

const VALID_UUID = "11111111-2222-3333-4444-555555555555";

function buildRequest(body: unknown, cookie?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (cookie) headers.cookie = `subenai_edu_author=${cookie}`;
  return new Request("https://subenai.sk/api/delete-edu-respondent", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

interface DeleteState {
  rowExists: boolean;
}

function mockSupabase(state: DeleteState) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/rest/v1/attempts")) {
      if (!state.rowExists) {
        return new Response(JSON.stringify(null), { status: 200 });
      }
      return new Response(JSON.stringify({ id: VALID_UUID }), {
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

describe("POST /api/delete-edu-respondent", () => {
  it("happy path returns 200 ok", async () => {
    mockSupabase({ rowExists: true });
    const cookieToken = await signEduAuthorToken("set-1", env.EDU_JWT_SECRET);
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-1", attempt_id: VALID_UUID }, cookieToken),
      env,
    });
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.ok).toBe(true);
  });

  it("401 no_session without cookie", async () => {
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-1", attempt_id: VALID_UUID }),
      env,
    });
    expect(r.status).toBe(401);
  });

  it("401 token_wrong_role when cookie carries a respondent (attempt) token", async () => {
    // An attempt-issued JWT (E12.3) must NOT be usable for deleting rows.
    const wrongToken = await signEduAttemptToken(
      { set_id: "set-1", name: "x", email: "x@x.sk" },
      env.EDU_JWT_SECRET,
    );
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-1", attempt_id: VALID_UUID }, wrongToken),
      env,
    });
    expect(r.status).toBe(401);
    expect((await r.json()).error).toBe("token_wrong_role");
  });

  it("403 set_mismatch when body set_id != cookie set_id", async () => {
    const cookieToken = await signEduAuthorToken("set-cookie", env.EDU_JWT_SECRET);
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-other", attempt_id: VALID_UUID }, cookieToken),
      env,
    });
    expect(r.status).toBe(403);
    expect((await r.json()).error).toBe("set_mismatch");
  });

  it("400 invalid_attempt_id on non-UUID input", async () => {
    const cookieToken = await signEduAuthorToken("set-1", env.EDU_JWT_SECRET);
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-1", attempt_id: "not-a-uuid" }, cookieToken),
      env,
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("invalid_attempt_id");
  });

  it("404 attempt_not_found when DELETE matched no rows", async () => {
    mockSupabase({ rowExists: false });
    const cookieToken = await signEduAuthorToken("set-1", env.EDU_JWT_SECRET);
    const r = await onRequestPost({
      request: buildRequest({ set_id: "set-1", attempt_id: VALID_UUID }, cookieToken),
      env,
    });
    expect(r.status).toBe(404);
  });
});
