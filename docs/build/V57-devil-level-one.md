# V57: Complete Devil level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team |
| Rules review | required |
| Depends on | V45 |
| Unblocks | Complete ancestry level-one coverage |
| Status | see `STATUS.md` |

## Goal

Offer every Devil level-one ancestry choice, with sourced grants and permanent values, using the
existing wizard/evaluator foundation. Conditional gameplay effects remain readable manual rules.

## Spec references

- `docs/character-wizard-spec.md#3-decision-system` — availability, validity and grants.
- `docs/character-wizard-spec.md#4-wizard-flows` — saved editor choices and parent replacement.
- `docs/character-wizard-spec.md#8-content-and-forge-steel-compatibility` — same-build comparisons.
- `docs/build/V44-character-option-delivery.md#goal-and-scope` — complete option units.

## In scope

- All thirteen Silver Tongue interpersonal skill choices; existing collision rules apply.
- All seven Devil purchased traits within three ancestry points.
- Existing Beast Legs speed and Impressive Horns save contributions; readable conditional effects.
- Focused editor persistence, parent replacement and authentic Forge counterparts.

## Out of scope

Combat automation, flight tracking, ancestry/class expansion beyond Devil, source-pin changes, and
all rejected Opus material. Existing ancestry effects do not need a new evaluation framework.

## Inputs and dependencies

Current main `6459c8d`, V45 modules and existing V25/V45 reference helpers are real dependencies.
Compendium pin `fb83a789da8f0327a389c277a0c790b1648d5810`; Forge pin
`5a846aadb623a9855a023e9403bb887a956c341f`. No stubs. Runtime belongs to the lead on CT114.

## Deliverables

- `shared/content/ancestries/devil/level-one.ts`: complete support allowlists, stable decision IDs.
- `tests/character-v57-devil.test.ts`: source-derived legal skill/trait and replacement cases.
- `tests/browser/v57-devil.spec.ts`: actual saved/reopened new choices and conditional source text.
- This source acceptance record and retained V57 reference/runtime evidence when captured.

## Acceptance checks

1. All thirteen interpersonal skills appear enabled and grant exactly once; an existing culture
   skill collision still fails. Run the focused V57 evaluator test on CT114.
2. Legal full-budget trait combinations below complete with the listed speed/save. Mountain yields
   stability 2 and ancestry size 1M. Wings adds no unconditional weakness. Wings + Prehensile Tail
   costs four and fails the budget. Run the same evaluator test.
3. Change a Devil with Wings/Barbed Tail/Lie to Polder: prune both Devil selections, remove its
   traits/skill, retain Mountain and unrelated choices. Run the same evaluator test.
4. Browser chooses Read Person/Wings/Barbed Tail, opens readable Wings limitations, saves, reads
   persisted selections through `characters:get`, reloads and sees the same choices. Run
   `pnpm test:browser tests/browser/v57-devil.spec.ts`; retain `.playtest/v57` artifacts.
5. Every new option has a legal complete Forge build with identical Salient choices and actual
   persisted Salient readback. The witness plan below is pending capture, not a parity claim.
6. Full `pnpm check`, full browser suite, independent implementation review, fresh rules review,
   and shared-app update/changed-feature verification pass before delivery.

## Ability design and playtest evidence

Not applicable: no parser/engine ability execution changes. Readable manual trait effects are
verified through the editor source popup and same-build sheet comparison.

## Rules research

Read directly from the pinned Compendium before evaluating candidates. All following paths are
relative to `vendor/steel-compendium/en/unified/md/`.

