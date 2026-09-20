# V87: Seed the core Foes library into application content

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team, foes coordination |
| Rules review | not required; source extraction, no new mechanical interpretation |
| Depends on | S01; V02 is a soft integration dependency for the table picker |
| Status | In progress on slice/V87 |

## Goal

Seed every eligible core monster stat block and its verbatim embedded features into shared application content. V02 owns the table catalog and loading UI; this slice supplies that catalog without changing creature mechanics.

## Spec references

- `docs/monster-catalog-spec.md#features-and-supporting-rules`
- `docs/monster-catalog-spec.md#confirmed-ingestion-requirements--2026-09-15`
- `docs/build/README.md#programmatic-headless-completion-gate`

## Scope and dependencies

Widen S01 selection to monster/ and the minion/squad/captain rules. Preserve the existing core sourcebook filter, ids, source text and JSON features. Batch reference seeding without deleting application data. Preserve current shared ability extraction. Do not edit V02-owned foe operations, catalog queries or UI. Full creature automation, gameplay trait implementation and shared-main rollout are outside this branch handoff.

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
