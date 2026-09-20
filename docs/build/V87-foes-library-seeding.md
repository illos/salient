# V87: Seed the core Foes library into application content

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team, foes coordination |
| Rules review | not required; source extraction, no new mechanical interpretation |
| Depends on | S01; V02 is a soft integration dependency for the table picker |
| Status | Verified and independently reviewed; branch handoff ready, not merged |

## Goal

Seed every eligible core monster stat block and its verbatim embedded features into shared application content. V02 owns the table catalog and loading UI; this slice supplies that catalog without changing creature mechanics.

## Spec references

- `docs/monster-catalog-spec.md#user-visible-flow`
- `docs/monster-catalog-spec.md#features-and-supporting-rules`
- `docs/monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15`
- `docs/build/README.md#programmatic-headless-completion-gate`

## Scope and dependencies

Widen S01 selection to monster/ and the minion/squad/captain rules. Preserve the existing core sourcebook filter, ids, source text and JSON features. Batch reference seeding without deleting application data. Preserve current shared ability extraction. The Fable review handoff extends scope to source-derived parent names in foe operations and picker labels, nested-family grouping and level labels. Full creature automation, gameplay trait implementation and shared-main rollout are outside this branch handoff.

## Acceptance checks

1. Deterministic content generation includes all 438 core stat blocks; supplemental entries remain explicitly excluded. Every included monster preserves its pinned Markdown and JSON features.
2. Reseeding runs bounded transactions, preserves existing row ids and unrelated application data, removes stale content, and publishes the manifest only after completion. Interrupt/retry and source-change refusal are tested.
3. An isolated local backend accepts the code and seed; authenticated public content.get reads back a non-goblin stat block with exact source and embedded abilities. Anonymous reads remain refused.
4. Measure generated content and actual Convex bundle growth; run pnpm check and obtain independent implementation review.

## Ability design and playtest evidence

No new mechanics or grants are implemented. Existing features remain verbatim, including traits; ability extraction is checked on representative non-goblin content. V02 integration is required for table loading beyond Goblin Warrior. Do not claim automated coverage from content presence.

## Rules research

Pinned Compendium monster corpus at fb83a789da8f0327a389c277a0c790b1648d5810. Preserve source values and distinctions without interpreting prose as automatic effects.

## Work log

- 2026-09-20: Accepted Fable assignment 754 under the user's standing instruction to accept Fable handoffs. V02 review already completed independently at b634d87; avoid duplicating it. Created .worktrees/foes-seeding, slice/V87 from main ad8bdbe. Own scripts/build-content.ts, convex/content.ts, generated content and consumer fixture updates. No shared runtime claim.
- Expanded corpus: 1151 entries, 438 core stat blocks, 126 explicitly excluded entries. The peer's estimate of 527 stat blocks includes non-core sources and is not the accepted output count. Lich Malice requires YAML literal-block support; use the installed YAML parser with duplicate-key errors and disabled aliases, retaining JSON cross-checks.
- Seeding now upserts by source id in batches capped at 32 rows / 512 KiB serialized payload, prunes with bounded pagination, and publishes the manifest after counting retained entries. Interrupted seeding leaves status null and existing references present; rerun repairs it. Concurrent code changes refuse stale content hashes. This is resumable reference maintenance, not an atomic all-catalog swap.
- Convex limits consulted at https://docs.convex.dev/production/state/limits: transaction reads/writes 16 MiB, document 1 MiB, deployment code 32 MiB (2026-09-20). Actual bundle and live proof pending.

- Integrated candidate `6836d1d` rebases onto V02 main `7e1c088`; selection conflicts keep the core superset, generated V72 inventory now reports eight reachable compiled abilities (Ghoul Razor Claws added). All required checks PASS: 352 engine + 526 app/scripts, every source/build gate. Public isolated API proof run 77ea078c passes in 4.722 s, including Director definitions, Ghoul load/sheet, actual Razor Claws damage and undo/redo. See [evidence](evidence/V87/README.md).
- Readability audit found five existing heading-spacing gaps among 1,158 embedded ability records. Prepared and tested the narrow repair separately as `029ea29` on slice/V87-heading-fix to leave Fable's review candidate stable. Corpus regression fails against original parser, passes after repair; web typecheck passes. Repair integration and final independent acceptance remain pending. Core corpus includes 21 retainer entries and 8 without organization; no retainer-specific play/progression support is implemented.
- Fable accepted independent review (Chords 775). Status is **In review**, branch only; no main Git/runtime rollout. Final handoff must incorporate the heading fix and reviewer findings, then verify the final delta. Existing local deployment data is retained.