| Source | Independent expected behavior |
| --- | --- |
| `feature/trait/devil/devil-traits.md` | Three points; quick build Beast Legs + Impressive Horns. |
| `feature/trait/devil/silver-tongue.md` | One interpersonal skill; negotiation motivation/pitfall discovery tests gain an edge. Edge stays manual. |
| `skill/group/interpersonal.md` | Brag, Empathize, Flirt, Gamble, Handle Animals, Interrogate, Intimidate, Lead, Lie, Music, Perform, Persuade, Read Person. |
| `feature/trait/devil/barbed-tail.md` | Cost 1; once per round extra melee strike damage equal to highest characteristic. Manual. |
| `feature/trait/devil/beast-legs.md` | Cost 1; speed 6 before kit contribution. |
| `feature/trait/devil/glowing-eyes.md` | Cost 1; triggered action after creature damages you, deal that creature 1d10 + level psychic damage. Manual. |
| `feature/trait/devil/hellsight.md` | Cost 1; no bane on strikes against creatures with concealment. Manual. |
| `feature/trait/devil/impressive-horns.md` | Cost 2; saving throws succeed on 5+. |
| `feature/trait/devil/prehensile-tail.md` | Cost 2; cannot be flanked. Manual. |
| `feature/trait/devil/wings.md` | Cost 2; flight for Might rounds, minimum one, then fall. While flying at level 3 or lower, damage weakness 5. Conditional, never unconditional baseline weakness. |

Base statistics come from `en/books/heroes/clean/Draw Steel Heroes.md`: size 1M, speed 5,
stability 0. Existing Mountain kit contributes stability 2 and no speed. Normal saving throws
succeed on 6+. Existing V25 fixture records the unchanged complete Berserker Fury/Soldier build.

### Option-to-witness plan

Every fresh witness uses the existing Grug level-one build with Martial upbringing skill changed
from Intimidate to Ride, avoiding a duplicate when Silver Tongue chooses Intimidate. Fill the
previously open Soldier language with High Kuric; retain Vaslorian and culture Anjali. Soldier
grants two languages (`career/soldier.md`), and the clean Heroes Languages by Ancestry table lists
High Kuric as a living language. All other non-ancestry selections stay identical. Twelve new witnesses cover twelve newly offered skills;
compatible trait choices share those builds. Capture owner retains actual exports and rendered
sheets; exports must be created through Forge, not constructed by editing JSON.

| Silver Tongue skill | Purchased traits | Speed / save | Witness state |
| --- | --- | --- | --- |
| Brag | Barbed Tail, Glowing Eyes, Hellsight | 5 / 6 | Pending |
| Empathize | Prehensile Tail, Beast Legs | 6 / 6 | Pending |
| Flirt | Wings, Beast Legs | 6 / 6 | Pending |
| Gamble, Handle Animals, Interrogate, Intimidate, Lead, Lie, Music, Perform, Read Person (one build each) | Beast Legs, Impressive Horns | 6 / 5 | Pending |
| Persuade | Beast Legs, Impressive Horns; original Intimidate upbringing | 6 / 5 | Existing V45 Grug level-one export and sheet; unchanged case |

## Open questions

None. No source ambiguity identified.

## Work log

- 2026-09-19: Claimed Devil level one on `slice/V57` in
  `/srv/presidium/projects/salient/astra-devil`, from main `6459c8d`. Lead owns shared contracts,
  tracker, integration and CT114 runtime. No evaluator changes are required: existing sourced
  trait grants and numeric contributions already handle these choices. Changed only support
  declarations and focused coverage. Every new test describes its distinct failure and added
  coverage. Source expectations above were written from pinned entries before runtime evaluation.
- 2026-09-19: Candidate implementation written; all verification, authentic fresh counterparts,
  persisted complete same-build readbacks and reviews remain pending. No runtime command or commit
  has been run by this implementer. Handoff is an uncommitted branch candidate, not delivered.

- Lead checkpoint: paused under the user's anti-spiral instruction after V58's unrelated-path
  full-browser failure (closeout app query timeout1s). V57 remains a source-backed code candidate
  only: no runtime tests, authentic new Forge exports, formal reviews, main merge or rollout.
  Fresh helper scripts are retained in `/tmp/astra-v57-witnesses` and `/tmp/astra-forge-capture`;
  they are preparation, not evidence. CT114 `character-restart` was stopped with data retained.
