// E12.4 — Delete a single respondent attempt from a results dashboard.
//
// Auth: same HttpOnly cookie as /api/results-data. Cookie's JWT carries
// the set the session is bound to, the body's attempt_id must point at
// a row owned by that set. Service-role bypass on RLS makes the DELETE
// possible.

import { createClient } from "@supabase/supabase-js";
import { verifyEduAuthorToken, EDU_AUTHOR_COOKIE_NAME } from "../_lib/jwt";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_SECRET: string;
}

interface RequestContext {
  request: Request;
  env: Env;
}

interface DeleteBody {
  set_id?: unknown;
  attempt_id?: unknown;
}

interface DeleteResponse {
  ok?: true;
  error?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function jsonResponse(status: number, body: DeleteResponse): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export async function onRequestPost(ctx: RequestContext): Promise<Response> {
  const { request, env } = ctx;

  if (!env.JWT_SECRET) return jsonResponse(500, { error: "jwt_not_configured" });
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(500, { error: "supabase_not_configured" });
  }

  const cookie = readCookie(request, EDU_AUTHOR_COOKIE_NAME);
  if (!cookie) return jsonResponse(401, { error: "no_session" });

  const verification = await verifyEduAuthorToken(cookie, env.JWT_SECRET);
  if (!verification.ok) {
    return jsonResponse(401, { error: `token_${verification.reason}` });
  }

  let body: DeleteBody;
  try {
    body = (await request.json()) as DeleteBody;
  } catch {
    return jsonResponse(400, { error: "invalid_json" });
  }
  if (typeof body.set_id !== "string" || typeof body.attempt_id !== "string") {
    return jsonResponse(400, { error: "invalid_shape" });
  }
  if (body.set_id !== verification.claims.set_id) {
    return jsonResponse(403, { error: "set_mismatch" });
  }
  if (!UUID_REGEX.test(body.attempt_id)) {
    return jsonResponse(400, { error: "invalid_attempt_id" });
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Match BOTH id AND test_set_id so a forged attempt_id can't sweep a
  // row from a different set.
  const { data, error } = await supabase
    .from("attempts")
    .delete()
    .eq("id", body.attempt_id)
    .eq("test_set_id", verification.claims.set_id)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("delete-edu-respondent", {
      set_id: verification.claims.set_id,
      attempt_id: body.attempt_id,
      message: error.message,
    });
    return jsonResponse(500, { error: "delete_failed" });
  }
  if (!data) return jsonResponse(404, { error: "attempt_not_found" });
  return jsonResponse(200, { ok: true });
}
