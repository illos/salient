# V92: Shadow level one

Rules review: required. Depends on: None (V45 foundation, V83 ordinary kits and V85 replacement
choices are on main).

## Goal

A complete, selectable level-one Shadow in the shared wizard: all three colleges, every level-one
ability choice, the Shadow's own skill grant and five-skill choice, its ordinary kit, its Insight
resource and the derived baseline, saved and read back through the public character operations.
The boundary is the editor and sheet: Insight gains during combat, edge-based cost reduction,
teleports, surges and illusion effects stay readable manual text; no table automation is added.
Third class after Fury and Elementalist; first class whose kit is granted by the class itself
rather than by a subclass.

## Scope

Compendium read (pin `fb83a789da8f0327a389c277a0c790b1648d5810`):
`en/unified/md/class/shadow.md` (Basics, Shadow Advancement Table),
`en/unified/md/feature/shadow/level-1/*.md` (eleven files) and
`en/unified/md/feature/ability/shadow/level-1/*.md` (nineteen abilities), `en/unified/md/chapter/kits.md`
(intro: shadows use kits), `en/unified/md/chapter/making-a-hero.md` (duplicate-skill rule).

Mechanical claims, each cited to those files:

- Basics: Agility 2 fixed; one array for Might, Reason, Intuition, Presence from `2, 2, −1, −1`,
  `2, 1, 1, −1`, `2, 1, 0, 0`, `1, 1, 1, 0`; Stamina 18 at level one; Recoveries 8; potency from
  Agility (weak A − 2, average A − 1, strong A); skills Hide and Sneak, then five from Criminal
  Underworld or the exploration, interpersonal or intrigue groups.
- Kit (`feature/shadow/level-1/kit.md`): "You can use and gain the benefits of a kit." Ordinary kits
  only; the stormwight split from Q-R-103 is an interpretation carried forward (stormwight kits are
  granted by Beast Shape, not by a generic Kit feature). Stamina, speed, stability, disengage and
  damage/distance bonuses come from the chosen kit exactly as for the Fury.
- Shadow College (`shadow-college.md`): subclass; Black Ash grants Magic, Caustic Alchemy grants
  Alchemy, Harlequin Mask grants Lie.
- College features (`1st-level-college-features.md`): Black Ash → Black Ash Teleport (maneuver);
  Caustic Alchemy → Coat the Blade (maneuver) and Smoke Bomb (feature modifying the Hide maneuver,
  no new discrete action); Harlequin Mask → I'm No Threat (maneuver).
- College triggered action (`college-triggered-action.md`): In All This Confusion / Defensive Roll /
  Clever Trick (1 Insight).
- Hesitation Is Weakness: free triggered action, 1 Insight, granted to every Shadow.
- Insight (`insight.md`): heroic resource named insight; starting value 0 at creation; outside
  combat abilities that cost insight are used without spending it, once per Victory or respite.
- Shadow Abilities (`shadow-abilities.md`): one signature (Gasping in Pain, I Work Better Alone,
  Teamwork Has Its Place, You Were Watching the Wrong One); one 3-Insight (Disorienting Strike,
  Eviscerate, Get In Get Out, Two Throats at Once); one 5-Insight (Coup de Grace, One Hundred
  Throats, Setup, Shadowstrike). Membership is taken from each ability's `cost` field and the
  absence of a `subclass` field; WIZARD.2 verifies this inventory against the clean Heroes text.

Design (decision ids are stable once merged):

| Decision | Kind | Content |
| --- | --- | --- |
| `class.shadow.fixed-characteristics` | automatic | Agility 2 |
| `class.shadow.characteristic-array` | single | the four arrays above |
| `class.shadow.array-assignment` | assignment | targets Might, Reason, Intuition, Presence |
| `class.shadow.baseline` | automatic | Stamina 18, Recoveries 8, potency Agility |
| `class.shadow.skills.fixed` | automatic | skill grants Hide, Sneak |
| `class.shadow.skills` | multi 5, `dependsOn` `class.choice`, `optionsByParent.Shadow` = `values: [Criminal Underworld]` + exploration, interpersonal, intrigue pools | duplicates of Hide/Sneak/college skill are already rejected by the evaluator's chosen-skill rule |
| `class.shadow.features` | automatic | class-feature grants Shadow College, Insight, College Features, College Triggered Action, Kit, Shadow Abilities; class-ability grant Hesitation Is Weakness |
| `class.shadow.college` | single | Black Ash / Caustic Alchemy / Harlequin Mask, each with its skill grant, class-ability grant(s), class-feature grant (Smoke Bomb) and aspect-ability (triggered) grant |
| `class.shadow.signature-ability`, `class.shadow.ability-3`, `class.shadow.ability-5` | single | options carry `abilityKind` and `costQuote` (`cost: 3 Insight`, `cost: 5 Insight`) |
| `kit.choice` | existing | gains a Shadow parent (see shared changes) |

