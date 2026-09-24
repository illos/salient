# Salient agent instructions

Salient is a Draw Steel companion web app: Convex backend, React frontend, TypeScript rules engine.
This file is the whole standing instruction set. Product decisions live in the specs under `docs/`,
the build process in `docs/build/README.md`, test execution in `testing-process.md`.

## Current V1 target

Build toward the [confirmed 2026-09-22 release target](docs/v1-roadmap.md#current-v1-release-target--confirmed-2026-09-22):
all eleven classes playable and close to fully engine automated through level two or three, a useful
low-level foe roster (complete bands are unnecessary), and most app features working and tested.
The exact level ceiling, foe roster and release checklist remain open. Broader levels 1–10 designs
are not all V1 release gates. Prioritize and report work against this target.

## Rules and mechanics

- The pinned Steel Compendium at `vendor/steel-compendium` is the only source of Draw Steel rules.
  Never search online for rules, rulings, errata or content. This binds delegated agents too.
- Every implemented rule or mechanic cites the Compendium file and section it comes from, and its
  tests derive expected values from that source, never from running the code under test.
- Never guess a rule. If the Compendium does not resolve a question, record the uncertainty and keep
  the mechanic explicit and manual. An interpretation is labelled as one, cites the passage and names
  the alternatives considered.
- Rules and product questions for the user go to `docs/rules-questions-for-user.md`; keep building
  what does not depend on the answer. A ruling applies to its original case only.
- A trait or feature that grants an action is complete when that action exists in the UI list and
  the shared CLI/API route, with its conditional availability and persisted effect proven.

## Non-negotiables

- `vendor/steel-compendium` and `vendor/forge-steel` are pinned submodules. Never modify them or
  advance their pins. Community data is input to validate, not evidence of rules support.
- Every external source (the Steel Compendium, Forge Steel and any future reference corpus) has
  exactly one copy on Presidium: the main checkout's, e.g.
  `/srv/presidium/projects/salient/code/vendor/steel-compendium` and `.../vendor/forge-steel`. It is
  a read-only reference for every thread and worktree. Never check one out, clone, copy, symlink,
  extract or vendor it anywhere else: worktrees leave `vendor/*` empty and read the canonical path.
  Never run `git submodule update --init`/`--checkout` on one outside main, change its sparse set,
  commit into it, or merge it. Local git config sets `update = none` on each to block re-initialization.
- Rules resolution stays out of UI components. Every table control is a registered shared operation
  usable from the UI, the command palette, slash commands and headless calls. Every UI capability has
  a supported programmatic CLI/API route.
- DEPLOY2's promotion of merged main to the cloud dev deployment and GitHub is standing
  authorization; any other deployment, push or external publication needs an explicit user
  instruction in the current thread. The Presidium shell carries an ambient
  `CONVEX_DEPLOY_KEY`; run Convex CLI commands with `env -u CONVEX_DEPLOY_KEY` or on CT114.
- Development data is disposable. Reset and reseed instead of migrating. Do not fingerprint, snapshot
  or preservation-check records for a dev build. Do not reset another thread's environment or the
  user's shared app without coordinating first.
- Project code is `GPL-3.0-only`. Game content and artwork keep their own rights and are not copied
  into application assets.
- The Opus character pilot (2026-09-19) is abandoned. Do not reuse its code, tests, fixtures or
  process; its `quarantine/opus-pilot/*` branches are history.

## How work flows

- Work happens in slices under `docs/build/`: one slice document (goal, scope, acceptance checks,
  work log), one row in `docs/build/STATUS.md`, one branch `slice/<id>` in its own worktree cut from
  main. The build README has the commit trailers, review and merge steps.
- Write only tests that catch a concrete failure; delete redundant or implementation-mirroring ones.
  Headless CLI/API journeys with persisted readback prove features. Table browser tests are under
  moratorium until V66 lands; log would-be table scenarios in `docs/build/browser-coverage-backlog.md`.
  The user clarified on 2026-09-22 that the pause is specifically for table testing; focused
  non-table browser tests and investigations may proceed through TESTER.
- All test runs go through the TESTER thread under `testing-process.md`. Implementers run only
  authoring checks locally: lint, typecheck, the focused test file. DEPLOY2 integrates finished
  slices into main and promotes to the cloud dev deployment.
- Deployment reuses accepted TESTER results. Do not rerun suites, headless journeys, smoke tests,
  or live checks before or after promotion just because the commit, environment or release changed.
  Deployment consists of required build/publication steps and recording their success. New tests
  require an explicit user request or a concrete code change/failure needing targeted verification.
- Report what was actually run, with output. A mutation response is not evidence; read persisted
  state back. Never claim something is implemented without evidence in the checkout.

## Communication

- Ask the user in plain text, one question at a time, with a recommendation, and only when the
  answer materially changes the work. Distinguish confirmed requirements from proposals.
- Chords: `whoami`, `list_threads` and `check_updates` at start; then publish only state changes
  (started, blocked, done, handoff) in under 300 characters with the commit and paths. No restated
  policy, no "nothing else was touched" disclaimers, no progress narration. Acknowledge what you
  read; broadcasts older than a day are not required reading.
- Do not reopen settled scope or broaden into class- or monster-specific work outside your slice.

## Where decisions live

Table `docs/table-spec.md`; access `docs/accounts-and-access-spec.md`; characters
`docs/character-wizard-spec.md` (all eleven classes, levels 1–10); inventory `docs/inventory-spec.md`;
catalog `docs/monster-catalog-spec.md`; references `docs/reference-library-spec.md`; data
`docs/data-architecture-spec.md`; tech stack `docs/v1-tech-stack-spec.md`; roadmap
`docs/v1-roadmap.md`; engine philosophy `docs/rules-adaptation-principles.md`; environments
`docs/remote-development.md` and `docs/hosted-development.md`; deployment ledger `deploy.md`.
The instruction history that preceded this file is archived at
`docs/decisions/2026-09-20-instruction-archive.md`.
