import { describe, it, expect, vi, beforeEach } from "vitest";

import { onRequestPost } from "../../functions/api/begin-edu-attempt";
import { __test__ as security__test__ } from "../../functions/_lib/security";
import { verifyEduAttemptToken } from "../../functions/_lib/jwt";

const env = {
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_stub",
  EDU_JWT_SECRET: "test-secret",
};

interface ServerState {
  setExists: boolean;
  setEdu: boolean;
  duplicate: boolean;
}

function buildRequest(body: unknown, ip = "203.0.113.10") {
  return new Request("https://subenai.sk/api/begin-edu-attempt", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function mockSupabase(state: ServerState) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/rest/v1/test_sets")) {
      if (!state.setExists) {
        return new Response(JSON.stringify(null), { status: 200 });
      }
      return new Response(JSON.stringify({ id: "set-1", collects_responses: state.setEdu }), {
        status: 200,
      });
    }
    if (url.includes("/rest/v1/attempts")) {
      if (state.duplicate) {
        return new Response(JSON.stringify({ id: "att-1" }), { status: 200 });
      }
      return new Response(JSON.stringify(null), { status: 200 });
    }
    return new Response("not stubbed", { status: 500 });
  });
}

const validBody = {
  set_id: "set-1",
  name: "Jana Nováková",
  email: "Jana@Skola.SK",
  consent: true,
  hp_url: "",
};

beforeEach(() => {
  security__test__.resetAll();
  vi.restoreAllMocks();
});

describe("POST /api/begin-edu-attempt", () => {
  it("happy path issues a verifiable JWT with email lowercased", async () => {
    mockSupabase({ setExists: true, setEdu: true, duplicate: false });
    const r = await onRequestPost({ request: buildRequest(validBody), env });
    expect(r.status).toBe(200);
    const body = await r.json();
    const verify = await verifyEduAttemptToken(body.token, env.EDU_JWT_SECRET);
    expect(verify.ok).toBe(true);
    if (verify.ok) {
      expect(verify.claims.set_id).toBe("set-1");
      expect(verify.claims.name).toBe("Jana Nováková");
      expect(verify.claims.email).toBe("jana@skola.sk");
    }
  });

  it("400 spam_detected when honeypot is non-empty", async () => {
    mockSupabase({ setExists: true, setEdu: true, duplicate: false });
    const r = await onRequestPost({
      request: buildRequest({ ...validBody, hp_url: "http://spam.example/" }),
      env,
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("spam_detected");
  });

  it("400 invalid_email on bad format", async () => {
    mockSupabase({ setExists: true, setEdu: true, duplicate: false });
    const r = await onRequestPost({
      request: buildRequest({ ...validBody, email: "not-an-email" }),
      env,
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("invalid_email");
  });

  it("400 name_length when name <2 or >80", async () => {
    mockSupabase({ setExists: true, setEdu: true, duplicate: false });
    const r1 = await onRequestPost({
      request: buildRequest({ ...validBody, name: "X" }),
      env,
    });
    expect(r1.status).toBe(400);
    expect((await r1.json()).error).toBe("name_length");

    const r2 = await onRequestPost({
      request: buildRequest({ ...validBody, name: "x".repeat(81) }),
      env,
    });
    expect(r2.status).toBe(400);
    expect((await r2.json()).error).toBe("name_length");
  });

  it("400 invalid_shape when consent is missing/false", async () => {
    mockSupabase({ setExists: true, setEdu: true, duplicate: false });
    const r = await onRequestPost({
      request: buildRequest({ ...validBody, consent: false }),
      env,
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("invalid_shape");
  });

  it("404 set_not_found when test_set missing", async () => {
    mockSupabase({ setExists: false, setEdu: false, duplicate: false });
    const r = await onRequestPost({ request: buildRequest(validBody), env });
    expect(r.status).toBe(404);
    expect((await r.json()).error).toBe("set_not_found");
  });

  it("400 not_edu_set when collects_responses=false", async () => {
    mockSupabase({ setExists: true, setEdu: false, duplicate: false });
    const r = await onRequestPost({ request: buildRequest(validBody), env });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toBe("not_edu_set");
  });

  it("409 already_attempted on duplicate (set_id, email)", async () => {
    mockSupabase({ setExists: true, setEdu: true, duplicate: true });
    const r = await onRequestPost({ request: buildRequest(validBody), env });
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe("already_attempted");
  });

  it("429 rate_limited after 4th attempt from same IP within 5 min", async () => {
    mockSupabase({ setExists: true, setEdu: true, duplicate: false });
    for (let i = 0; i < 3; i++) {
      const r = await onRequestPost({
        request: buildRequest({ ...validBody, email: `r${i}@x.sk` }, "198.51.100.10"),
        env,
      });
      expect(r.status).toBe(200);
    }
    const blocked = await onRequestPost({
      request: buildRequest({ ...validBody, email: "r3@x.sk" }, "198.51.100.10"),
      env,
    });
    expect(blocked.status).toBe(429);
  });

  it("500 jwt_not_configured when secret missing", async () => {
    const r = await onRequestPost({
      request: buildRequest(validBody),
      env: { ...env, EDU_JWT_SECRET: "" },
    });
    expect(r.status).toBe(500);
    expect((await r.json()).error).toBe("jwt_not_configured");
  });
});
