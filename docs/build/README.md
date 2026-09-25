# Build process

Slices are the unit of work. Keep the process small: working, understandable behavior is progress;
approval queues, certificates and status narrative are not. Trimmed on 2026-09-20 at the user's
direction; the previous procedures are archived in
[the instruction archive](../decisions/2026-09-20-instruction-archive.md).

## Slice lifecycle

1. **Register.** Add a row to [`STATUS.md`](STATUS.md) and a slice document from
   [`_template.md`](_template.md): goal, scope, acceptance checks, work log. Ids continue the `V` series.
2. **Build** on `slice/<id>` in your own worktree cut from current `main` (recipe below). Read the
   spec sections you cite; the spec wins over the slice document.
3. **Verify.** Run authoring checks locally (lint, typecheck, the focused test file). Submit one job to
   the user-assigned test coordinator for `pnpm check` and any headless journey, per
   [the testing process](../../testing-process.md).
4. **Review.** One fresh-context reviewer reads the diff against the cited spec sections and Compendium
   passages and replies in Chords with `pass` or the blocking findings. Rules slices also get a short
   written review under `audits/`.
5. **Hand off** the commit to the user-assigned deployment coordinator, who fast-forwards `main`,
   updates the shared dev target and records successful publication, reusing accepted tests without
   a smoke test. Update the `STATUS.md` row to `Merged` after integration.

## Slice document template

Use [`_template.md`](_template.md). Four sections; nothing that repeats the spec or Chords.

## Test value

Every test must catch a concrete, plausible failure and protect an observable behavior or contract.
Expected values come from the pinned Compendium or an independent counterpart build, never from the
code under test. Reject snapshot-style freezes, duplicated scenarios, tests of internal structure and
test-count targets. Choose the cheapest level that catches the failure; browser coverage only for
behavior that needs a browser. Removing a redundant test needs a sentence saying why, not a ledger.

## Programmatic headless completion gate

Every UI capability has a supported CLI/API route through the same shared operations. A feature is
complete when an authenticated headless journey exercises that route and reads the persisted result
back. Engine unit tests, direct database writes and headless Chromium do not count. Record the
command and exit status in the work log.

## Trait-granted ability completion gate

Check every implemented trait or feature against the Compendium for granted actions, including
actions embedded in prose or dependent on choices or play state. Build them in the appropriate UI
list and the shared route, keep the granting trait, and prove availability and persisted effect.

## Engine ability design and playtest evidence

Each ability the engine track builds or changes records, in the slice document: the Compendium path
and section, the expected outcomes derived from it, and the headless scenario that proves the applied
state. Effect text the engine cannot resolve stays verbatim and visibly manual in the log.

## Browser testing moratorium — 2026-09-20

The user clarified on 2026-09-22 that this pause applies specifically to **table testing**.
No table browser or Playwright test runs until [V66](V66-browser-test-harness-repair.md) is
implemented. Verify table behavior headlessly and log would-be table scenarios in the
[browser coverage backlog](browser-coverage-backlog.md). Focused non-table browser tests and
investigations, including live sign-in timing, may proceed through the test coordinator. Browser checks do not
replace persisted CLI/API proof; the [failure audit](audits/2026-09-20-browser-testing-failures.md)
records the original harness failures.

## Verification baseline

`pnpm check` runs lint, engine typecheck and tests, the rules ingest, app typecheck and tests, link,
vendor, content, supporting, foes and compiled-report checks, and the web build. The test coordinator's
run must pass before hand-off. The commit checker runs in the local commit hook and the deployment
coordinator's merge gate, not in `pnpm check`. The manually dispatched GitHub check also checks branch
commits (the tip on main); promotion pushes reuse the accepted gate without starting Actions.
`pnpm format` applies Prettier (print width 100).

## Commit format

```
<type>(<slice>): <imperative summary under 72 chars, lower case, no period>

<What changed and why. Name unresolved or manual behavior.>

Slice: V90
Spec: docs/table-spec.md#confirmed-initiative-setup-and-shared-presentation
Reviewed-By: <reviewer label> (pass, 2026-09-20)
Co-Authored-By: <agent> <email>
```

- `<type>` is one of `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `content`, `rules`.
- `Slice:` names a `STATUS.md` id, or `none`.
- `Spec:` lines name the owning spec sections; required for `feat`, `fix`, `rules` and `content`.
  Anchors must resolve to a heading in the file at that commit.
- `Reviewed-By:` with a `pass` verdict is required on the tip commit of a merged range when any
  commit in the range touches code, not on every commit. `Verified:` and `Rules-Review:` are optional; a rules review that
  happened records its verdict in `Rules-Review:`.
- A commit never modifies `vendor/`, and never adds a rule, formula, threshold or grant that its
  `Spec:` sections and the Compendium do not state.

`scripts/check-commit.ts` enforces this in the `commit-msg` hook and in CI; the integration owner runs
`node scripts/check-commit.ts --merge --range main..slice/<id>` before merging.

## Review standard

Verdicts: `pass`, `changes required` (with the blocking findings, file and line), or
`decision required` (naming the user question, appended to `docs/rules-questions-for-user.md`).
The reviewer reads the cited spec sections and Compendium passages and the diff; expected test
values must trace to the source. The implementer never self-attests.

## Branch and merge policy

`main` is the one integrated, tested playable version. Each active slice has its own worktree and a
short-lived `slice/<id>` branch cut from current `main`; never switch the branch in another thread's
directory. Worktree recipe:

```
git fetch origin
git worktree add .worktrees/<name> -b slice/<id> origin/main
cd .worktrees/<name>
CI=true pnpm install --offline --frozen-lockfile
```

Keep `vendor/*` empty in worktrees. Read the canonical pinned sources in the main checkout through
`scripts/lib/vendor.ts` or pinned Git blobs. Never initialize, copy, or alter the submodules in a
worktree. For a disposable copy without Git metadata, set
`SALIENT_VENDOR_ROOT=/srv/presidium/projects/salient/code/vendor`.

Give each worktree its own `node_modules` (the offline install hard-links from the local store in
about a second). Do not symlink it to the main checkout's: pnpm run in the worktree relinks the
shared tree through the worktree path, and removing that worktree leaves main's packages dangling
(2026-09-24).

Backend or schema changes verify against an isolated development backend, never the user's shared
app. Development data is disposable; do not reset another track's environment.

### Merge completion includes the playable app

A merge is: fast-forward `main`, update the shared dev target's affected backend, content and
frontend, record successful publication, and send one Chords message with the commit.
Do not rerun accepted tests or add a smoke/live gate during promotion; see [the testing process](../../testing-process.md).
Documentation-only changes need no runtime update. The user-assigned deployment coordinator's
promotion of merged main to cloud dev and GitHub has standing authorization; other external
publication needs an explicit user instruction in the current conversation.

## Questions for the user

Append rules or product questions to `docs/rules-questions-for-user.md` with the Compendium paths read, the alternatives and a
recommendation; set the slice to `Blocked (Q-id)` only if nothing else can proceed.
