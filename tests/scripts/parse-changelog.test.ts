import { describe, it, expect } from "vitest";

import { parseChangelog } from "../../scripts/parse-changelog.mjs";

const SAMPLE = `# Changelog

## [Unreleased]

## [1.5.0] — 2026-04-27
### Added
- /podpora donate page (E11.1)
- /sponzori list (E11.3)
### Changed
- Footer adds donate link
### Fixed
- TestFlow stale result on fresh navigation

## [1.4.0] — 2026-04-26
### Added
- E10 sponsorship infrastructure
`;

describe("parseChangelog", () => {
  it("skips [Unreleased] and returns ordered released versions", () => {
    const versions = parseChangelog(SAMPLE);
    expect(versions.map((v) => v.version)).toEqual(["1.5.0", "1.4.0"]);
  });

  it("captures bullets per section", () => {
    const versions = parseChangelog(SAMPLE);
    const v15 = versions[0];
    expect(v15.added).toEqual(["/podpora donate page (E11.1)", "/sponzori list (E11.3)"]);
    expect(v15.changed).toEqual(["Footer adds donate link"]);
    expect(v15.fixed).toEqual(["TestFlow stale result on fresh navigation"]);
    expect(v15.removed).toEqual([]);
  });

  it("preserves dates as ISO strings", () => {
    const versions = parseChangelog(SAMPLE);
    expect(versions[0].date).toBe("2026-04-27");
    expect(versions[1].date).toBe("2026-04-26");
  });

  it("throws when a released version is missing a date", () => {
    const malformed = `## [1.0.0]\n### Added\n- something\n`;
    expect(() => parseChangelog(malformed)).toThrow(/no date/i);
  });

  it("ignores non-section content between version blocks", () => {
    const noisy = `## [1.0.0] — 2026-01-01\nSome prose here.\n### Added\n- thing\n\nMore prose.\n`;
    const versions = parseChangelog(noisy);
    expect(versions[0].added).toEqual(["thing"]);
  });

  it("supports both em-dash and hyphen as date separator", () => {
    const md = `## [2.0.0] - 2026-05-01\n### Added\n- foo\n## [1.9.0] – 2026-04-30\n### Added\n- bar\n## [1.8.0] — 2026-04-29\n### Added\n- baz\n`;
    const versions = parseChangelog(md);
    expect(versions.map((v) => v.version)).toEqual(["2.0.0", "1.9.0", "1.8.0"]);
  });

  it("recognises Slovak section names (Pridané/Zmenené/Opravené/Odstránené)", () => {
    const md = `## [1.0.0] — 2026-04-10\n### Pridané\n- A\n### Zmenené\n- B\n### Opravené\n- C\n### Odstránené\n- D\n`;
    const versions = parseChangelog(md);
    expect(versions[0].added).toEqual(["A"]);
    expect(versions[0].changed).toEqual(["B"]);
    expect(versions[0].fixed).toEqual(["C"]);
    expect(versions[0].removed).toEqual(["D"]);
  });
});
