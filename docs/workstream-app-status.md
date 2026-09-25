# App workstream status

Historical 2026-09-15 status record. Runtime addresses, ownership, and next actions below are not
current instructions; use the [current direction](v1-roadmap.md#version-one) and [build status](build/STATUS.md).

## Current audit — 2026-09-15

A02–A07 implementation and repairs have passed independent code/source review. The audit incorporates
settled characteristic/language/potency decisions, real admitted baselines, compatible current-value
caps (Q-CHAR-2), warning-based turn departures, fixed costs, shared recovery tracking, privacy-safe
history and formal closeout/Void. A connected fresh-backend walkthrough passes from admission to the
next session and both paused Void paths. Full checks pass (392 tests), all eight live browser
scenarios pass, and independent desktop visual review passes. Q-CHAR-10/11 and resolved language
labels are reconciled; the reviewed question queue has no open questions and three explicit deferrals.

Use [the single build tracker](build/STATUS.md) and
[integrated acceptance evidence](build/evidence/v001-acceptance.md) for current verification and scope.
The implementation history below predates the slice build and retains its original limitations as
historical context; it is not the current feature/visibility contract.

Started 2026-09-11 after the user authorized implementation and a baseline commit.
Baseline: `5efb7c7` (clean checkout); TypeScript check and all 28 existing Node tests passed.

## Ordered implementation plan

1. Set up React/Vite/TanStack Router, Better Auth and a local Convex development backend; retain the headless experiment.
2. Connect accounts, campaign creation, share-code join requests/approval and noncombat session lifecycle/participation.
3. Add character authoring/persistence and source/foe surfaces against available contracts. Request missing character evaluation and combat contracts precisely; never substitute fixtures for completion.
4. Integrate table/history surfaces, exercise multi-user access, persistence and reconnect, and obtain independent review.

## Current ownership and working slice

- Lead now owns the integrated app: root package/lock/config, `convex/`, `web/`, `shared/`, new app scripts/tests and this status file. Backend and character/foe workers returned their slices; independent review fixes are integrated.
- Existing `src/`, the original Node tests and both vendored pins remain unchanged. S01 replaced `scripts/build-foe-source.ts` with `scripts/build-content.ts`, which generates the v0.01 content snapshot (`shared/content/compendium/`) at the existing pin.
- The rules thread owns its status, kickoff and mechanical specification changes. Its concurrent edits are preserved and are not app implementation.

Working user journeys:

- Real Better Auth email/password sign-up, sign-in and sign-out; authenticated workspace and server session checks.
- Campaign creation, public invitation preview, owner-only invitation rotation, join request/withdraw/approve/decline and member hub.
- Director selects session players and starts/pauses/resumes/closes noncombat sessions. Other members observe. One active session and permanently read-only closed history are enforced server-side.
- Private authored character drafts (name, appearance, biography, owner-only notes), save/reopen and stale-edit protection. Immutable source/branch-qualified choice revisions persist independently. No unevaluated build can activate or enter a campaign.
- Director loads independent Goblin Warrior instances, reads exact source and changes visibility/default/removes them regardless of session phase. Foes persist across sessions; peers receive only visible names and health bars.
- Bounded reactive campaign/session activity log, older-event paging, connection feedback and ordinary failure/retry states.
- `pnpm app` authenticates headlessly and calls those same Convex operations; a CLI foe visibility write is checked through another user's browser.

## Environment and evidence

No Convex deployment was configured at kickoff (official MCP status returned no `CONVEX_DEPLOYMENT`). The current target is **local anonymous `anonymous-agent`**, backend `http://127.0.0.1:3212`, auth HTTP `http://127.0.0.1:3213`, frontend **http://127.0.0.1:5180**. The backend watcher and Vite server are running. No cloud publication or production mutation occurred.
The baseline commit used the same Codex author identity as previous repository commits, supplied only for that command because Git identity was unset.

Run instructions are in `README.md`. `.convex/` holds local persisted data and `.env.local` holds endpoint configuration; both are ignored. `pnpm setup:local` preserves the auth secret and rejects deployment-key overrides; every child CLI call selects the validated `.env.local` explicitly. `pnpm dev:backend` must remain running.

Verified evidence:

- Original TypeScript/Node engine checks: 28 passing, unchanged.
- Application TypeScript and 26 application/independent-review regressions pass, including four isolated setup subprocess tests. Final build and frozen-lockfile install pass.
- Full Chromium browser journey passed: three isolated Director/player/observer contexts, real auth, membership approval, reactive foes, session lifecycle, reload/network interruption, authored draft save/readback, forbidden Director read of private character and CLI-to-browser persistence.
- Vite production build passed; dependency peer check clean. Installed Better Auth pinned to `1.6.15` after `1.6.31` produced an incompatible integration type; no casts were used to hide it.
- Generated source check passes against the unchanged pinned corpus; independent reviewer directly compared Markdown/raw JSON and source ability text. Full stat-block snapshot is backend-only.
- Independent review reproduced and verified fixes for ambiguous-response retries and repeated show/hide/show commands, authenticated-session revocation, stolen IDs and concurrent starts/duplicate writes. Setup/CLI final review identified and fixed target alias selection, read-failure secret replacement and temporary-session cleanup.
- Short desktop performance sample: Chromium `153.0.8010.12`, 1440×900, Vite development mode, one Director, 40 pause/resume cycles (80 mutations). After cycles 30/40, rendered log remained 50 rows and DOM 669 nodes; post-GC JS heap 12,129,480 / 12,366,928 bytes. Median full pause+resume cycle 541 ms; p95 1,022 ms. Two seconds idle added 0.000302 s renderer task time. This is not a multi-hour/multiplayer performance certification. Local artifacts: `.playtest/table-performance.json`, `.playtest/measure-table.mjs`, `.playtest/web-campaign.png`.

Engineering bounds: 50 campaigns per user, 100 members/pending requests per campaign, 24 selected players, 100 characters per user and 100 foes per campaign. Session selector and personal request list show the latest 50; event history supports bounded older pages. The UI is temporary desktop presentation, without mobile or graphics work.

## Integration dependencies

The dedicated rules/combat thread started during this slice. Read `docs/workstream-rules-status.md` and its current table-spec refinements before integrating combat. Its confirmed three-pane combat layout does not turn this noncombat campaign hub into the combat view.
Existing engine contracts are a bounded experiment, not a settled application combat or character evaluation contract. The complete v0.01 journey and minimal wizard are **not complete**.

Precise rules-workstream handoff requests (file handoff only; no direct receipt from the other thread is claimed):

1. Complete level-one devil Fury decision definitions: stable branch/choice IDs, permitted values, counts/budgets/dependencies, automatic grants and source references.
2. Pure evaluator from saved selections to incomplete/invalid/unsupported/complete status, diagnostics, derived baseline with provenance and granted readable abilities; independently reviewed complete/incomplete/invalid examples.
3. New-character live-state initialization and effective-build-to-engine projection. Reconciliation policy is needed for edits that change maxima/resource types; saving drafts never resets play state.
4. Agreed combat/opening/action/log contract: accepted/applied/manual/unresolved outcomes, full used-action source, committed costs/dice, pending dependencies and undo/correction sequencing. Opening setup/observer-roll and snapshot timing remain with that discussion.

Current storage/UI boundary lives in `shared/characterDraft.ts`, `convex/characterTables.ts`, `convex/characters.ts`; commands/access/events live in `convex/lib/`. These are app engineering contracts, not accepted rules-evaluation APIs. No fixture substitutes for a complete wizard. Campaign character admission/review/effective-build activation, hero roster selection, gameplay and combat history integration remain dependent on the evaluator and mechanical contracts.

Next action: consume the rules thread's first reviewed character/combat contract and implement the dependent journey, preserving the current identity, revision and audience checks. Status correction, 2026-09-14: the app changes described above were committed after baseline `5efb7c7` in `26b118f` ("Add pre-alpha web app and gameplay foundations", which added `convex/`, `web/` and related files), followed by `821426b`, `e4687f3` and `517ffc4`. As of 2026-09-14, `git status` still shows uncommitted documentation changes (`README.md`, `agent.MD`, several `docs/*.md`) and untracked `CLAUDE.md`, `docs/character-sheet-spec.md` and `docs/design-references/`; no uncommitted application code is reported.
