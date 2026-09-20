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
   TESTER for `pnpm check` and any headless journey, per [the testing process](../../testing-process.md).
4. **Review.** One fresh-context reviewer reads the diff against the cited spec sections and Compendium
   passages and replies in Chords with `pass` or the blocking findings. Rules slices also get a short
   written review under `audits/`.
5. **Hand off** the commit to DEPLOY2. It fast-forwards `main`, updates the shared dev target and
   smoke-checks the changed feature. Update your `STATUS.md` row to `Merged` when it tells you.

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

No browser or Playwright test runs anywhere until [V66](V66-browser-test-harness-repair.md) is
implemented. Verify headlessly; a missing browser run is not a blocker. Log would-be scenarios in the
[browser coverage backlog](browser-coverage-backlog.md). Browser tests are a visual spot check, not
proof of logic; the [failure audit](audits/2026-09-20-browser-testing-failures.md) records why.

## Verification baseline

`pnpm check` runs lint, engine typecheck and tests, the rules ingest, app typecheck and tests, link,
vendor, content, supporting, foes and compiled-report checks, and the web build. TESTER's run of it
must pass before hand-off. The commit checker runs in the commit hook and GitHub Actions, not in
`pnpm check`. `pnpm format` applies Prettier (print width 100).

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
- `Reviewed-By:` with a `pass` verdict is required on the tip commit of a merged range that touches
  code, not on every commit. `Verified:` and `Rules-Review:` are optional; a rules review that
  happened records its verdict in `Rules-Review:`.
- A commit never modifies `vendor/`, and never adds a rule, formula, threshold or grant that its
  `Spec:` sections and the Compendium do not state.

`scripts/check-commit.ts` enforces this in the `commit-msg` hook and in CI; the lead runs
`node scripts/check-commit.ts --merge --range main..slice/<id>` before merging.

## Review standard

Verdicts: `pass`, `changes required` (with the blocking findings, file and line), or
`decision required` (naming the user question, appended to `docs/rules-questions-for-user.md`).
The reviewer reads the cited spec sections and Compendium passages and the diff; expected test
values must trace to the source. The implementer never self-attests.

## Branch and merge policy

`main` is the one integrated, tested playable version. Each active slice has its own worktree and a
short-lived `slice/<id>` branch cut from current `main`; never switch the branch in another thread's
directory. Worktree recipe on Presidium (GitHub is unreachable there):

```
git worktree add .worktrees/<name> -b slice/<id> main
ln -s <main checkout>/node_modules .worktrees/<name>/node_modules
git -c protocol.file.allow=always \
  -c submodule.vendor/steel-compendium.url=<main checkout>/.git/modules/vendor/steel-compendium \
  submodule update --init vendor/steel-compendium
cp -a <main checkout>/vendor/forge-steel/. vendor/forge-steel/
```

Backend or schema changes verify against an isolated development backend, never the user's shared
app. Development data is disposable; do not reset another track's environment.

### Merge completion includes the playable app

A merge is: fast-forward `main`, update the shared dev target's affected backend, content and
frontend, smoke-check the changed feature there, and send one Chords message with the commit.
Documentation-only changes need no runtime update. Cloud or external publication still needs an
explicit user instruction.

## Questions for the user

The user is not in build threads. Append rules or product questions to
`docs/rules-questions-for-user.md` with the Compendium paths read, the alternatives and a
recommendation; set the slice to `Blocked (Q-id)` only if nothing else can proceed.
