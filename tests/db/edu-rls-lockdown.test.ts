import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MIGRATION = readFileSync(
  resolve(__dirname, "../../supabase/migrations/20260501010000_edu_anon_insert_lockdown.sql"),
  "utf8",
);
const DEPLOY = readFileSync(resolve(__dirname, "../../DEPLOY_SETUP.sql"), "utf8");

describe("E12.3+E12.7 — anon INSERT lockdown for edu attempts", () => {
  it("drops the old permissive 'Anyone can insert attempts' policy", () => {
    for (const sql of [MIGRATION, DEPLOY]) {
      expect(sql).toMatch(/DROP POLICY IF EXISTS "Anyone can insert attempts"/);
    }
  });

  it("creates a new INSERT policy that refuses rows with respondent_*", () => {
    for (const sql of [MIGRATION, DEPLOY]) {
      expect(sql).toMatch(
        /CREATE POLICY "Anon insert non-edu attempts only"[\s\S]+FOR INSERT[\s\S]+WITH CHECK \(respondent_name IS NULL AND respondent_email IS NULL\)/,
      );
    }
  });

  it("does NOT add an UPDATE/DELETE policy for anon (would let respondents edit their PII)", () => {
    for (const sql of [MIGRATION, DEPLOY]) {
      expect(sql).not.toMatch(
        /CREATE POLICY[^\n]+attempts[^\n]+FOR (UPDATE|DELETE)[^\n]+respondent/,
      );
    }
  });
});
