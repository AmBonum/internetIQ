// E8.2 — POST /api/test-sets
// Create a Composer test set: validate question IDs against the live
// QUESTIONS bundle, rate-limit per IP, INSERT into Supabase.
//
// Why a CF Pages Function instead of letting the browser INSERT
// directly via the anon key:
//   1. AC-6 requires server-side check that every question_id exists
//      in the current bundle. The browser's word about that is
//      worthless if a malicious client tampers with the request.
//   2. AC-7 requires per-IP rate limiting. We use the same in-memory
//      bucket as `portal-magic-link` (functions/_lib/security.ts).
//
// The CHECK constraints in the migration are the second line of
// defence and would catch e.g. a label longer than 80 chars even if
// this Function were bypassed.

import { createClient } from "@supabase/supabase-js";
import {
  validateComposerConfig,
  COMPOSER_LIMITS,
  type ComposerConfig,
} from "../../src/lib/quiz/composer";
import { ipRateLimit, readClientIp, parsePositiveInt } from "../_lib/security";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  TEST_SETS_PER_IP_PER_MIN?: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

interface CreateBody {
  question_ids?: unknown;
  passing_threshold?: unknown;
  max_questions?: unknown;
  creator_label?: unknown;
  source_pack_slugs?: unknown;
}

interface CreateResponse {
  id?: string;
  url?: string;
  error?: string;
  detail?: string;
}

const DEFAULT_RATE_LIMIT = 5;
const RATE_WINDOW_SECONDS = 60;

function jsonResponse(status: number, body: CreateResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

export async function onRequestPost(ctx: RequestContext): Promise<Response> {
  const { request, env } = ctx;

  const ip = readClientIp(request);
  const limit = parsePositiveInt(env.TEST_SETS_PER_IP_PER_MIN, DEFAULT_RATE_LIMIT);
  if (!ipRateLimit.consume(`test-sets:${ip}`, limit, RATE_WINDOW_SECONDS)) {
    return jsonResponse(429, { error: "rate_limited" });
  }

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }

  if (
    !isStringArray(body.question_ids) ||
    typeof body.passing_threshold !== "number" ||
    typeof body.max_questions !== "number" ||
    (body.creator_label !== undefined &&
      body.creator_label !== null &&
      typeof body.creator_label !== "string") ||
    (body.source_pack_slugs !== undefined &&
      body.source_pack_slugs !== null &&
      !isStringArray(body.source_pack_slugs))
  ) {
    return jsonResponse(400, { error: "invalid_shape" });
  }

  const config: ComposerConfig = {
    questionIds: body.question_ids,
    passingThreshold: body.passing_threshold,
    maxQuestions: body.max_questions,
    creatorLabel: typeof body.creator_label === "string" ? body.creator_label : undefined,
    sourcePackSlugs: isStringArray(body.source_pack_slugs) ? body.source_pack_slugs : undefined,
  };

  const validation = validateComposerConfig(config);
  if (!validation.ok) {
    return jsonResponse(400, { error: validation.reason, detail: validation.detail });
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, { error: "supabase_not_configured" });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("test_sets")
    .insert({
      question_ids: config.questionIds,
      passing_threshold: config.passingThreshold,
      max_questions: config.maxQuestions,
      creator_label: config.creatorLabel ?? null,
      source_pack_slugs: config.sourcePackSlugs ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("test-sets insert", { ip, message: error?.message });
    return jsonResponse(500, { error: "insert_failed" });
  }

  const url = `/test/zostava/${data.id}`;
  return jsonResponse(200, { id: data.id as string, url });
}

export const __test__ = {
  COMPOSER_LIMITS,
  DEFAULT_RATE_LIMIT,
  RATE_WINDOW_SECONDS,
};
