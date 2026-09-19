# V50: Dwarf level one

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | Ancestry implementer (Opus thread `88b6a7e6-2590-4c52-bdef-efe85bf82e74`) |
| Rules review | Required for the implementation commit; this preparation makes no certified rules claims |
| Depends on | V45 foundation (merged `ebe66e2`); V46 Devil pilot verdict gates implementation |
| Unblocks | Dwarf/Polder ancestry contrast for the class units |
| Status | Preparation in progress; see `STATUS.md` |

## Goal

Deliver the Dwarf ancestry at level one as one reviewed implementation commit: the Runic Carving
signature trait and all five purchased traits within the three-point budget, with same-build Forge
Steel counterparts and independently source-derived expectations. The boundary: no Dwarf content
above level one, no combat automation, and no change to existing Devil, Polder, Fury or Elementalist
behaviour.

**Preparation only.** No option is enabled, no reference has been captured, and no verification gate
has been met. Implementation waits for the V46 pilot verdict.

The complete source inventory is in
[the preparation research](../research/dwarf-level-one-preparation.md). This document carries the
delivery scope, the choice maps, the expectations and the acceptance checks.

## Current supported state

`ancestry.choice` serves all twelve core ancestries. Devil carries `supportedInV001: true` in the
pinned reference and `level-one-decisions.ts:43` calls `allow('ancestry.choice', ['Polder'])`, which
flips Polder's option flag at composition. **Dwarf remains `false`** — it is offered in the wizard
but rendered disabled as "not offered yet", and a headless selection of it is kept and flagged
`unsupported` rather than refused.

There is no `shared/content/ancestries/dwarf/` module and no `shared/evaluate/ancestries/dwarf.ts`.
Dwarf is genuinely new: **one ancestry, one signature trait with three rune options, and five
purchased traits.**

The count of newly selectable options depends on the unresolved rune question below. Five purchased
traits are certainly new. The three rune options are new **only if** a rune is a creation choice,
which the pinned source does not establish.

## Deliverables

| File | Change |
| --- | --- |
| `shared/content/ancestries/dwarf/level-one.ts` | New module: signature trait, purchased-trait decision with the three-point budget and per-trait costs and source paths |
| `shared/evaluate/ancestries/dwarf.ts` | New: size, speed, stability baseline; Grounded stability; Spark Off Your Skin Stamina with recovery/winded recomputation; Great Fortitude condition immunity; Stand Tough's potency-resistance value |
| `shared/content/level-one-decisions.ts` | One `allow('ancestry.choice', ['Dwarf'])` call — **requested from the integration owner**, as it is a shared composition file |
| Shared contract | A potency-resistance representation — **requested from the integration owner**; see below |
| `tests/fixtures/v50-dwarf/` | Three raw `.ds-hero` exports, sheets, capture metadata, hashes, normalized selections, derived expectations |
| `tests/character-v50-dwarf.test.ts` | Per-build comparison, the Stand Tough discriminating cases, ancestry-change removal, budget and duplicate cases |
| `tests/browser/v50-dwarf.spec.ts` | Wizard journey, source display, sheet rendering, persisted readback |
| `docs/build/V50-dwarf-level-one.md`, `docs/research/dwarf-level-one-preparation.md` | This document and its research |
| `docs/build/STATUS.md` | This unit's row only |

## Shared representation needs

### A. Stand Tough needs a potency-resistance value that is not the Might characteristic

`DerivedBaseline.characteristics` holds the Might score, which feeds power rolls, damage expressions
and the hero's own potency values. Stand Tough must not touch it. The build needs a **separate**
derived value used only on the target side of a potency comparison.

Forge reaches the same shape structurally, using a dedicated `createPotencyResistance` feature plus
a conditional `createRollModifier` edge rather than a Might bonus. That is corroboration of the
shape, not rules authority; the source wording is what settles it.

Requested from the integration owner: a narrow sourced field, for example
`potencyResistance?: { characteristic: Characteristic; value: DerivedValue<number>; provenance }[]`.
It must not be folded into `characteristics`, and — following the V48 finding that
`AbilityModifier.field` (`shared/contracts/characterEvaluation.ts:194`) has no runtime reader, so a
misplaced entry is forwarded into damage by `convex/lib/resolve.ts:577-586` with no type error — it
must not be placed anywhere that an automatic resolution path consumes without checking.

