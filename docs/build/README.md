# Build plan, review and commitment process

Status: process adopted 2026-09-14 for the v0.01 build and the V1 slices that follow. This document
owns *how* work is assigned, reviewed and committed. The specifications under `docs/` own *what* is
built. `docs/development-process.md` records the earlier principles this process implements; where the
two differ, this document is current and that one is historical.

Read `CLAUDE.md` and `agent.MD` before anything else. Then read this file, then your slice document.

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
3. **Plan.** Add a short plan to the slice document's *Work log* section: files to touch, tests to add,
   which dependencies are real and which are stubbed with a clearly named development fixture.
4. **Implement** in a worktree branch named `slice/<id>` (for example `slice/A05`). Keep game rules out
   of UI components. Every table control goes through a registered shared operation.
5. **Verify.** Run the slice's acceptance checks and `pnpm check`. Read persisted state back through
   the application; a mutation response is not evidence. Record commands and output in the work log.
6. **Spec update.** If implementation revealed a gap or a routine engineering choice, record it in the
   owning spec as a dated *Implementation note*. If it needs the user, append a question to
   `docs/rules-questions-for-user.md` and continue on work that does not depend on it.
7. **Independent review.** Request a reviewer. Verdicts: `pass`, `changes required`, `decision
   required`. Address findings; re-review after substantive changes. The implementer never
   self-attests.
8. **Rules review** when the slice document requires it, after independent review passes.
9. **Commit** using the format below, one logical change per commit, fast-forward or rebase onto `main`.
   The lead merges; the implementer does not push to `main` directly.
10. **Hand back.** Set `STATUS.md` to `Committed` with the commit hashes, and write the closing entry in
    the slice work log: what works, what was tested, what remains.

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

The pre-alpha policy of one current playable version stands. Slice branches exist only to isolate
concurrent teams; they are short-lived, rebased onto `main` before merge, merged fast-forward by the
lead after review, and deleted. No long-running feature branches, no release branches, no automatic
deployment. Development data remains disposable; reset and reseed rather than migrate.

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
servers running. Every `A` slice adds tests at the shared-operation level (convex-test) before UI
tests. The commit checker runs in the `commit-msg` hook and in CI (`.github/workflows/check.yml`),
not inside `pnpm check`, so a clean checkout of any commit passes `pnpm check` regardless of its
history. `pnpm format` applies Prettier (print width 100).

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
