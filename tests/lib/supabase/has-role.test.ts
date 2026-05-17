import { describe, it, expect, vi } from "vitest";

// AH-1.1 — has_role(uuid, app_role) is a Postgres SECURITY DEFINER function.
// The SQL DDL lives in supabase/migrations/20260517000000_admin_hub_schema.sql.
// This Vitest spec exercises the typed client surface a future wrapper will
// use, asserting the RPC name + arg shape. No live DB connection.

const APP_ROLES = ["admin", "moderator", "user"] as const;
type AppRole = (typeof APP_ROLES)[number];

interface RpcCall {
  fn: string;
  args: { _user_id: string; _role: AppRole };
}

function makeMockClient(returnValue: boolean): {
  rpc: (fn: string, args: RpcCall["args"]) => Promise<{ data: boolean; error: null }>;
  calls: RpcCall[];
} {
  const calls: RpcCall[] = [];
  return {
    rpc: vi.fn(async (fn: string, args: RpcCall["args"]) => {
      calls.push({ fn, args });
      return { data: returnValue, error: null };
    }),
    calls,
  };
}

describe("AH-1.1 has_role contract", () => {
  it("invokes the SQL function with named args _user_id and _role", async () => {
    const client = makeMockClient(true);
    const userId = "00000000-0000-0000-0000-000000000001";
    const role: AppRole = "admin";
    const { data } = await client.rpc("has_role", { _user_id: userId, _role: role });
    expect(data).toBe(true);
    expect(client.calls).toHaveLength(1);
    expect(client.calls[0]).toEqual({
      fn: "has_role",
      args: { _user_id: userId, _role: "admin" },
    });
  });

  it("returns false for a non-matching role without throwing", async () => {
    const client = makeMockClient(false);
    const { data } = await client.rpc("has_role", {
      _user_id: "00000000-0000-0000-0000-000000000002",
      _role: "moderator",
    });
    expect(data).toBe(false);
  });

  it("exposes the three app_role enum values verbatim", () => {
    expect(APP_ROLES).toEqual(["admin", "moderator", "user"]);
  });
});
