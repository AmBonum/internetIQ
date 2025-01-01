import { describe, it, expect, expectTypeOf } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  HAS_BEEN_SCAMMED_VALUES,
  REFERRAL_SOURCE_VALUES,
  TOP_FEAR_VALUES,
} from "@/lib/quiz/survey-options";
import type { Database } from "@/integrations/supabase/types";

type AttemptInsert = Database["public"]["Tables"]["attempts"]["Insert"];
type AttemptRow = Database["public"]["Tables"]["attempts"]["Row"];

const DEPLOY_SQL = readFileSync(resolve(__dirname, "../../DEPLOY_SETUP.sql"), "utf8");

describe("E2.1 — attempts schema (growth survey fields)", () => {
  it("Insert type accepts every new field as optional / nullable", () => {
    const insert: AttemptInsert = {
      share_id: "ABC12345",
      final_score: 75,
      base_score: 80,
      total_penalty: 5,
      percentile: 70,
      personality: "internet_ninja",
      breakdown: {},
      stats: {},
      total_time_ms: 1000,
      // E2.1 fields — all optional on Insert, schema enforces nullable.
      top_fear: "phishing",
      has_been_scammed: "no",
      referral_source: "tiktok",
      wants_courses: true,
      interests: ["sms", "email"],
      survey_extras_completed: false,
    };
    expect(insert.top_fear).toBe("phishing");
  });

  it("Row type exposes growth-survey columns with the expected nullability", () => {
    expectTypeOf<AttemptRow["top_fear"]>().toEqualTypeOf<string | null>();
    expectTypeOf<AttemptRow["has_been_scammed"]>().toEqualTypeOf<string | null>();
    expectTypeOf<AttemptRow["referral_source"]>().toEqualTypeOf<string | null>();
    expectTypeOf<AttemptRow["wants_courses"]>().toEqualTypeOf<boolean | null>();
    expectTypeOf<AttemptRow["interests"]>().toEqualTypeOf<string[] | null>();
    expectTypeOf<AttemptRow["survey_extras_completed"]>().toEqualTypeOf<boolean>();
  });

  // The CHECK constraint values in DEPLOY_SETUP.sql are the runtime gate;
  // the TS const in survey-options.ts is what the UI renders. If they ever
  // drift, the DB rejects valid-looking UI input. These tests are the trip
  // wire.
  it("DB CHECK constraint for top_fear matches TS TOP_FEAR_VALUES", () => {
    for (const v of TOP_FEAR_VALUES) {
      expect(DEPLOY_SQL).toContain(`'${v}'`);
    }
    // And reject sneaky additions — the CHECK clause is exactly this set.
    const checkBlock = extractCheckList(DEPLOY_SQL, "attempts_top_fear_known");
    expect(checkBlock.sort()).toEqual([...TOP_FEAR_VALUES].sort());
  });

  it("DB CHECK constraint for has_been_scammed matches TS HAS_BEEN_SCAMMED_VALUES", () => {
    const checkBlock = extractCheckList(DEPLOY_SQL, "attempts_has_been_scammed_known");
    expect(checkBlock.sort()).toEqual([...HAS_BEEN_SCAMMED_VALUES].sort());
  });

  it("DB CHECK constraint for referral_source matches TS REFERRAL_SOURCE_VALUES", () => {
    const checkBlock = extractCheckList(DEPLOY_SQL, "attempts_referral_source_known");
    expect(checkBlock.sort()).toEqual([...REFERRAL_SOURCE_VALUES].sort());
  });

  it("DEPLOY_SETUP.sql declares the new columns in CREATE TABLE", () => {
    for (const col of [
      "top_fear TEXT",
      "has_been_scammed TEXT",
      "referral_source TEXT",
      "wants_courses BOOLEAN",
      "interests TEXT[]",
      "survey_extras_completed BOOLEAN NOT NULL DEFAULT false",
    ]) {
      expect(DEPLOY_SQL).toContain(col);
    }
  });
});

function extractCheckList(sql: string, constraintName: string): string[] {
  // Grab the CHECK clause body for the named constraint — we only need the
  // string-quoted values, anchored to the named constraint to avoid
  // collisions with other constraints in the same file.
  const re = new RegExp(
    `CONSTRAINT\\s+${constraintName}\\s+CHECK\\s*\\(([\\s\\S]*?)\\)\\s*[,;]`,
    "i",
  );
  const m = re.exec(sql);
  if (!m) throw new Error(`Constraint ${constraintName} not found in DEPLOY_SETUP.sql`);
  const quoted = m[1].match(/'([^']+)'/g) ?? [];
  return quoted.map((q) => q.slice(1, -1));
}
