# V94: Tactician level one

Rules review: required. Depends on: None (V92 class primitives are on main).

## Goal

A complete, selectable level-one Tactician in the shared wizard: all three doctrines with their
skill choice, feature and triggered action, the Lead grant and two-skill choice, the 3-Focus and
5-Focus ability choices, Mark and "Strike Now!", the Focus resource and the derived baseline, saved
and read back through the public character operations. The new mechanic is Field Arsenal: two
ordinary kits, both signature abilities, and an explicit per-benefit choice wherever both kits grant
the same benefit. The boundary is the editor and sheet: Focus gains, mark effects, surges, Recovery
spending and signature-ability damage rewrites stay readable manual text; no table automation.

## Scope

Compendium read (pin `fb83a789da8f0327a389c277a0c790b1648d5810`): `en/unified/md/class/tactician.md`
(Basics, Tactician Advancement Table), `en/unified/md/feature/tactician/level-1/*.md` (thirteen
files) and `en/unified/md/feature/ability/tactician/level-1/*.md` (thirteen abilities),
`en/unified/md/chapter/kits.md` (intro, Kit Signature Ability), `en/unified/md/chapter/making-a-hero.md`
(duplicate-skill rule).

Mechanical claims, each cited to those files:

- Basics: Might 2 and Reason 2 fixed; one array for Agility, Intuition, Presence from `2, −1, −1`,
  `1, 1, −1`, `1, 0, 0`; Stamina 21 at level one; Recoveries 10; potency from Reason (weak R − 2,
  average R − 1, strong R); skill Lead, then two from Alertness, Architecture, Blacksmithing, Brag,
  Culture, Empathize, Fletching, Mechanics, Monsters, Search, Strategy or the exploration group.
- Tactical Doctrine (`tactical-doctrine.md`): subclass; each doctrine grants a skill chosen from a
  group: Insurgent → intrigue, Mastermind → lore, Vanguard → interpersonal.
- Doctrine feature (`1st-level-doctrine-feature.md`): Covert Operations / Studied Commander /
  Commanding Presence. All three are prose features with no new discrete action.
- Doctrine triggered action (`doctrine-triggered-action.md`): Advanced Tactics / Overwatch / Parry,
  each free of base cost with an optional Spend 1 Focus effect.
- Focus (`focus.md`): heroic resource named focus; starting value 0 at creation; outside combat
  abilities that cost focus are used without spending it, once per Victory or respite.
- Mark (`mark.md` + `feature/ability/.../mark.md`) and "Strike Now!" (`strike-now.md`): class
  abilities granted to every Tactician (maneuver; main action with Spend 5 Focus).
- Tactician Abilities (`tactician-abilities.md`, `5-focus-ability.md`): one 3-Focus (Battle Cry,
  Concussive Strike, Inspiring Strike, Squad! Forward!) and one 5-Focus (Hammer and Anvil, Mind Game,
  Now!, This Is What We Planned For). No class signature choice: signatures come from the kits.
  Membership is taken from each ability's `cost` field and the absence of a `subclass` field;
  WIZARD.2 verifies this inventory against the clean Heroes text.
- Field Arsenal (`field-arsenal.md`, `kit-signature-ability.md`): two ordinary kits, both signature
  abilities usable at will. "If both kits grant you the same benefit, you take one or the other and
  can't change your choice until you finish a respite." A benefit is one of the kit bonus columns
  (Stamina, stability, speed, melee damage, ranged damage, melee distance, ranged distance,
  disengage). A benefit only one kit grants is taken from that kit. When both grant it with equal
  values the value is taken once and no choice is needed. When both grant it with different values
  the player chooses the kit, whole tuple for damage bonuses (contracts spec: never tier by tier).
  The losing kit's signature ability keeps its printed numbers and shows the source's subtraction /
  reapplication as a readable adjustment (Battle Grace 5/8/11 − 2/2/2 + 0/0/4 = 3/6/13); applying
  that adjustment in rolls is engine-track work, recorded here as residue.

Design (decision ids are stable once merged):

| Decision | Kind | Content |
| --- | --- | --- |
| `class.tactician.fixed-characteristics` | automatic | Might 2, Reason 2 |
| `class.tactician.characteristic-array` | single | the three arrays above |
| `class.tactician.array-assignment` | assignment | targets Agility, Intuition, Presence |
| `class.tactician.baseline` | automatic | Stamina 21, Recoveries 10, potency Reason |
| `class.tactician.skills.fixed` | automatic | skill grant Lead |
| `class.tactician.skills` | multi 2, `optionsByParent.Tactician` = the eleven named skills + exploration pool | duplicates of Lead / doctrine skill rejected by the chosen-skill rule |
| `class.tactician.features` | automatic | class-feature grants Tactical Doctrine, Focus, Doctrine Feature, Doctrine Triggered Action, Field Arsenal, Kit Signature Ability, Mark, Strike Now, Tactician Abilities; class-ability grants Mark, "Strike Now!" |
| `class.tactician.doctrine` | single | Insurgent / Mastermind / Vanguard, each with its class-feature grant and aspect-ability (triggered) grant |
| `class.tactician.doctrine-skill` | single, `dependsOn` doctrine, `optionsByParent` Insurgent → intrigue, Mastermind → lore, Vanguard → interpersonal | the doctrine's granted skill |
| `class.tactician.ability-3`, `class.tactician.ability-5` | single | options carry `abilityKind: 'heroic'` and `costQuote` (`cost: 3 Focus`, `cost: 5 Focus`) |
| `kit.choice` | existing | gains a Tactician parent sourced from `field-arsenal.md` over `pool.kits.standard` |
| `class.tactician.second-kit` | single from `pool.kits.standard`, available for Tactician | must differ from `kit.choice` (`duplicate-kit` diagnostic) |
| `class.tactician.arsenal.<benefit>` (eight decisions) | single, options = the two chosen kits | available only when both kits grant that benefit with different values |

