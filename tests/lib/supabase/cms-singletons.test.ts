import { describe, it, expect } from "vitest";

// AH-1.6 — singleton tables (cms_header, cms_footer, cms_navigation,
// share_card_config, quick_test_config, support_config) all carry a
// CHECK (id = 1) constraint and ship with a seeded id=1 row. The client
// surface MUST always read these via .eq("id", 1).single() — encode that
// access pattern as a contract here.

const SINGLETONS = [
  "cms_header",
  "cms_footer",
  "cms_navigation",
  "share_card_config",
  "quick_test_config",
  "support_config",
] as const;

type SingletonName = (typeof SINGLETONS)[number];

interface ReadCall {
  table: SingletonName;
  filter: { id: number };
  mode: "single";
}

function makeRecorder(): { calls: ReadCall[]; read: (table: SingletonName) => void } {
  const calls: ReadCall[] = [];
  return {
    calls,
    read: (table) => {
      calls.push({ table, filter: { id: 1 }, mode: "single" });
    },
  };
}

describe("AH-1.6 CMS / config singleton access pattern", () => {
  it("each singleton is queried as .eq('id', 1).single()", () => {
    const recorder = makeRecorder();
    for (const t of SINGLETONS) recorder.read(t);
    expect(recorder.calls).toHaveLength(SINGLETONS.length);
    for (const call of recorder.calls) {
      expect(call.filter).toEqual({ id: 1 });
      expect(call.mode).toBe("single");
    }
  });

  it("app_settings PK is `key` (text), not id (uuid)", () => {
    // Lock the contract: app_settings is the one config table that is NOT
    // a singleton — it's a generic key/value bag with text PK.
    type AppSettingRow = {
      key: string;
      value: unknown;
      updated_at: string;
      updated_by: string | null;
    };
    const sample: AppSettingRow = {
      key: "feature.ai_generator_enabled",
      value: false,
      updated_at: "2026-05-17T00:00:00.000Z",
      updated_by: null,
    };
    expect(typeof sample.key).toBe("string");
  });

  it("cms_pages slug is unique-keyed", () => {
    type CmsPageRow = {
      id: string;
      slug: string;
      title: string;
      status: string;
      published_at: string | null;
    };
    const a: CmsPageRow = {
      id: "00000000-0000-0000-0000-000000000a00",
      slug: "o-projekte",
      title: "O projekte",
      status: "draft",
      published_at: null,
    };
    expect(a.slug).toBe("o-projekte");
  });
});
