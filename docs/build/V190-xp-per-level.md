# V190: Campaign XP per level

Rules review: required. Depends on: V165.

## Goal

The Director sets how much XP each level needs for the campaign, and a completed respite grants the
levels a hero is owed at that pace (user design confirmed 2026-09-25;
[respite mode](../table-spec.md#respite-mode), [level-up](../character-wizard-spec.md#level-up)).

## Sources

- `chapter/making-a-hero.md`, Heroic Advancement: XP is cumulative; the Heroic Advancement Table gives
  16 XP per level (level 2 at 16 … level 10 at 144).
- `chapter/making-a-hero.md`, Adjusted XP Advancement: double speed 8 per level (0-7, 8-15 …, 10th at
  72+), half speed 32 per level (0-31 …, 10th at 288+); "Directors can also create their own
  customized pace for XP-based advancement."
- `rule/resource/experience.md`: Victories convert to XP when a respite finishes.

## Design

- `campaigns.settings.xpPerLevel` (optional; absent means 16). Director-only operation
  `campaign.xp-per-level` (arg `value`; `/campaign xp-per-level value=24`), `campaign.setting` event
  journaled like the other settings. Accepted: whole numbers 1–200 (a product bound, not a rule).
- `shared/evaluate/xpAdvancement.ts`: earnedLevel = min(10, entryLevel + floor(xp / xpPerLevel));
  levels owed at Complete = max(0, earnedLevel − (level + pendingLevelUps)). The old
  thresholds-crossed-by-this-gain rule and the `XP_PER_LEVEL` constant are gone.
- Entry level: `entryLevelXpOffset` keeps its stored meaning, (entryLevel − 1) × 16, with no schema
  change; it is read only as entryLevel = offset / 16 + 1, so the campaign pace applies to XP earned
  after entry.
- Only Respite Complete grants. Lowering the pace grants catch-up levels at the next Complete; raising
  it removes nothing; nothing is retroactive. Manual grant and withdraw are unchanged.
- `characters.sheet` returns `xpProgress` computed on the server; the Stats row reads
  "XP 20 · level 3 at 32" at the campaign's pace (16 outside a campaign).
- UI: the table settings pop-up gains an XP per level row: a slider (1–48) snapping to Double 8,
  Standard 16 and Half 32, preset pills, and a number input for any value 1–200. Each submits the
  operation.

**Consequence of the owed-levels model (noted, follows from the confirmed design):** XP adjusted by
hand, and a withdrawn pending level-up, now count at the next Complete, where V165 counted only that
respite's gain.

## Acceptance checks

1. `tests/app/xp-per-level.test.ts`: 16 → 17 XP gives 1 pending and the sheet shows level 3 at 32;
   8 → 17 XP gives 2; lowering 16 → 8 with 20 XP at level 2 grants 1 at the next Complete and nothing
   before; raising to 32 removes nothing; player refused; 0, 201 and 12.5 refused; an entry level 3
   hero earns from level 3; the level-10 cap at 16 and 8. The taken level 2 and the level-3
   admission are set directly on the stored build (the level-up and admission flows have their own
   suites).
2. `tests/app/respite.test.ts`: owed-level arithmetic at 16; `tests/app/table.test.ts` settings payload.
3. Headless `respite`: sets 8 and 32 through `campaign.xp-per-level`, completes respites and reads
   back `pendingLevelUps` and the sheet's `xpProgress`.

## Work log

- Built on `slice/V190`, `.worktrees/xp-per-level`. Author checks: both TypeScript projects, lint, the
  focused app tests (xp-per-level, respite, table), the Convex push check.
