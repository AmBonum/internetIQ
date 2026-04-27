import { describe, it, expect } from "vitest";
import {
  TEST_PACKS,
  testPackSchema,
  getPackBySlug,
  getPacksByIndustry,
  listPublishedPacks,
  validatePackQuestionIds,
} from "@/content/test-packs";
import { templatePack } from "@/content/test-packs/_template";

describe("test-packs registry", () => {
  it("template pack parses through Zod schema (compile + runtime)", () => {
    expect(() => testPackSchema.parse(templatePack)).not.toThrow();
  });

  it("every registered pack parses through Zod schema", () => {
    for (const p of TEST_PACKS) {
      expect(() => testPackSchema.parse(p)).not.toThrow();
    }
  });

  it("slugs are unique across the registry", () => {
    const seen = new Set<string>();
    for (const p of TEST_PACKS) {
      expect(seen.has(p.slug)).toBe(false);
      seen.add(p.slug);
    }
  });

  it("source URLs are valid http(s)", () => {
    for (const p of [...TEST_PACKS, templatePack]) {
      for (const s of p.sources ?? []) {
        expect(() => new URL(s.url)).not.toThrow();
      }
    }
  });

  it("getPackBySlug returns null for unknown slug", () => {
    expect(getPackBySlug("nonexistent-pack-xyz")).toBeNull();
  });

  it("getPacksByIndustry filter is consistent", () => {
    const eshop = getPacksByIndustry("eshop");
    expect(eshop.every((p) => p.industry === "eshop")).toBe(true);
  });

  it("listPublishedPacks hides slugs starting with underscore", () => {
    expect(listPublishedPacks().some((p) => p.slug.startsWith("_"))).toBe(false);
  });

  it("template pack referenced question IDs all exist in the bank", () => {
    const result = validatePackQuestionIds(templatePack);
    expect(result.ok, result.ok ? "" : `missing: ${result.missing.join(", ")}`).toBe(true);
  });

  it("every REGISTERED pack references only existing question IDs", () => {
    for (const p of TEST_PACKS) {
      const result = validatePackQuestionIds(p);
      expect(result.ok, result.ok ? "" : `${p.slug} missing: ${result.missing.join(", ")}`).toBe(
        true,
      );
    }
  });

  it("validatePackQuestionIds reports missing IDs for an invalid pack", () => {
    const orphan = { ...templatePack, questionIds: [...templatePack.questionIds, "nope-xyz-999"] };
    const result = validatePackQuestionIds(orphan);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.missing).toContain("nope-xyz-999");
    }
  });
});
