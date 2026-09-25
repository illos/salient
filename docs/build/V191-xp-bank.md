# V191: XP bank

Rules review: required. Depends on: V190.

## Goal

Each hero's XP is a bank: Respite Complete adds Victories to it and spends each full XP per level
(the campaign's setting) on a pending level-up, keeping the remainder. This replaces V190's
cumulative earned-level and owed-levels model ([respite mode](../table-spec.md#respite-mode),
[level-up](../character-wizard-spec.md#level-up)).

## User ruling (2026-09-25)

"Switch to a bank. The books mention using different rates of advancement, but they assume 16 almost
always in their text. The app actually makes that recommendation of adjustment a reality and so a bank
makes more sense."

## Sources

- `chapter/making-a-hero.md`, Heroic Advancement: "The amount of Experience you gain is cumulative";
  the Heroic Advancement Table gives 16 XP per level (2nd at 16 … 10th at 144+).
- `chapter/making-a-hero.md`, Adjusted XP Advancement: double speed 8 per level (10th at 72+), half
  speed 32 per level (10th at 288+); "Directors can also create their own customized pace".
- `rule/resource/experience.md`: Victories convert to XP when a respite finishes, then reset to 0.

## Adaptation label

**User-ruled adaptation** (`docs/rules-adaptation-principles.md`, deliberate departures): the source
reads a cumulative XP total against a table; Salient keeps a bank. At a fixed pace from level 1 the
two reach the same levels. They differ when the pace changes (the bank applies the new pace to what is
banked; the table would re-read the whole total), when a level-up is granted or withdrawn by hand, and
for a hero admitted above level 1 (empty bank). Alternatives considered: V190's cumulative XP with
owed levels, and cumulative table XP from the entry level (Q-XP-1, now resolved by this ruling). The
ruling applies to this case only.

## Design

- `liveState.xp` is the bank; new optional `liveState.xpLifetime` is display-only lifetime XP
  (optional so rows written before V191 validate; development data is not migrated).
- `shared/evaluate/xpAdvancement.ts` `respiteXp`: bank += Victories, lifetime += Victories; while
  bank ≥ XP per level and level + pending < 10, bank −= XP per level and one level-up is granted.
  `convex/lib/respiteOperations.ts` `respite.complete` applies it and resets Victories to 0.
- The V190 `earnedLevel`, `levelUpsOwed` and `entryLevelOf` are removed. `entryLevelXpOffset` stays
  as a stored record of the entry level (admission still writes it; the progression query and the
  level-up event still report it) but nothing reads it for XP.
- `character.grant-level-up` leaves the bank alone; `character.withdraw-level-up` is final (no refund; only banked XP buys a later level,
  no re-grant). Both descriptions say so.
- `adjust.xp` (`/adjust xp value=N`) sets the XP bank; its description says so. Lifetime XP is not
  changed by it.
- A rate change applies to the bank at the next Complete; no catch-up.
- `characters.sheet` `xpProgress` = `{ bank, xpPerLevel, lifetime, capped }` computed on the server;
  `xpProgressRows` (shared) gives the Stats rows "XP 5 / 16" and "Lifetime XP 37"; when level 10 is
  held or pending the XP row is only the bank.

## Acceptance checks

1. `tests/app/xp-per-level.test.ts`: at 16, 17 XP gives 1 level-up and 1 banked (sheet "1 / 16",
   lifetime 17); at 8, 17 gives 2 and 1 banked; 12 banked at 16, lowered to 8, then 4 Victories give 2
   and 0 banked; raising to 32 removes nothing (bank 4, "4 / 32"); a hero admitted at level 3 through
   the real flow starts at 0 and levels at 16; a manual grant leaves the bank alone; a withdrawn
   level-up is not re-granted; `/adjust xp` sets the bank and leaves lifetime; the level-10 cap keeps
   the bank (sheet shows only it); Director-only and 1–200 validation unchanged.
2. `tests/app/respite.test.ts`: Complete leaves bank 1 and lifetime 17 for 17 Victories; `respiteXp`
   arithmetic at 16 including the level-10 cap.
3. Headless `respite`: bank 0 after 16 at 16; bank 1 and 2 pending after 9 more at 8; sheet
   `xpProgress` `{ bank: 1, xpPerLevel: 32, lifetime: 25, capped: false }` after raising to 32.

## Work log

- Built on `slice/V191`, `.worktrees/xp-bank`. Author checks: both TypeScript projects, lint, the
  focused app tests (xp-per-level, respite, table), the Convex push check.
- Independent review PASS (2026-09-25). Its low findings are fixed: withdraw wording covers XP banked at the level-10 cap, the admitted-above-level-1 difference, the server and shared split for the XP text, and a Cancel test with a non-zero bank.
