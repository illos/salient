# V97: Shadow level two and full-builder level selection

Rules review: required. Depends on: V92, V96.

## Goal

Build and edit a Shadow at level two in the full wizard. A level selector chooses the build's
current target level and exposes all applicable options through that level. A guided advancement
flow is deferred; existing campaign review and effective-build gates remain in force.

## Scope

Spec: `docs/character-wizard-spec.md#3-decision-system` and
`docs/character-wizard-spec.md#4-wizard-flows`.

Pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` sources:

- `en/unified/md/class/shadow.md`, Basics and Shadow Advancement Table: +6 Stamina at level two;
  characteristics, eight Recoveries, first-echelon kit bonuses and Agility potency unchanged.
- `en/unified/md/feature/shadow/level-2/2nd-level-college-feature.md` and `burning-ash.md`,
  `trained-assassin.md`, `friend.md`: corresponding college feature. Burning Ash damage and
  Trained Assassin surge remain source text/manual. Friend!'s effect inclusion and Disengage as
  part of I'm No Threat have conditional manual action records; no extra action cost is invented.
- `en/unified/md/feature/shadow/level-2/perk.md`: choose one exploration, interpersonal or intrigue
  perk, using the existing complete core perk catalog and its extracted actions.
- `en/unified/md/feature/shadow/level-2/2nd-level-college-ability.md` and all six files under
  `en/unified/md/feature/ability/shadow/level-2`: one 5-Insight ability from the selected college.
  Black Ash: In a Puff of Ash / Too Slow; Caustic Alchemy: Sticky Bomb / Stink Bomb;
  Harlequin Mask: Machinations of Sound / So Gullible. Grouping also checked in
  `en/books/heroes/clean/Draw Steel Heroes.md`, Shadow, 2nd-Level Features.
- Sticky Bomb attachment records use/cost; detonation timing, disarm and delayed roll remain manual.
  Other unsupported effect clauses, trigger timing and movement retain their printed manual text.

The selector exposes supported definition levels 1 and 2, with levels 3–10 visibly unavailable.
Unsupported class/level combinations retain explicit evaluator diagnostics. Lowering the level
removes choices owned by the higher-level definitions; college/class edits prune their branch.
New and resumed working drafts persist the selected level through the same serialized save queue.
The public `characterWizard:transitionLevel` query shares the UI's transition helper; create/save
accept targetLevel. This is full editing, not an XP-gated advancement operation.

## Acceptance checks

1. Source-derived fixtures cover all three colleges and six ability alternatives, +6 Stamina,
   floor(Stamina/3) recovery, floor(Stamina/2) winded, unchanged characteristics and eight Recoveries.
   Focused engine tests reject missing/wrong-college choices and wrong-category perks, revoke grants
   on a level decrease or college change, and retain independent earlier choices.
2. Authenticated `shadow-level-two` headless cohort creates at level two, resumes, lists/saves,
   reads persisted level/baseline/abilities, replaces college and lowers/restores target level.
   Prove owner-only transition, level-two action costs/manual records, and no immediate Sticky Bomb
   damage through public commands with persisted event/resource/target readback.
3. TESTER runs the affected authoring checks, required full `CI=true pnpm check`, content/report
   generation as needed, and the isolated headless cohort. Reuse unchanged accepted results.
4. Independent rules/implementation review against the cited sources. Browser cases are logged
   under the standing moratorium.

## Work log

- 2026-09-21: user requested the smallest next-level experiment, Shadow level two, plus target-level
  selection in the full wizard. Registered on `slice/V97` in `.worktrees/shadow-level-two` from
  main `02ce529`. Existing design already specifies full-level editing and scoped advancement.

- Author checks on the initial implementation: both TypeScript projects exit 0, touched ESLint exit 0,
  focused engine file 3/3 passed. TESTER generated 1221 content entries and V26/V72 reports (all exit 0;
  artifacts `/srv/presidium/projects/salient/test-artifacts/V97-1f580a0-generation`). Inspection found
  the audit's shared-ancestor traversal classified redundant college/class conditions as unknown;
  use the college dependency itself, which already requires Shadow, to describe reachability once.
  Added the six source-identified abilities to the existing audit allowance; prior hashes retained.

- TESTER `test-V97-71e665e-2` PASS (2026-09-21): `CI=true pnpm check` exit 0 in 180 seconds,
  971 tests. Isolated `SALIENT_HEADLESS_COHORT=shadow-level-two pnpm test:headless:character`
  exit 0 in 14.1 seconds: six complete builds, every new ability invoked with persisted costs,
  source-derived damage/manual remainders, target-level save/reload, owner refusal, college
  replacement, and effective-build separation. Backend stopped and ports released. Artifacts:
  `/srv/presidium/projects/salient/test-artifacts/V97-71e665e`. Codegen produced no source diff.
- Generated V26/V72 report correction from that job records all six level-two abilities as reachable
  compatibility entries: 15 compiled, 1295 compatibility, 2 structurally supported but unavailable.
  Existing compiled identities and prior audit hashes are unchanged. No automatic Shadow passive,
  teleport, illusion, delayed detonation, gas-zone or surge handling is claimed.
- ENGINE independently reviewed the rules and full implementation. Initial finding: invoke the
  three rolled ability alternatives as well as listing them; fixed in `71e665e`. Chords 1333
  confirms that finding resolved and no further code findings; final report review follows below.
