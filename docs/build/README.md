# Build plan, review and commitment process

The entire character Opus pilot is [abandoned without reuse](../decisions/2026-09-19-opus-pilot-dead-end.md).
The replacement [Astra character workflow](astra-character-workflow.md) owns character-specific
sequencing under this project's review and merge requirements. Its [fresh-session handoff](character-restart-handoff.md)
records the starting baseline; implementation resumed at the user’s request. See
[the current queue](STATUS.md#astra-delivery-and-verification-queue--2026-09-20).

Status: process adopted 2026-09-14 for the v0.01 build and the V1 slices that follow. This document
owns *how* work is assigned, reviewed and committed. The specifications under `docs/` own *what* is
built. `docs/development-process.md` records the earlier principles this process implements; where the
two differ, this document owns the operational procedure. The confirmed post-v0.01
[five-track roadmap](../v1-roadmap.md) owns workstream boundaries and user-feedback cadence.

Read `CLAUDE.md` and `agent.MD` before anything else. Then read this file, then your slice document.
For new post-v0.01 work, use [the track kickoff](../kickoff-development-track.md).

## Why slices

The build is divided into **slices**: bounded units of work with a single owning document under
`docs/build/`, each small enough for one agent team to finish, verify and hand back in one assignment.
Every slice document lists its spec references, dependencies, deliverables, acceptance checks and its
own open questions. Slices are the unit of assignment, review and commit attribution.

`STATUS.md` in this directory is the single tracker. Update its row when you claim, block, hand off or
complete a slice. Do not create a second tracker.

## Slice families

| Prefix | Family | Owner | Output |
| --- | --- | --- | --- |
| `R` | Rules contracts | Rules team (researcher + reviewer) | Documents: sourced decision tables, formulas, contracts, examples. No application code. |
| `S` | Shared foundation | App lead | Process tooling, content pipeline, data contracts that other app slices depend on. |
| `A` | Application (v0.01) | App teams | Code, tests and spec updates that deliver the v0.01 journey. |
| `V` | V1 features | Mixed, assigned later | Slices that begin once v0.01 acceptance (A09) passes. Their documents are outlines until claimed. |

The dependency graph is in `STATUS.md`. A slice may start when every dependency it lists is
**Committed** in `STATUS.md` or when its document says a dependency is soft and names a fixture path.

## Roles

- **Lead.** Assigns slices, keeps `STATUS.md` current, merges, and resolves cross-slice contract
  disputes. There is one lead per build phase.
- **Implementer.** One agent (with any subagents it wants) working one slice in its own worktree.
- **Independent reviewer.** A fresh-context agent that did not implement the slice. Reads the spec
  sections the slice cites, the diff and the verification evidence, and returns a verdict.
- **Rules researcher.** Establishes source-backed behavior *before* implementation for any slice that
  changes mechanical meaning. Only the pinned Compendium is a source.
- **Rules reviewer.** Fresh-context agent that checks mechanical claims in a diff against the pinned
  Compendium after implementation. Required for every `R` slice and for any `A`/`V` slice whose
  document is marked **Rules review: required**.
- **User.** Makes product decisions and rules rulings. The user is reached only through
  `docs/rules-questions-for-user.md`, never by blocking a build thread with a question.

## Slice lifecycle

1. **Claim.** Set the `STATUS.md` row to `In progress`, add your team label and date.
2. **Read.** Every spec section the slice cites, in the current checkout. If a cited section no longer
   says what the slice document summarizes, the spec wins. Note the discrepancy in the slice's work log.
3. **Plan.** Add a short plan to the slice document's *Work log* section: primary track, worktree/branch,
   development/test target (no secrets), files to touch, checks, affected shared-contract consumers,
   which dependencies are real and which are stubbed with a clearly named development fixture.
4. **Implement** in a worktree branch named `slice/<id>` (for example `slice/A05`). Keep game rules out
   of UI components. Every table control goes through a registered shared operation.
5. **Verify.** Run the slice's acceptance checks and `pnpm check`. Read persisted state back through
   the application; a mutation response is not evidence. Record commands and output in the work log.
   For engine ability work, complete the per-ability design and in-app evidence gate below, even
   when no UI code changed.
6. **Spec update.** If implementation revealed a gap or a routine engineering choice, record it in the
   owning spec as a dated *Implementation note*. If it needs the user, append a question to
   `docs/rules-questions-for-user.md` and continue on work that does not depend on it.
7. **Independent review.** Request a reviewer. Verdicts: `pass`, `changes required`, `decision
   required`. Address findings; re-review after substantive changes. The implementer never
   self-attests.
8. **Rules review** when the slice document requires it, after independent review passes.
9. **Commit and integrate** using the format below, one logical change per commit. The lead verifies
   and fast-forwards `main`, then updates and verifies the shared playable environment under the
   [merge completion directive](#merge-completion-includes-the-playable-app).
10. **Hand back.** Set `STATUS.md` to `Committed` with the commit hashes. Distinguish a branch handoff
    awaiting integration from a completed merge. The closing work log records the running target,
    runtime update and live checks (or a justified no-runtime-impact result), plus anything remaining.

If a slice is blocked on a user answer, set `STATUS.md` to `Blocked (Q-xxx)` and finish every part
of the slice that does not depend on the answer before stopping.

## Commit format

Every commit that implements, changes or removes specified behavior carries trailers that tie it to
the specification. This is how implemented features are referenced against the spec documents.

```
<type>(<slice>): <imperative summary under 72 chars>

<What changed and why, in plain prose. Name unresolved or manual behavior explicitly.>

Slice: A05
Spec: docs/table-spec.md#confirmed-initiative-setup-and-shared-presentation
Spec: docs/table-spec.md#initiative-groups-confirmed-app-model
Spec: docs/pre-alpha-design-gaps.md#combat-opening--confirmed-for-v001
Verified: pnpm check; pnpm test:browser (journey.spec.ts); headless walkthrough steps 1-2
Reviewed-By: <reviewer agent label> (pass, 2026-09-15)
Rules-Review: not required | <reviewer label> (pass, 2026-09-15)
Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
```

Rules:

- `<type>` is one of `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `content`, `rules`.
- `Slice:` is the slice id. Commits outside any slice (typo fixes, dependency bumps) use `Slice: none`.
- `Spec:` lines list every owning spec section the change implements or affects, as a repo-relative
  path plus a heading anchor. At least one is required for `feat`, `fix`, `rules` and `content`. Anchors
  must resolve to a heading in the file at that commit. `S00` delivers `scripts/check-commit.ts`, which
  validates this in the commit hook and CI.
- `Verified:` lists the commands and scenarios actually run. Do not list a command you did not run.
- `Reviewed-By:` is required for every commit merged to `main` except `docs` and `chore` commits that
  touch no code. It names the reviewer label and verdict date.
- `Rules-Review:` is required on every commit; `not required` is an explicit value, not an omission.
- A commit must not modify anything under `vendor/`.
- A commit must not add a rule, formula, threshold or resource grant that the `Spec:` sections do not
  state or that the pinned Compendium does not support. The rules reviewer checks this.

Implementation note (S00, 2026-09-14): `scripts/check-commit.ts` enforces the rules above. The
`commit-msg` hook (installed by `pnpm prepare` through simple-git-hooks) runs it on every commit
without `--merge`: `Reviewed-By:` is then optional, because the hook runs before an independent review
can exist. The lead runs `node scripts/check-commit.ts --merge --range main..slice/<id>` before
merging; with `--merge`, `Reviewed-By:` with a `pass` verdict is required on every commit that touches
code (a path outside `docs/` that is not `*.md`). `Spec:` anchors resolve against the staged tree in
the hook and against each commit's own tree for `--rev`/`--range`. CI runs the checker over the pushed
range. `SKIP_SIMPLE_GIT_HOOKS=1` bypasses the hook for an emergency; do not use it for slice commits.
A slice that requires a rules review commits with `Rules-Review: required (pending)` until the
reviewer's verdict exists; the checker accepts that value without `--merge` and rejects it with it.
The checker also enforces two conventions the example above shows but the prose did not state: the
summary is lower case and does not end with a period, and every non-`docs`/`chore` type needs
`Verified:` even when only documentation paths are touched.

CI history boundary (2026-09-14): `--range` excludes commit
`517ffc4555551f24dc8d4b4a8a2fbacdac0ab4ff` and its ancestors, which predate adoption of this
contract in `d74ecf9`. This preserves the old mockup commits during the first push without rewriting
history. Adoption and every later/nonhistorical commit remain checked, including commits that remove
this document. Hooks and explicit `--rev` checks stay strict; missing boundary history is an error.

Spec documents are updated in the same commit as the code they describe when the update is an
implementation note. Product-decision changes to a spec are separate `docs` commits that cite the
user-questions entry they resolve.

## Review standard

An independent review returns a written verdict containing:

- The spec sections read, by anchor.
- Each acceptance check in the slice document, with `verified`, `not verified` or `failed` and how.
- Findings ranked by severity, each with file and line, and whether it blocks.
- An explicit statement of anything the implementer claimed that the reviewer could not reproduce.

`pass` means every acceptance check verified and no blocking finding. `changes required` lists the
blocking findings. `decision required` names the user question that must be answered first, which
the reviewer appends to `docs/rules-questions-for-user.md` if not already present.

Rules review additionally reads the pinned Compendium passages cited by the slice and confirms each
mechanical claim in the diff and its tests. Expected test values must be derived from the source, not
from the implementation. A rules review that cannot ground a claim in the Compendium returns
`decision required`, never a guess.

## Branch and merge policy

Confirmed post-v0.01 arrangement, 2026-09-15: protect one integrated, tested playable version on `main`.
The five tracks use separate worktrees while active and short-lived `slice/<id>` branches. A track is an
area of ownership, not a permanent branch or a release gate. Integrate completed slices frequently instead
of waiting for track completion. Worktree paths are an engineering choice; record actual paths in slice
work logs, outside the shared main checkout. Do not switch the branch in another active thread's directory.

Before starting an implementation slice:

1. Inspect current branches/worktrees, uncommitted work and `STATUS.md`; coordinate with the lead before
   claiming overlapping files or shared contracts. Preserve all existing changes.
2. Create the slice branch/worktree from current integrated `main`. Reuse a track's worktree only when
   its earlier work is committed/integrated and the directory is clean. Two active slices need separate
   worktrees, including when they belong to the same track.
3. Initialize vendored sources at the repository's recorded pins and install the pinned dependencies.
   Do not copy an active working directory's uncommitted files or advance vendor pins.
4. Establish an isolated development/test environment where required below and record its nonsecret
   target identity. Run the appropriate baseline checks; report existing failures accurately.

The implementer hands back the reviewed slice. The lead rebases it onto current `main`, resolves any
integration conflicts, and verifies the resulting integration. Substantive behavior changes require
renewed applicable review. Run required checks on the integrated result, validate commit trailers, then
fast-forward `main`, complete the playable-app update below, and retire the merged branch. A worktree
may be reused for another slice; remove it only when clean and no active thread uses it. No release
branches or unattended deployment pipeline are introduced.

### Merge completion includes the playable app

**User-confirmed project-wide directive, 2026-09-16:** a request to merge includes Git integration
and bringing the established shared playable development environment up to the merged version.
The integrating lead owns both steps through verification. Routine updates to that established
development target are already authorized by the merge request; do not ask again merely because
Convex calls its code sync a deployment. This supersedes the earlier code-only merge handoff default.

1. **Coordinate and identify the target.** Check Chords updates and the actual checkout/configuration.
   Record the merged commit, serving checkout, frontend URL and backend identity/ports without secrets.
   Confirm this is the shared playable target, not an isolated test backend. Serialize shared runtime
   updates with peer threads; preserve unrelated work and deploy only the reviewed integrated code.
2. **Update the affected running components.** Sync backend functions/schema and required content;
   refresh or rebuild/restart the frontend as needed. Keep frontend, backend and content compatible.
   A file watcher may perform the sync, but verify that it succeeded. A Git merge or passing isolated
   tests alone does not establish that the playable app is current.
3. **Check the actual app.** Verify frontend/backend connectivity and a focused changed-feature journey
   at the shared playable URL. For persistence changes, save and reload/read back the resulting state.
   Check relevant errors and retain compact evidence, including screenshots for visible changes.
   Use disposable verification records without resetting the user's existing campaigns or characters.
4. **Record completion.** In the slice work log and status handoff, record the integrated commit,
   runtime target, update result and live-check evidence. Publish the result through Chords. Report
   the merge complete only when these steps pass. If Git integration succeeded but the runtime update
   failed or is pending, say so explicitly, record the blocker and continue fixing it within scope.

Keep existing play data where compatible. If a breaking development update needs a deliberate reset,
follow the existing disposable-data policy and coordinate its impact before acting; a merge is not a
reason to reset data routinely. Never reset or repoint another track's environment. This directive
covers the established development target; it does not authorize new hosting, external publication,
remote Git pushes or production deployment. Follow actual session authorization for those actions.

For changes with no runtime impact (such as this documentation directive), record why no runtime sync
or live feature check is needed. An explicit user request to merge code only overrides this default;
record that exception and the pending runtime work. Skip runtime updates for unchanged components.
A handoff to another thread does not complete a still-pending runtime update.

### Runtime isolation

Git branches do not isolate Convex deployments, data, frontend servers or test output. A slice that changes
backend functions or schemas uses an isolated development backend for live verification. Pure parser or
evaluator work can use deterministic local tests until live integration requires that backend. UI-only work
may use a compatible coordinated read target, but tests that write/reset data require isolated test data
and must not disturb the user's playable environment.

Keep per-worktree local configuration, server ports and test output directories distinct as needed. Do not
blindly copy ignored deployment credentials/configuration from the main checkout: confirm the actual target
before any sync, seed or reset. Record target identities and commands without secrets. Stop only processes
owned by the slice. Use the applicable backend setup/deployment instructions; this plan does not select a
particular cloud service or authorize production deployment.

Development data remains disposable in the correct target. Reset/reseed may replace prototype migrations,
but a track may not reset or repoint another track's backend or the user's active app. The lead coordinates
updates to the shared playable environment as part of merge completion, including any necessary
coordinated reset/reseed and relevant smoke checks. Git integration and the running-app update remain
separately evidenced steps; both are required by the default merge completion directive above.

## Verification baseline

**Character-track verification, confirmed 2026-09-15:** use
[Forge Steel reference builds checked against the Compendium](character-verification.md) for
targeted wizard, progression and eventual import/export comparisons. This adds independent
character examples to the checks below; it does not replace source review or persisted readback.

`pnpm check` must pass before any review request. Since S00 it runs, in order: `pnpm lint`
(ESLint, then Prettier `--check`), `pnpm check:engine` (engine typecheck and Vitest `engine` project),
`pnpm check:app` (app typecheck and Vitest `app` and `scripts` projects), `pnpm check-links`
(relative links and anchors in `docs/`, `README.md`, `CLAUDE.md`, `agent.MD`), `pnpm check-vendor`
(every `vendor/` submodule at its pinned commit and unmodified), `pnpm content:check` (S01: the generated
content snapshot regenerates byte-for-byte from the clean pin; it replaced `pnpm foes:source`) and
`pnpm build`.
Browser tests (`pnpm test:browser`) are required for slices that change UI flows and need both dev
servers running. For `A` slices, verify shared operations (convex-test) before UI tests; reuse adequate
existing coverage and add tests only when they meet the test value policy. The commit checker runs
in the `commit-msg` hook and in CI (`.github/workflows/check.yml`),
not inside `pnpm check`, so a clean checkout of any commit passes `pnpm check` regardless of its
history. `pnpm format` applies Prettier (print width 100).

## Test value

User requirement, 2026-09-19: every test must justify its existence. Test counts and coverage
percentages are not acceptance targets. A test needs a concrete plausible failure it catches,
an observable behavior or contract it protects, and value beyond existing coverage. Unit tests
are useful when they isolate such a failure; merely reproducing the implementation is not proof.

For each new or changed test, make that purpose clear in its name and assertions. Explain any
non-obvious reason for it in the existing review handoff; no separate justification ledger is
required. Reviewers must challenge the test's value as well as its correctness and remove or
consolidate unjustified cases before acceptance. Existing tests are subject to the same standard
when touched or relied on as evidence; age or a green result does not establish their value.
This is not a prerequisite to audit or rewrite the entire inherited suite before delivering work.

Reject assertions that calculate expected results with the code under test, snapshots or fixtures
that merely freeze current output, duplicated scenarios with no distinct failure mode, and tests
of internal structure unrelated to a supported contract. Expected mechanics come independently
from pinned rules and actual counterpart builds. Prefer a small meaningful table for distinct
mechanical cases and a few real persisted user journeys for integration. Exercise negative cases
where they protect actual constraints or permissions, not to pad a checklist.

Choose the cheapest level that catches the failure. Add browser coverage only when the behavior
needs a browser; do not repeat every mechanical permutation there. Required regression suites
still run, and required failures still block merge. Removing a test requires showing why its
behavior is redundant, obsolete or uninformative; a failing result alone is not that justification.

## Engine ability design and playtest evidence

Confirmed by the user, 2026-09-16: every ability built through the parser/rules-engine track must
have a source-backed design before implementation and a real in-app playtest afterward, with
screenshot proof correlating game-log outputs to that source. This applies across short-lived
slice branches; parser and engine remain one track, without a permanent track branch.

Keep the record inside the owning slice, with linked evidence files. `STATUS.md` remains the slice
tracker. Enumerate every ability added or whose behavior changes, including changes through a
shared handler or source adapter. A shared design can cover common mechanics, but each affected
ability needs its own source mapping, intended support and playtest result. Inventory imported or
compile-only examples separately; they cannot count as built, playable abilities.

### Before building an ability

Record its identity, pinned Compendium revision, exact source path and section/tier, relevant general
rules, and any case-specific product decision. Specify inputs, effect order, calculations, state
changes and expected game-log output. State which clauses are automated, instructions, manual,
unsupported or waiting on facts. Derive expected outcomes from the source before running the code.
Shared mechanics and test fixtures may be referenced instead of copied.

### After building an ability

Play it through the actual rendered app against an isolated development backend. Use real table
controls or the in-app command palette and shared persisted operations. Browser automation is
acceptable; label who or what drove the run. Seeded starting state and deterministic test dice must
be disclosed. A pure resolver test, mocked page, headless-only run or fabricated log is insufficient.

Capture readable screenshots of the actual game-log entry and its expanded source/results. Use
linked captures when the source and outcome cannot fit together. The evidence record must include:

- Ability, tested code revision, content pin, date, nonsecret runtime identity and scenario steps.
- Initial actor/target state, accepted dice and choices/modifiers relevant to the expected result.
- Exact source clause → expected calculation/effect → observed log output, with screenshot links
  and event identity tying the captures to the same run.
- Persisted before/after state read back through the app, plus explicit manual/unsupported work.
  A screenshot of a claimed result alone does not establish that state changed correctly.
- Pass/fail and limitations for each designed case, including the behavior newly claimed by the
  slice. Exercise relevant corrections/history and partial-support displays; retain failed evidence
  and link the rerun that resolves it.

Store evidence durably under `docs/build/evidence/<slice>/` or an accessible artifact location linked
from the slice. Ignored local `.playtest` output alone is not a handoff. Preserve source/privacy
boundaries when taking screenshots; used-action source does not expose an entire private stat block.

### Visibility and completion

Maintain a compact per-ability table in the slice: **designed**, **built**, **in-app playtested**, and
links to source/design and evidence. Mark pending, failed and deferred work explicitly. These are
separate milestones: built without passing app evidence is not complete. Partial support can pass
only for its declared scope, with the remaining clauses visibly manual/unsupported in the log.

Implementation handoff includes this table and the screenshots. Independent review checks the
source-to-output correlation and persisted results for every affected ability; missing or failing
evidence blocks implementation acceptance. Shared unit/integration tests remain reusable and the
usual checks still apply. This is an acceptance requirement, not a per-rule user approval queue or
an assertion that an automated playtest measures human enjoyment. No new CI enforcement is claimed
by recording this workflow.

## Questions for the user

The user is not in the build threads. Two kinds of question go to `docs/rules-questions-for-user.md`:

- **Rules questions.** The pinned Compendium is ambiguous or silent and the ambiguity changes behavior.
  Include the Compendium paths read, the alternatives, and a recommendation. Never a web source, never
  a guess presented as a rule.
- **Product questions.** Two specified behaviors conflict, or a specified behavior is missing a choice
  only the user can make.

Append using the file's template, give the question the next id in its series, set the slice to
`Blocked` only if nothing else in the slice can proceed, and keep building everything that does not
depend on the answer. When the user answers in their standalone thread, the answer is recorded in the
owning spec and the question row is marked resolved with a link.

## Slice document template

`_template.md` in this directory is the required shape. Copy it for any new slice. Keep every
section; write `None` rather than deleting a heading.