Class profile: `fixedCharacteristics { Agility: 2 }`, `potencyCharacteristic 'A'`, `resource 'insight'`,
`kit: 'required'`, subclass decision `class.shadow.college`.

Shared changes owned by the lead, each a focused commit before the content commit:

1. Kit parent generalisation. `Decision.dependsOnAny?: string[]`: available when at least one listed
   parent is available and chosen with a value that has an `optionsByParent` entry; `dependsOn` keeps
   its AND meaning. The satisfying parent supplies the pool, the missing-choice sentence and pruning.
   `kit.choice` moves from `dependsOn: ['class.fury.aspect']` to
   `dependsOnAny: ['class.fury.aspect', 'class.choice']` with `optionsByParent.Shadow` sourced from
   `feature/shadow/level-1/kit.md` over `pool.kits.standard`. Fury and Elementalist behaviour is
   unchanged (Elementalist has no entry, so the kit step stays "no kit").
2. Profile vitals for `kit: 'required'` classes other than Fury: Stamina = class starting Stamina +
   kit Stamina bonus × echelon, provenance base + kit entry as in `applyFuryVitals`; recovery and
   winded values follow. No kit → no Stamina, evaluation incomplete with the Kit feature sentence.
3. Resource union: `'ferocity' | 'essence' | 'insight'` in the evaluation contract, class profile,
   `parseCost` and the outside-combat waiver in `shared/resolve` (warning cites
   `feature/shadow/level-1/insight.md`). Live ability costs already carry the resource as a string.

Out of scope: Insight gains (1d3 per turn, surge damage), edge cost reduction, level two and above,
any other class. Spec sections: `docs/character-wizard-spec.md#3-decision-system`,
`docs/v1-character-wizard-contracts.md#level-one-class-decisions` (Shadow rows), `docs/build/V44-character-option-delivery.md`.

## Acceptance checks

1. Focused test `tests/character-v92-shadow.test.ts`: a complete Shadow for each college evaluates
   `complete` with expected values derived by WIZARD.2 from the source (characteristics from a chosen
   array, Stamina 18 + kit, Recoveries 8, potency from Agility, disengage, speed and stability with
   the kit, skills Hide + Sneak + college skill + five chosen, abilities: one signature, one 3-Insight,
   one 5-Insight, Hesitation Is Weakness, college maneuver(s), college triggered action, kit signature,
   free strikes). Read back from `evaluateCharacter` output.
2. Same file: a sixth chosen skill, a lore skill other than Criminal Underworld, Hide chosen again,
   a missing kit, and a Fury array value each produce the diagnosed status and no baseline.
3. Same file: replacing the college revokes the old college's skill, features and abilities and keeps
   unrelated choices; replacing class Shadow → Elementalist clears the kit and the Shadow decisions.
4. App test `tests/app/shadow-character.test.ts`: create, save and reload a Shadow through the public
   character operations; the persisted evaluation, sheet abilities (with `cost.resource === 'insight'`
   and amounts 3 and 5) and live state resource name `insight` with current 0 are read back; the kit
   melee bonus reaches `actorRollFacts`.
5. Headless journey in `scripts/headless/character-scenarios.ts`: authenticated create → college
   replacement → save → readback for a Shadow; command and exit status recorded in the work log.
6. Forge counterparts (WIZARD.2): one legal completed Forge Shadow per college through
   `scripts/forge`, compared against saved Salient readbacks; every level-one ability and each of
   the four arrays appears in at least one witness; discrepancies explained against the Compendium.
7. TESTER: `CI=true pnpm check` on the frozen candidate passes; one Chords return.
8. Fresh-context rules review of the content module against the cited files: `pass`.

## Work log

- 2026-09-20: registered by the Fable lead (thread `42fc2429`). Worktree `.worktrees/class-shadow`,
  branch `slice/V92` from main `0352664`. Design above; WIZARD.2 (`f8b014d3`) owns source inventory
  verification, independent expected values, Forge witnesses and the rules review; the lead owns the
  shared changes, the content module, tests and integration handoff. TESTER runs the check.