The edge half is conditional and table-adjudicated. It belongs in `conditionalEffects` or as
readable feature text, not as an automatic roll modifier.

### B. Spark Off Your Skin and the `amountOf` literal vocabulary

`shared/evaluate/character.ts:925-934` recognises a closed vocabulary that does **not** include a
six-per-echelon form, and `character.ts:966` silently skips an unrecognised literal with no
diagnostic. Independently, the trait text enumerates levels rather than echelons. Both point the
same way: represent this as a literal level-threshold value, not as an echelon string. This is the
same defect V48 records as its gap C; V48 is unmerged on `slice/V48`, so it is cited here by
code location rather than by link.

### C. Condition immunity has a precedent and needs none

Great Fortitude maps onto the existing `conditionImmunities` array, exactly as Polder's Fearless maps
`frightened`. No contract change.

### D. Ancestry baseline assignment

`shared/evaluate/ancestries/polder.ts` assigns `out.size`, `out.speed` and `out.stability`. The Dwarf
module follows that established shape with 1M / 5 / 0, adding Grounded's +1 to stability. Note the
V48 finding that a bare assignment to a **list** field clobbers earlier producers — `polder.ts:50-68`
assigns `damageImmunities` from `character.ts:1193`, and a later producer in the same method would
silently discard it. Size, speed and stability are scalars set by exactly one ancestry, so the
hazard does not apply to them — but `conditionImmunities` **is** a list, and Great Fortitude must
append rather than assign.

## Reference builds

Three builds are the minimum that covers all five purchased traits, and three is provably minimal
(the two two-point traits can never share a build; a build with a two-pointer covers at most two
traits). All three hold Bethell Corrected V25's class and background constant, so the ancestry
contribution is isolated.

### Constant selections, from the retained Bethell export

`culture.name` Polder, `culture.language` Khoursirian, `culture.environment` Urban / Alertness,
`culture.organization` Communal / Gymnastics, `culture.upbringing` Creative / Tailoring;
`career.choice` Mage's Apprentice with skills Monsters and Timescape, language The First Language,
perk Arcane Trick, inciting incident Forgotten Memories; `class.choice` Elementalist, array
`2, 1, 1, −1`, assignment Might −1 / Agility 1 / Intuition 2 / Presence 1, skills Alchemy,
Blacksmithing, History, `magic-replacement` Empathize, specialization Fire, Enchantment of
Destruction, Ward of Delightful Consequences, signatures Bifurcated Incineration and Viscous Fire,
3-essence The Flesh a Crucible, 5-essence Conflagration; no complication.

**Might is −1**, which makes the Stand Tough discriminating case live in a real paired build.

### The three builds

| # | Purchased traits | Points | Covers |
| ---: | --- | ---: | --- |
| D1 | Grounded + Stand Tough + Stone Singer | 3 | The only set exercising three traits at once |
| D2 | Great Fortitude + Stone Singer | 3 | Great Fortitude |
| D3 | Spark Off Your Skin + Grounded | 3 | Spark Off Your Skin; this is the **printed quick build** |

### Independently derived expectations

Bethell's verified Polder baseline, for comparison: size 1S, speed 5, stability 0, disengage 2,
Stamina 18, recovery value 6, winded 9, `damageImmunities` corruption 3, `conditionImmunities`
frightened.

| Value | D1 | D2 | D3 |
| --- | --- | --- | --- |
| size | 1M | 1M | 1M |
| speed | 5 | 5 | 5 |
| stability | **1** (Grounded) | 0 | **1** (Grounded) |
| disengage | **1** | **1** | **1** |
| Stamina | 18 | 18 | **24** |
| recovery value | 6 | 6 | **8** (⌊24/3⌋) |
| winded | 9 | 9 | **12** (⌊24/2⌋) |
| `damageImmunities` | none | none | none |
| `conditionImmunities` | none | **weakened** | none |
| potency-resist Might | **0** (Might −1, +1) | absent | absent |
| skills, languages, perks, class grants | identical to Bethell in all three | | |