## Round 1 repairs and final verification handoff

Rebased over main `618fadd`; heading repair integrated as `b4f463c`. YAML parsing now shares one
implementation with explicit duplicate-key, alias and non-mapping rejection coverage. The table
catalog derives parent labels from the source manifest: Xorannox's six eyestalks carry his name in
picker labels and saved instances, without rewriting source snapshots. Noncombatant, Source of Earth
and retainers remain loadable. Family grouping handles echelon subdirectories; both picker surfaces
show levels to distinguish Rival copies. This is catalog naming, not new game mechanics.

The optional same-hash manifest deletion and corrupt duplicate-row recovery notes are deferred:
status intentionally stays null during maintenance, and the indexed unique-content invariant still
refuses corrupt duplicate rows. Existing retry/preservation tests cover supported states. Whole-catalog
summary projection and cold-start memory remain rollout considerations; TESTER is asked to record
isolated first-call latency and available runtime memory evidence before any shared rollout.

All new verification is assigned to TESTER under [the testing process](../../testing-process.md).
Earlier 878-test results apply to `6836d1d`, not this final repair candidate. Round 2 and the final
committed-source full check/live proof are pending; this branch is neither accepted nor merged.

| Capability / scenario | CLI/API entry point | Headless command, source, target and persisted evidence | Headless result | Browser result and additional gap |
| --- | --- | --- | --- | --- |
| Complete core catalog, load Ghoul and use Razor Claws with undo/redo | content.status/list/get; foes.definitions/add/detail; abilities.sheet; commands.submit | `SALIENT_V87_TARGET=http://127.0.0.1:3260 node scripts/v87-headless.ts`; prior source `6836d1d`, isolated local3260; [report](evidence/V87/headless.json), exit0, 4.722s, stamina15→12→15→12 | Prior pass; final committed candidate pending TESTER | Deferred by moratorium; picker readability remains visual backlog |
| Five source-heading repairs and parent-prefixed loaded eyestalk | foes.definitions/add/detail; abilities.sheet | Same committed runner extended with persisted heading/parent witnesses; source and target recorded by runner | Pending TESTER | Deferred; layout and label readability remain visual backlog |

## Final branch handoff — 2026-09-20

TESTER verified exact source `104f4b087c58a6c1451d66c57f6e0eb1a101dba3`: focused 30/30,
full `pnpm check` exit 0 (352 engine + 528 app/scripts = 880 tests, all source/build/budget gates).
See [coordinator evidence](evidence/V87/tester-job-104f4b0.md). The earlier failed fixture-key
attempt remains recorded in [its evidence](evidence/V87/tester-job-4d8c127.md); the repair uses
independent UUIDs and changes no runtime behavior.

Independent reviewer `v87_independent_review` passed round 3 (Fable Chords 840), conditional on
this exact TESTER run passing; that condition is now satisfied. No rules review is required.
The code is committed on `slice/V87`, not merged into main or deployed to the shared app.
Fable owns the user's merge decision and subsequent integration/rollout.

| Capability / scenario | CLI/API entry point | Headless command, source, target and persisted evidence | Headless result | Browser result and additional gap |
| --- | --- | --- | --- | --- |
| Core catalog, five repaired sheets, parent-prefixed eyestalk, Ghoul damage and undo/redo, anonymous refusal | content.status/list/get; foes.definitions/add/detail; abilities.sheet; commands.submit | `SALIENT_V87_TARGET=http://127.0.0.1:3260 node scripts/v87-headless.ts`; clean source `104f4b0`, isolated local3260; [report](evidence/V87/headless.json), run7dc9ef92, exit0, 3.978s; stamina15→11→15→11 | Pass, TESTER | Deferred by moratorium; picker/card visuals remain in browser backlog |

First definitions load was 162ms. After backend readiness the host had 12,729MiB available memory
and zero current memory PSI. These are host measurements, not isolate heap or process RSS; those
were not captured. The backend was stopped, ports freed, and retained data preserved. The runner
wrote its report to the tracked evidence path; this docs-only closeout preserves that generated
report unchanged. No application code changed after the tested source.
