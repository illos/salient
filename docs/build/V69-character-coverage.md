# V69: Character integration and coverage continuation

Status: in progress. Primary track: characters. User resumed on 2026-09-20.
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
