# Internet IQ Test — Project Instructions for Claude Code

## North star
- **Senior-level quality, minimum tokens.** Smallest correct change. No
  speculative scaffolding. No comments that restate code. No trailing
  "summary of what I did" — the diff is the summary.
- **Zero-tolerance lint policy.** `npm run lint` must always end at
  **0 errors / 0 warnings**. If a touched file inherits old prettier
  errors, fix them in the same change — never accept "out of scope on
  pre-existing issues".
- **Verify before claiming done.** Before saying "done" / "fixed" /
  "passing", run the affected suites and paste the result.

## Stack snapshot (read once, don't re-derive)
- TanStack Start + Vite + React 19 + TS strict, file-based router in
  `src/routes/**`. App alias is `@/*` → `src/*`.
- Tailwind v4 (CSS-first config in `src/styles.css`). Design tokens
  live there, not in a `tailwind.config`.
- Supabase (anon, RLS enforced) — single client `@/integrations/supabase/client`.
  Auto-generated types in `src/integrations/supabase/types.ts` — when a
  migration changes schema, **manually keep these in sync** in the same
  PR (we don't run `supabase gen` in CI yet).
- Tests: Vitest + RTL + jsdom. Config at `vitest.config.ts` (separate
  from vite.config.ts to avoid pulling Cloudflare/SSR plugins into the
  test runner). Setup at `tests/setup.ts`.
- Cloudflare Pages target — `npm run build` produces an SSR worker
  bundle.

## Loop you must close on every code change
1. Edit.
2. `npm run lint` → 0/0.
3. `npm test` → all green.
4. `npm run build` → ✓.
5. Commit (only when user asks). One logical change per commit.

## Workflow rules
- **Plan-first** for any work spanning 3+ files or touching DB / consent /
  routing. Use `tasks/stories/E*.md` as the single source of truth — don't
  reinvent acceptance criteria in chat.
- **Story DoD**: implementation + tests + docs (privacy / cookies if data
  surface changes) + green CR. See `tasks/README.md` for the full list.
- **Mark stories done in the file + the PLAN index** in the same commit
  that closes them: `~~E1.1 Title~~ ✅` and status column → `✅ Done`.
- **Never bump `CONSENT_VERSION` more than once per epic batch.** It
  re-shows the banner; coordinate with the cross-cutting decision in
  `tasks/PLAN-*.md`.

## Git / deployment workflow (since 2026-04-28)
- **`main` = production**. Every push to `main` auto-deploys to
  `subenai.sk` via Cloudflare Pages. Treat it as immutable except for
  fully-vetted feature merges or critical hotfixes.
- **Feature branches** for all new work. Naming: `feature/E<N>-<short-name>`
  (e.g. `feature/E8-composer`, `feature/E12-edu-mode`). One branch per
  Epic, not per story — multiple stories from the same epic land on
  the same branch as separate commits.
- **Branch from `main`**, push the branch, NEVER push directly to
  `main` for new feature work. CF Pages auto-builds preview deploys for
  feature branches; verify there before merging.
- **Merge into `main` only when the WHOLE epic is at 100 %**: every
  story in scope is `✅ Done`, lint 0/0, all tests green, build ✓,
  privacy/cookies/CHANGELOG updated, fresh-context CR done. Partial
  epics stay on the branch.
- **Squash or merge commit** at the user's discretion when opening a PR;
  the agent does not auto-merge. The agent stops at "branch pushed,
  PR ready to open" and waits.
- **Allowed direct-to-`main` exceptions** (single small commits, with
  user confirmation):
  1. Critical security/privacy hotfix that cannot wait for an epic.
  2. Meta updates (this `CLAUDE.md`, top-level `README.md`,
     `.gitignore`) that should propagate to all open branches.
  3. Trivial typos in Slovak user-facing strings already in production.
  Anything beyond these → branch.
- **DB migrations on a branch are *code only* until merged.** Never run
  the SQL against the production Supabase instance from a feature
  branch — schema is pinned to `main`. The migration applies to prod
  Supabase **only after** the PR is merged and the user runs the SQL
  manually (or `supabase db push` if CLI is wired). The branch's
  preview deploy will fail any feature requiring the new schema until
  then; that is expected.

## Style
- Slovak in user-facing strings, commit messages, story files. English
  in code identifiers, comments (when necessary), and CLAUDE.md.
- No emojis in code or commits unless the user asks. UI emoji that's
  already there stays.
- Default to **no comments**. Only write a comment when the WHY is
  non-obvious (constraint, invariant, workaround for a known bug).
  Never comment WHAT — names already say that.
- Prefer `Edit` over `Write` for existing files. Prefer the dedicated
  tool (Read / Edit / Write / Bash) over inventing a workflow.
- Migrations live at `supabase/migrations/{timestamp}_{name}.sql` and
  must also land in `DEPLOY_SETUP.sql` (the standalone bootstrap file).

## Non-negotiables
- Never `git push` without an explicit ask in the current turn.
- Never use `--no-verify` / `--no-gpg-sign`. If a hook fails, fix the
  cause and create a NEW commit (never amend).
- Never edit `.claude/settings.json` or `.github/**` without asking.
- Never widen RLS policies or change the `forbid_attempt_score_changes`
  trigger to allow score / answer mutation. Demographics-only updates
  are the single permitted UPDATE path.
- Trap-popup (E4) NEVER persists user input to anywhere — not localStorage,
  not Supabase, not analytics. Stays in `useState` and dies with the tab.

## Token-saving conventions
- Don't read files you've already read this turn unless you edited them
  or another tool reported them as changed.
- Don't re-run lint / tests / build "just to be sure" if the previous
  run was on the same file set and nothing has changed since.
- Don't narrate every tool call. One short sentence before a batch of
  related calls; nothing for trivial reads.

## Delegation matrix — when to spawn a subagent

Subagents save tokens when they **parallelize** independent work or
**protect the main context** from large outputs. They **waste** tokens
when the main context already has the file paths, diff scope, and a
short, deterministic edit path — the agent then has to re-discover the
same ground and the result has to be verified anyway.

| Task shape | Dispatch | Rationale |
|---|---|---|
| Story with clear AC + known files (E1.1, E3.1 profile) | **Inline** | Re-discovery cost > inline edit cost. |
| Broad codebase exploration, 3+ unknown locations | **`Explore`** | Parallel grep/read. Returns a digest, not raw files. |
| Architectural design / 3+ files / new component family | **`Plan`** | Returns a step plan; main context picks targets. |
| Fresh-context code review on touched files | **`general-purpose`** with explicit "review only, no edits" prompt | DoD requires fresh context per `tasks/README.md`. |
| Long research (docs, library survey, perf hunt) | **`general-purpose`** background agent | Frees the main thread; result is summarized. |
| One-shot diff to a file with known path | **Inline** | Spawning is more expensive than the edit. |
| 3+ similar independent edits across the codebase | Multiple `general-purpose` agents in parallel (one message, multiple tool blocks) | True parallelism. |
| "Why is this test red?" — root-cause hunt | **`general-purpose`** | Iteration over hypotheses without bloating main context. |
| Renaming a symbol everywhere | **Inline** with a single grep-driven sweep | Predictable; agent overhead not justified. |

**Pre-flight before dispatching any agent**:
1. Verify every file path you're about to mention exists (Read or Bash `ls`).
2. State the boundary explicitly ("review only, no edits" / "research,
   report under 200 words" / "find X, do not modify").
3. Pass enough context that the agent can stand alone — assume zero
   memory of this conversation.

**Anti-patterns** (don't do these):
- Spawning a subagent to write a single-file Edit you can do inline.
- Spawning a "review" agent right after a "writing" agent on the same
  file in the same turn — review without independent verification of
  the diff is theatre.
- Stacking three sequential agents where one parallel batch would do.
