# V69: Character integration and coverage continuation

Status: merged into main through V74 `b73cb8d`; full checks, reviews, hosted API 27/27 and Forge 31/31 pass. Shared-main rollout and 27/27 API proof pass; see [V74 evidence](evidence/V74/README.md). Primary track: characters. User resumed on 2026-09-20.
Rules review: required for ancestry changes; no new mechanics in V65 integration.

## Scope and ownership

Integrate preserved `slice/V65` onto current main while preserving peer changes and the browser
moratorium. Add Hakaan (V70) and Orc (V71) as separate units. Worktree
`.worktrees/character-coverage`, branch `slice/V69`; lead owns shared registration, content generation,
remote runtime and headless runner. Unit agents own their ancestry modules, focused tests and records.

Spec: [decision system](../character-wizard-spec.md#3-decision-system),
[shared operations](../character-wizard-spec.md#9-shared-operations-and-reliability).

## Acceptance and bounded verification

Preserve V65's passing evidence; run focused ancestry checks, full repository checks once the combined
candidate is ready, and authenticated public-route verification against hosted development
`different-bat-943` from CT114. No browser tests, timeout increases or retry loops. Record blockers
and continue independent implementation. Same-build Forge counterparts and independent reviews
remain separate acceptance gates; missing reference evidence is not silently waived.

Every new test identifies the concrete failure and added coverage. New live witnesses must verify
choices, grants, permanent values and readable manual effects after saving and reading back.
Exercise changed-parent cleanup for ancestry-specific choices. Retain current campaign permissions,
review, history, progression and live-state regressions through the existing runner.

## Work log

- Candidate integrates V65 with current main. Six documentation merge conflicts retain main's
  current doctrine/checkpoint; application files merge without conflicts. No main merge claimed.
- Prior four ancestries have passing live headless proof, but their reference/review acceptance is
  incomplete. A static audit will identify remaining concrete gates; development continues.

## Verified result

Runtime source `ab0f2fd875155d929f5efed201b14d96a821f4f7` includes main through V63
`b6109b0`, preserved V65, Hakaan commit `99d5f5b` (original `5fb9732`) and Orc commit
`11be36f` (original `d2905c4`). The later V67 pure compiler is not in this candidate and has
no deployed runtime impact. Backend and frontend now match this source; hosted Worker
`7830be2c-15d9-4c6f-8634-25c0edf55988`, 515 content entries.

- Full CT114 `pnpm check`: 737 tests, lint/types/content/vendor/links/build pass.
- One complete live authenticated API pass: 26 scenarios pass in 82.857 seconds, no skips.
- Independent implementation and fresh pinned-source reviews pass for all six candidate ancestries.
- No browser tests; no timeout increases or retry loops. One new TypeScript narrowing error was
  corrected before the successful full check; original failed evidence is retained.

See [evidence](evidence/V69/README.md), [implementation review](reviews/V69-implementation-review.md),
[new ancestry rules review](reviews/V70-V71-rules-review.md), and
[preserved ancestry rules review](reviews/V57-V61-rules-review.md).

## Coverage inventory and subsequent delivery

V69 introduced Hakaan and Orc alongside Devil, Polder, Dwarf and Human. V73/V74 subsequently
closed the reference and trait-action gaps: all 31 saved Forge counterparts and 27 hosted/shared-main
API journeys passed, and the candidate merged into main. The user approved programmatically
constructed counterparts from pinned Forge code; website capture is no longer required.

[V82](V82-remaining-ancestries.md) owns the remaining six ancestries: Dragon Knight, High Elf,
Memonek, Revenant, Time Raider and Wode Elf. Consult that slice and the
[current handoff](character-restart-handoff.md) for delivery status. Class coverage remains the
existing partial Fury/Elementalist paths; ancestry completion does not certify all eleven classes
or levels. Generic lifecycle coverage is sampled, not every build combination.