Class profile: `fixedCharacteristics { Might: 2, Reason: 2 }`, `potencyCharacteristic 'R'`,
`resource 'focus'`, `kit: 'required'`, subclass decision `class.tactician.doctrine`.

Shared changes owned by the lead, each a focused commit before the content commit:

1. Resource union gains `'focus'` (evaluation contract, class profile, `parseCost`, outside-combat
   waiver citing `feature/tactician/level-1/focus.md`).
2. Second kit and arsenal merge in a new `shared/evaluate/classes/tactician.ts`: the evaluator
   computes `KitContributions` for each kit, exposes them as `baseline.kits` (additive, per kit,
   printed values) and sets `baseline.kit` to the merged Field Arsenal contributions so every
   existing consumer (Stamina, speed, stability, disengage, `ActorRollFacts` damage and distance
   bonuses, ancestry speed) reads the resolved values unchanged. Provenance of a merged value cites
   the Field Arsenal sentence plus the supplying kit's entry, and the arsenal decision when one was
   made. Both kit signature abilities are granted with `kitBonusesIncluded: true`; a losing kit's
   signature carries a readable `kitBonusReplacement` record (benefit, from kit, to kit, source).
3. Arsenal decision availability: a `Decision.overlapBenefit` field; `structure.ts` and the
   evaluator treat such a decision as available only when `kit.choice` and
   `class.tactician.second-kit` are both valid and their printed values for that benefit differ.
   Options are validated against the two chosen kits. Fury, Shadow and Elementalist are unchanged.

Out of scope: Focus gains, mark bookkeeping, surges, signature damage rewrites in rolls, level two
and above, any other class. Spec sections: `docs/character-wizard-spec.md#3-decision-system`,
`docs/v1-character-wizard-contracts.md#level-one-class-decisions` (Tactician rows),
`docs/v1-character-wizard-contracts.md#kits-and-signature-abilities`.

## Acceptance checks

1. Focused test `tests/character-v94-tactician.test.ts`: a complete Tactician for each doctrine
   evaluates `complete` with expected values derived by WIZARD.2 from the source
   (`tests/fixtures/v94-tactician-expected.json`: characteristics from a chosen array, Stamina 21 +
   the arsenal Stamina bonus, Recoveries 10, potency from Reason, disengage, speed and stability with
   the arsenal, skills Lead + doctrine skill + two chosen, abilities: Mark, "Strike Now!", one 3-Focus,
   one 5-Focus, doctrine triggered action, both kit signatures, free strikes). Witnesses cover the
   source's own Shining Armor + Sniper example (no overlap), an overlapping pair with a differing
   benefit chosen each way, and a pair with an equal overlapping benefit.
2. Same file: a third chosen skill, a skill outside the printed list, Lead chosen again, the same kit
   twice, a missing second kit, an arsenal choice naming a kit not chosen, and a missing arsenal
   choice on a differing benefit each produce the diagnosed status and no baseline.
3. Same file: replacing the doctrine revokes the old doctrine's skill, feature and triggered action
   and keeps unrelated choices; replacing the first kit clears arsenal choices that no longer apply;
   replacing class Tactician → Elementalist clears both kits and the Tactician decisions.
4. App test `tests/app/tactician-character.test.ts`: create, save and reload a Tactician through
   the public character operations; the persisted evaluation, sheet abilities (`cost.resource ===
   'focus'`, amounts 3 and 5, two kit signatures) and live state resource name `focus` with current 0
   are read back; the merged melee and ranged damage bonuses reach `actorRollFacts`.
5. Headless journey in `scripts/headless/character-scenarios.ts`: authenticated create → doctrine
   replacement → save → readback for a Tactician; command and exit status recorded in the work log.
6. Forge counterparts (WIZARD.2): one legal completed Forge Tactician per doctrine through
   `scripts/forge`, compared against saved Salient readbacks; every level-one ability, each of the
   three arrays and an overlapping kit pair appear in at least one witness; discrepancies explained
   against the Compendium (Forge's handling of overlapping kit bonuses is expected to differ).
7. TESTER: `CI=true pnpm check` on the frozen candidate passes; one Chords return.
8. Fresh-context rules review of the content module and the arsenal evaluator against the cited
   files: `pass`.

## Work log

- 2026-09-20: registered by the Fable lead (thread `42fc2429`). Worktree `.worktrees/class-tactician`,
  branch `slice/V94` from main `73d012f`. Design above; WIZARD.2 (`f8b014d3`) owns source inventory
  verification (`docs/build/audits/V94-tactician-source-inventory.md`), the independent expected
  values, Forge witnesses (`scripts/forge/tactician-witnesses.ts`) and the rules review; the lead owns
  the shared changes, the content module, tests and integration handoff. TESTER runs the check.
