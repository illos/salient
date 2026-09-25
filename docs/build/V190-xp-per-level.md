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
- Entry level, **implementation interpretation (Q-XP-1), not a user ruling:** `chapter/making-a-hero.md`,
  Heroic Advancement says "The amount of Experience you gain is cumulative" and gives a 3rd-level hero
  32-47 XP. Salient's stored XP counts only XP earned after entry; the entry level comes from
  `entryLevelXpOffset` ((entryLevel − 1) × 16, no schema change) as offset / 16 + 1, so the campaign pace
  applies to XP earned after entry. Alternative: cumulative table XP, storing and showing the entry
  level's table XP plus earned XP. Recommendation: keep the current reading.
- Only Respite Complete grants. Lowering the pace grants catch-up levels at the next Complete; raising
  it removes nothing; nothing is retroactive.
- Manual grant and withdraw keep their operations, but Complete absorbs them: a manual grant counts in
  level + pending, so later XP fills it before granting more; withdraw never changes XP, so a withdrawn
  level-up returns at the next Complete if XP still earns it. The Director stops that with `/adjust xp`.
  Both operation descriptions say so.
- `characters.sheet` returns `xpProgress` computed on the server; the Stats row reads
  "XP 20 · level 3 at 32" at the campaign's pace (16 outside a campaign). The named level is the next
  one Complete can grant: max(earnedLevel, level + pending) + 1, at (that level − entryLevel) × XP per
  level; nothing once level 10 is held or pending.
- UI: the table settings pop-up gains an XP per level row: a slider (1–48) snapping to Double 8,
  Standard 16 and Half 32, preset pills, and a number input for any value 1–200. Each submits the
  operation.

**Consequence of the owed-levels model (follows from the confirmed design):** XP adjusted by hand now
counts at the next Complete, where V165 counted only that respite's gain.

## Acceptance checks

1. `tests/app/xp-per-level.test.ts`: 16 → 17 XP gives 1 pending and the sheet shows level 3 at 32;
   8 → 17 XP gives 2; lowering 16 → 8 with 20 XP at level 2 grants 1 at the next Complete and nothing
   before; raising to 32 removes nothing; player refused; 0, 201 and 12.5 refused; an entry level 3
   hero admitted through the real create/submit/approve flow stores offset 32 and earns from level 3;
   a manual grant is absorbed by later XP; a withdrawn level-up returns at Complete and `/adjust xp`
   stops it; the sheet's next level after a raised pace (level 3 at 64) and none at level 10; the
   level-10 cap at 16 and 8. The taken level 2 in the lowering case is set directly on the stored
   build (the level-up flow has its own suite).
2. `tests/app/respite.test.ts`: owed-level arithmetic at 16; `tests/app/table.test.ts` settings payload.
3. Headless `respite`: sets 8 and 32 through `campaign.xp-per-level`, completes respites and reads
   back `pendingLevelUps` and the sheet's `xpProgress`.

## Work log

- Built on `slice/V190`, `.worktrees/xp-per-level`. Author checks: both TypeScript projects, lint, the
  focused app tests (xp-per-level, respite, table), the Convex push check.
- Review of `d4d2eb38`: FAIL, five findings, all fixed. The sheet's next level counts from
  max(earnedLevel, level + pending) (headless now expects level 4 at 96 at half speed with 2 pending);
  the entry-level reading is labelled an interpretation with Q-XP-1; grant/withdraw absorption is
  documented in the spec, this doc and both operation descriptions, with app tests; the XP per level
  presets sit on the `bg-muted` track, the slider submits on pointer up or a committing key only, and
  a non-numeric value is never submitted; the level-3 test now admits through the real flow and
  asserts `entryLevelXpOffset` 32.
