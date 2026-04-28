import { describe, it, expect, vi, beforeEach } from "vitest";

import { onRequestPost } from "../../functions/api/test-sets";
import { __test__ as security__test__ } from "../../functions/_lib/security";
import { QUESTIONS } from "@/lib/quiz/questions";

const realIds = QUESTIONS.slice(0, 6).map((q) => q.id);

const env = {
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service_role_stub",
};

function buildRequest(body: unknown, ip = "203.0.113.1") {
  return new Request("https://subenai.sk/api/test-sets", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function mockSupabaseInsert(returnedId = "set_abc123", error: string | null = null) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    if (url.includes("/rest/v1/test_sets")) {
      if (error) {
        return new Response(JSON.stringify({ message: error }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ id: returnedId }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not stubbed", { status: 500 });
  });
}

beforeEach(() => {
  security__test__.resetAll();
  vi.restoreAllMocks();
});

describe("POST /api/test-sets — happy path", () => {
  it("inserts a valid composer set and returns id + url", async () => {
    mockSupabaseInsert("set_xyz789");
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: realIds,
        passing_threshold: 70,
        max_questions: realIds.length,
        creator_label: "E-shop Q1 2026",
      }),
      env,
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ id: "set_xyz789", url: "/test/zostava/set_xyz789" });
  });

  it("accepts source_pack_slugs without validating them against pack registry", async () => {
    mockSupabaseInsert("set_abc");
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: realIds,
        passing_threshold: 70,
        max_questions: realIds.length,
        source_pack_slugs: ["eshop", "removed-pack-name"],
      }),
      env,
    });
    expect(response.status).toBe(200);
  });
});

describe("POST /api/test-sets — validation rejects", () => {
  it("400 invalid_json on malformed body", async () => {
    const response = await onRequestPost({
      request: buildRequest("{not-json"),
      env,
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_json" });
  });

  it("400 invalid_shape when fields wrong type", async () => {
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: "not array",
        passing_threshold: "70",
        max_questions: 5,
      }),
      env,
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_shape");
  });

  it("400 too_few_questions for <5 ids", async () => {
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: realIds.slice(0, 3),
        passing_threshold: 70,
        max_questions: 3,
      }),
      env,
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("too_few_questions");
  });

  it("400 unknown_question_id with detail", async () => {
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: [...realIds.slice(0, 5), "q-vanished"],
        passing_threshold: 70,
        max_questions: 6,
      }),
      env,
    });
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("unknown_question_id");
    expect(body.detail).toBe("q-vanished");
  });

  it("400 threshold_out_of_range when passing_threshold < 50", async () => {
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: realIds,
        passing_threshold: 30,
        max_questions: realIds.length,
      }),
      env,
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("threshold_out_of_range");
  });

  it("400 max_questions_mismatch", async () => {
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: realIds,
        passing_threshold: 70,
        max_questions: 99,
      }),
      env,
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("max_questions_mismatch");
  });
});

describe("POST /api/test-sets — rate limiting (5/min/IP)", () => {
  it("returns 429 after the 6th request from the same IP", async () => {
    mockSupabaseInsert("set_ratelimit");
    const validBody = {
      question_ids: realIds,
      passing_threshold: 70,
      max_questions: realIds.length,
    };

    for (let i = 0; i < 5; i++) {
      const r = await onRequestPost({
        request: buildRequest(validBody, "198.51.100.5"),
        env,
      });
      expect(r.status).toBe(200);
    }

    const blocked = await onRequestPost({
      request: buildRequest(validBody, "198.51.100.5"),
      env,
    });
    expect(blocked.status).toBe(429);
    expect((await blocked.json()).error).toBe("rate_limited");
  });

  it("does NOT rate-limit a different IP within the same window", async () => {
    mockSupabaseInsert("set_x");
    const validBody = {
      question_ids: realIds,
      passing_threshold: 70,
      max_questions: realIds.length,
    };
    for (let i = 0; i < 5; i++) {
      await onRequestPost({ request: buildRequest(validBody, "198.51.100.6"), env });
    }
    const otherIp = await onRequestPost({
      request: buildRequest(validBody, "198.51.100.7"),
      env,
    });
    expect(otherIp.status).toBe(200);
  });
});

describe("POST /api/test-sets — supabase failures", () => {
  it("500 supabase_not_configured if env vars missing", async () => {
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: realIds,
        passing_threshold: 70,
        max_questions: realIds.length,
      }),
      env: { SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" },
    });
    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe("supabase_not_configured");
  });

  it("500 insert_failed when Supabase returns error", async () => {
    mockSupabaseInsert("set_x", "constraint_violation");
    const response = await onRequestPost({
      request: buildRequest({
        question_ids: realIds,
        passing_threshold: 70,
        max_questions: realIds.length,
      }),
      env,
    });
    expect(response.status).toBe(500);
    expect((await response.json()).error).toBe("insert_failed");
  });
});
