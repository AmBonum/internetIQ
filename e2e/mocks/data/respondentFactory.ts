/**
 * Test-data factories for edu mode flows. Every spec that creates a
 * respondent / test set / attempt should call these instead of
 * inlining literal objects — keeps the shape current with
 * `src/integrations/supabase/types.ts` and survives schema drift.
 *
 * Convention: `make<X>(overrides?)` — defaults sensible, overrides win.
 */

let respondentCounter = 0;
let setCounter = 0;

export interface RespondentInput {
  set_id: string;
  name: string;
  email: string;
  consent: true;
  hp_url: ""; // honeypot — must be empty for legit requests
}

/** Build a valid intake-form payload. Pass overrides to test edge cases. */
export function makeRespondent(overrides: Partial<RespondentInput> = {}): RespondentInput {
  respondentCounter += 1;
  return {
    set_id: "00000000-0000-0000-0000-000000000000",
    name: `Jana Test ${respondentCounter}`,
    email: `jana.test.${respondentCounter}@example.sk`,
    consent: true,
    hp_url: "",
    ...overrides,
  };
}

export interface TestSetSeed {
  id: string;
  collects_responses: boolean;
  passing_threshold: number;
  question_ids: string[];
  creator_label: string | null;
}

/** Shape of a test_set row as read by the dashboard. Use as expectation
 *  baseline for `/api/results-data` integration tests. */
export function makeTestSetSeed(overrides: Partial<TestSetSeed> = {}): TestSetSeed {
  setCounter += 1;
  return {
    id: `aaaaaaaa-bbbb-cccc-dddd-${String(setCounter).padStart(12, "0")}`,
    collects_responses: true,
    passing_threshold: 70,
    question_ids: Array.from({ length: 10 }, (_, i) => `q-fixture-${i + 1}`),
    creator_label: `Trieda Test ${setCounter}`,
    ...overrides,
  };
}

/** Reset counters between tests so IDs are deterministic per suite run. */
export function resetFactoryCounters(): void {
  respondentCounter = 0;
  setCounter = 0;
}
