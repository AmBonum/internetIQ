import { describe, it, expect, expectTypeOf } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Database } from "@/integrations/supabase/types";

type TestSetRow = Database["public"]["Tables"]["test_sets"]["Row"];
type TestSetInsert = Database["public"]["Tables"]["test_sets"]["Insert"];
type AttemptRow = Database["public"]["Tables"]["attempts"]["Row"];

const DEPLOY_SQL = readFileSync(resolve(__dirname, "../../DEPLOY_SETUP.sql"), "utf8");
const MIGRATION_SQL = readFileSync(
  resolve(__dirname, "../../supabase/migrations/20260428000000_test_sets.sql"),
  "utf8",
);

describe("E8.1 — test_sets schema", () => {
  it("Insert type accepts the minimum required fields", () => {
    const insert: TestSetInsert = {
      question_ids: ["q-phish-001", "q-url-005"],
      max_questions: 2,
    };
    expect(insert.question_ids).toHaveLength(2);
  });

  it("Row type carries forward-compat E12 columns (author_password_hash + collects_responses)", () => {
    expectTypeOf<TestSetRow["author_password_hash"]>().toEqualTypeOf<string | null>();
    expectTypeOf<TestSetRow["collects_responses"]>().toEqualTypeOf<boolean>();
  });

  it("attempts row has nullable test_set_id linked to test_sets", () => {
    expectTypeOf<AttemptRow["test_set_id"]>().toEqualTypeOf<string | null>();
  });

  it("DEPLOY_SETUP and migration both create the table with the same constraints", () => {
    const expectedConstraints = [
      "test_sets_size_chk",
      "test_sets_threshold_chk",
      "test_sets_max_consistent",
      "test_sets_label_len",
      "test_sets_question_id_len",
      "test_sets_pwd_required_when_collecting",
    ];
    for (const name of expectedConstraints) {
      expect(DEPLOY_SQL).toContain(name);
      expect(MIGRATION_SQL).toContain(name);
    }
  });

  it("RLS is enabled with anon SELECT + INSERT but no UPDATE/DELETE", () => {
    for (const sql of [DEPLOY_SQL, MIGRATION_SQL]) {
      expect(sql).toMatch(/ALTER TABLE public\.test_sets ENABLE ROW LEVEL SECURITY/);
      expect(sql).toMatch(/CREATE POLICY test_sets_anon_select[\s\S]+FOR SELECT[\s\S]+TO anon/);
      expect(sql).toMatch(/CREATE POLICY test_sets_anon_insert[\s\S]+FOR INSERT[\s\S]+TO anon/);
      // Negative: no anon UPDATE / DELETE policy.
      expect(sql).not.toMatch(/CREATE POLICY[^\n]+test_sets[^\n]+FOR UPDATE/);
      expect(sql).not.toMatch(/CREATE POLICY[^\n]+test_sets[^\n]+FOR DELETE/);
    }
  });

  it("attempts.test_set_id is added with ON DELETE SET NULL", () => {
    for (const sql of [DEPLOY_SQL, MIGRATION_SQL]) {
      expect(sql).toMatch(
        /ADD COLUMN IF NOT EXISTS test_set_id UUID[\s\S]+REFERENCES public\.test_sets\(id\) ON DELETE SET NULL/,
      );
    }
  });

  it("forbid_attempt_score_changes trigger now also locks test_set_id", () => {
    for (const sql of [DEPLOY_SQL, MIGRATION_SQL]) {
      // Find the latest CREATE OR REPLACE for the trigger fn and assert it
      // checks test_set_id immutability.
      const fnMatches = sql.match(
        /CREATE OR REPLACE FUNCTION public\.forbid_attempt_score_changes[\s\S]+?\$\$;/g,
      );
      expect(fnMatches).toBeTruthy();
      const last = fnMatches![fnMatches!.length - 1];
      expect(last).toContain("NEW.test_set_id IS DISTINCT FROM OLD.test_set_id");
    }
  });

  it("purge_unused_test_sets retention is 12 months", () => {
    for (const sql of [DEPLOY_SQL, MIGRATION_SQL]) {
      expect(sql).toMatch(/DELETE FROM public\.test_sets[\s\S]+now\(\) - interval '12 months'/);
    }
  });
});
