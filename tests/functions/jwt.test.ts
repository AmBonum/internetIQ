import { describe, it, expect } from "vitest";
import { signEduAttemptToken, verifyEduAttemptToken } from "../../functions/_lib/jwt";

const SECRET = "test-secret-do-not-use-in-prod";

describe("HS256 edu attempt JWT", () => {
  it("round-trips claims through sign + verify", async () => {
    const token = await signEduAttemptToken(
      { set_id: "abc-123", name: "Jana Nováková", email: "jana@skola.sk" },
      SECRET,
    );
    const r = await verifyEduAttemptToken(token, SECRET);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.claims.set_id).toBe("abc-123");
      expect(r.claims.name).toBe("Jana Nováková");
      expect(r.claims.email).toBe("jana@skola.sk");
      expect(r.claims.exp).toBeGreaterThan(r.claims.iat);
    }
  });

  it("rejects bad signature when secret differs", async () => {
    const token = await signEduAttemptToken({ set_id: "x", name: "X", email: "x@x.sk" }, SECRET);
    const r = await verifyEduAttemptToken(token, "wrong-secret");
    expect(r).toEqual({ ok: false, reason: "bad_signature" });
  });

  it("rejects malformed token (not 3 parts)", async () => {
    const r = await verifyEduAttemptToken("only.two", SECRET);
    expect(r).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects expired token", async () => {
    // ttl=-1s — already expired by the time verify runs.
    const token = await signEduAttemptToken(
      { set_id: "x", name: "X", email: "x@x.sk" },
      SECRET,
      -1,
    );
    const r = await verifyEduAttemptToken(token, SECRET);
    expect(r).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects tampered payload (signature mismatches)", async () => {
    const token = await signEduAttemptToken({ set_id: "x", name: "X", email: "x@x.sk" }, SECRET);
    const [h, , s] = token.split(".");
    const evilPayload = btoa(
      JSON.stringify({ set_id: "evil", name: "Hacker", email: "h@h.sk", iat: 0, exp: 9e9 }),
    )
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
    const r = await verifyEduAttemptToken(`${h}.${evilPayload}.${s}`, SECRET);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("bad_signature");
  });
});
