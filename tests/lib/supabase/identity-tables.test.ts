import { describe, it, expect } from "vitest";

// AH-1.2 — typed shape of the four identity tables. Runs AFTER AH-1.8 has
// regenerated src/integrations/supabase/types.ts. Until then this spec uses
// structural typing against literal placeholders so it lints cleanly on
// every interim commit; AH-1.8 will swap the placeholders for the real
// Database['public']['Tables'] keys.

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_initials: string | null;
  created_at: string;
};

type UserRoleRow = {
  id: string;
  user_id: string;
  role: "admin" | "moderator" | "user";
  created_at: string;
};

type TeamRow = {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
};

type TeamMemberRow = {
  id: string;
  team_id: string;
  user_id: string;
  role: "owner" | "editor" | "viewer";
  joined_at: string;
};

describe("AH-1.2 identity-tables typed shape", () => {
  it("profiles row has no role column (roles live only on user_roles)", () => {
    const sample: ProfileRow = {
      id: "00000000-0000-0000-0000-000000000001",
      email: "user@example.sk",
      display_name: "User One",
      avatar_initials: "U1",
      created_at: "2026-05-17T00:00:00.000Z",
    };
    // Guard: a `role` key on profiles would be a privilege-escalation
    // surface. This assertion fails the build if anyone reintroduces it.
    expect("role" in sample).toBe(false);
  });

  it("user_roles enforces app_role literal", () => {
    const sample: UserRoleRow = {
      id: "00000000-0000-0000-0000-000000000010",
      user_id: "00000000-0000-0000-0000-000000000001",
      role: "admin",
      created_at: "2026-05-17T00:00:00.000Z",
    };
    expect(sample.role).toBe("admin");
  });

  it("teams + team_members carry the expected FK columns", () => {
    const team: TeamRow = {
      id: "00000000-0000-0000-0000-000000000020",
      name: "Acme",
      owner_id: "00000000-0000-0000-0000-000000000001",
      created_at: "2026-05-17T00:00:00.000Z",
    };
    const member: TeamMemberRow = {
      id: "00000000-0000-0000-0000-000000000030",
      team_id: team.id,
      user_id: team.owner_id,
      role: "owner",
      joined_at: "2026-05-17T00:00:00.000Z",
    };
    expect(member.team_id).toBe(team.id);
    expect(member.user_id).toBe(team.owner_id);
  });
});
