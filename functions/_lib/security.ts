// Security primitives shared across CF Pages Functions.
//
// Layered defence pattern (E11.4 portal magic link):
//   1. Cloudflare Turnstile token validation (siteverify call)
//   2. Per-email cooldown — same address can't spam itself
//   3. Per-IP rate limit — single IP can't enumerate via volume
//   4. Global daily cap — protects Resend quota even if 1+2+3 fail
//
// State is held in module-level Maps inside the Worker isolate. Two implications:
//   - State resets on isolate cold-start (acceptable: limits are soft)
//   - Different isolates have independent state (a busy IP could still slip
//     through if requests load-balance across isolates — acceptable for the
//     amounts of traffic we expect; upgrade to KV when scaling)
//
// Time arithmetic uses Date.now() throughout.

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  hostname?: string;
}

export async function verifyTurnstile(
  secret: string,
  token: string,
  ip?: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!token) return { ok: false, reason: "missing_token" };
  if (!secret) return { ok: false, reason: "missing_secret" };

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  let response: Response;
  try {
    response = await fetch(TURNSTILE_VERIFY_URL, { method: "POST", body: formData });
  } catch {
    return { ok: false, reason: "verify_network_error" };
  }
  if (!response.ok) return { ok: false, reason: `verify_${response.status}` };

  const payload = (await response.json().catch(() => ({}))) as TurnstileResponse;
  if (!payload.success) {
    return { ok: false, reason: (payload["error-codes"] ?? ["invalid_token"]).join(",") };
  }
  return { ok: true };
}

interface CooldownStore {
  consume(key: string, ttlSeconds: number): boolean;
  reset(key: string): void;
}

const cooldownMap = new Map<string, number>();

export const emailCooldown: CooldownStore = {
  consume(key, ttlSeconds) {
    const now = Date.now();
    const expiresAt = cooldownMap.get(key);
    if (expiresAt && expiresAt > now) return false;
    cooldownMap.set(key, now + ttlSeconds * 1000);
    cleanupExpired(cooldownMap, now);
    return true;
  },
  reset(key) {
    cooldownMap.delete(key);
  },
};

interface RateLimitStore {
  consume(key: string, limit: number, windowSeconds: number): boolean;
  reset(key: string): void;
}

interface BucketEntry {
  count: number;
  windowEndsAt: number;
}

const ipBucket = new Map<string, BucketEntry>();

export const ipRateLimit: RateLimitStore = {
  consume(key, limit, windowSeconds) {
    const now = Date.now();
    const entry = ipBucket.get(key);
    if (!entry || entry.windowEndsAt < now) {
      ipBucket.set(key, { count: 1, windowEndsAt: now + windowSeconds * 1000 });
      return true;
    }
    if (entry.count >= limit) return false;
    entry.count += 1;
    return true;
  },
  reset(key) {
    ipBucket.delete(key);
  },
};

const dailyCounter = new Map<string, number>();

export function consumeDailyQuota(scope: string, limit: number): boolean {
  const todayKey = `${scope}:${new Date().toISOString().slice(0, 10)}`;
  const used = dailyCounter.get(todayKey) ?? 0;
  if (used >= limit) return false;
  dailyCounter.set(todayKey, used + 1);
  pruneOldDailyKeys(scope, todayKey);
  return true;
}

function pruneOldDailyKeys(scope: string, todayKey: string) {
  for (const key of dailyCounter.keys()) {
    if (key.startsWith(`${scope}:`) && key !== todayKey) {
      dailyCounter.delete(key);
    }
  }
}

function cleanupExpired(map: Map<string, number>, now: number) {
  if (map.size < 1000) return;
  for (const [k, v] of map) {
    if (v <= now) map.delete(k);
  }
}

export function readClientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Test-only helpers — the Maps are module-level so tests need to reset them
// between cases. Production code never imports these.
export const __test__ = {
  resetAll() {
    cooldownMap.clear();
    ipBucket.clear();
    dailyCounter.clear();
  },
};