Disengage is 1 in every build: the no-kit base is 1 and Graceful Retreat, which gives Bethell its 2,
is a Polder trait that the dwarf does not have. That drop is a required removal check, not a
regression.

## Acceptance checks

The eight gates in [V44](V44-character-option-delivery.md#acceptance-checks) apply unchanged.
Unit-specific additions:

1. All five purchased traits appear in at least one completed same-build Forge counterpart, per the
   three builds above. Whether the three rune options require witnesses depends on the rune question.
2. **The Stand Tough discriminating cases.** With Might −1 and Stand Tough: an ability with potency
   `M < 1` still applies, and an ability with potency `M < 0` does **not**. Both must be asserted.
   An implementation modelling the trait as "+1 Might" passes the second and fails the first.
3. Stand Tough leaves the Might characteristic, Might-based damage expressions, and the hero's own
   weak/average/strong potency values byte-identical to the same build without it.
4. A four-point combination (Great Fortitude plus Spark Off Your Skin) is refused; a three-point
   combination is accepted; the same trait cannot be taken twice.
5. Changing ancestry from Polder to Dwarf removes Shadowmeld, Small!, corruption immunity, the
   frightened immunity and the Graceful Retreat disengage bonus, sets size 1M, and preserves the
   culture, career, class and authored details unchanged. Changing back restores them.
6. Great Fortitude's `weakened` entry **appends** to `conditionImmunities` rather than replacing it,
   verified on a build that already has another source of condition immunity.
7. Spark Off Your Skin's +6 recomputes recovery value to 8 and winded to 12; neither is cached from
   the pre-trait Stamina.
8. Existing Devil, Polder, Fury and Elementalist builds, and Fury 1→2 advancement, are unchanged.

## Out of scope

Dwarf content above level one. Rune activation, the 10-minute carving activity, Detection's glow,
Light's illumination and Voice's telepathy, all of which are table-resolved. Stone Singer's terrain
reshaping. Equipment and treasure modelling. Import/export adapters. Any change to Devil, Polder,
Fury or Elementalist behaviour beyond the shared additions named above.

## Open questions

**Q-CHAR-18 — is a Dwarf's rune chosen at character creation?** The pinned source describes carving
as a 10-minute in-play activity that can be changed or removed, never says a hero begins play with a
rune, and gives the Dwarf a quick build that names no rune despite the book's stated convention that
every 1st-level option carries one. Forge models it as a build-time choice, but Forge is not rules
authority. **This shapes the implementation**: under the play-time reading the unit delivers five new
options and a readable capability; under the creation reading it delivers eight and needs a decision
row with a nested open-ended Detection sub-choice. Recorded in
[the questions file](../rules-questions-for-user.md). Until it is answered the unit implements the
five purchased traits and grants Runic Carving as a readable capability, which is correct under both
readings, and does **not** invent a wizard decision.

Four narrower questions are also recorded there and none blocks level-one work: whether Great
Fortitude prevents a hero self-applying weakened as an ability cost; what counts as an
"environmental effect" for Stand Tough's edge; whether a Might +5 dwarf's potency-resist value is 6
or clamps at 5; and whether underspending the three ancestry points is permitted.

## Work log

2026-09-19: claimed V50 preparation on `slice/V50` in `/srv/presidium/projects/salient/opus-dwarf`,
cut from main `9de2dda`, per Chords assignment 249. Read the pinned ancestry entry, all seven trait
files, the book section, the size/speed, stability, potency, edge, recoveries and weakened rules, the
ancestries and making-a-hero chapters, and the Forge structure via `git show` without touching the
pin or the sparse configuration.

A blind independent Compendium-only derivation ran in parallel, barred from Forge and from this
document, with the rune-timing question as its most weighted item. It reached the same conclusion —
unresolved, describing an in-play activity — and supplied the exhaustive-absence evidence, the
Quick Build convention argument, the Stand Tough discriminating table and the minimal-cover proof.
Its load-bearing claims were verified directly against the pin before being recorded here.

No application, evaluator, contract or vendor file was changed; no option is enabled; no reference
has been captured and no verification has been run. Nothing ran on CT114 and no dependency, build,
server or browser workload ran anywhere.
