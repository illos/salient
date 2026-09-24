# V169: Rapid Processing's extra respite activity

Rules review: required. Depends on: V166, V167 (stacked on `slice/V167`).

## Goal

A Chronokinetic Null with Rapid Processing can take the additional respite activity the feature grants.
V166 refused any second activity.

## Source

- `rule/resource/respite.md`: "You can also undertake one respite activity, such as making a project
  roll … or changing your kit".
- `feature/null/level-2/rapid-processing.md`: "Additionally, during any respite, you can take an
  additional respite activity."
- Rapid Processing is the only additional-activity grant at levels 1–3. Deferred and resolved manually
  until built (the review found these; a plain-text search misses them because "respite" is a link):
  `feature/talent/level-8/doubling-the-hours.md` (one more while at 5+ Victories),
  `feature/fury/level-8/menagerie.md` (a stormwight kit swap uses no activity),
  `treasure/artifact/mortal-coil.md` (one more per creature in its area),
  `feature/tactician/level-7/grand-strategy.md` and `shock-and-awe.md` (a project roll in addition),
  `title/master-librarian.md` (a project with no activity), and at any level
  `project/spend-time-with-loved-ones.md` (Event 2: a project roll that is not an activity). Conditional losses of the activity, at any
  level: the complications `complication/evanesceria.md` (a rolled drawback) and `complication/ward.md`
  (when the ward needs help), and monster effects on the next respite (`flesh-mournling.md`,
  `high-elf-palinode.md`, `radenwight/radenwight-malice.md`). The Director records a lost activity
  by name with `/respite activity`. Inspired Artisan adds a
  second project roll within one activity, which stays manual.

## Scope

- `shared/evaluate/respiteActivities.ts`: allowance is 1 plus one per additional-activity feature in the
  hero's current build. **Implementation interpretation:** it is read when the activity is recorded,
  so a level-up taken during the respite counts. By the rules a hero levels up after a respite, so the
  mid-respite level-up is an app convenience. The alternative, fixing the allowance at start, was
  rejected because the feature applies "during any respite" the hero has it for.
- Cancel after two kit changes: it reverts to the pre-respite build only when the kit change is the one
  revision since it. Otherwise it reapplies the earlier kit, keeping a level-up taken in between
  (Q-RESPITE-1).
- `respite.activity` and `respite.change-kit` accept activities up to the allowance. The first is still
  `activity`; later ones are stored in `moreActivities`. A second kit change still makes Cancel revert
  to the build from before the respite.
- Complete names heroes who used none ("No respite activity used") and heroes with some left
  ("Respite activities left unused: name (n)").
- `table:roster` and `sessions:get` return every activity and the unused count. The table card lists
  them and offers the controls while any activity is left.

## Acceptance checks

1. `tests/app/respite.test.ts`: the v103-1 Chronokinetic witness at level 1 gets one activity. Levelled
   to 2 during the respite through the shared level-up path, its build shows Rapid Processing and it
   takes a second activity; a third is refused. Thorn gets exactly one. A later respite names the
   Null's one unused activity on Complete. Roster, stored and event readback are checked.
2. Test-Deploy: gate, then the `respite` and `level-up` journeys.

## Work log

- Built on `slice/V169`, `.worktrees/respite-extra`, stacked on V167. Author checks: lint, both
  TypeScript projects, respite app tests (14/14).
- Re-review FAIL (doc only): the denial list lacked Evanesceria, Ward and Radenwight malice; added.
- Confirmation pass added Spend Time with Loved Ones (Event 2); otherwise PASS.
