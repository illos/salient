# Human level-one implementation preparation

Prepared 2026-09-19 for the V53 unit under the
[V44 delivery plan](../build/V44-character-option-delivery.md). Research and a proposed
implementation plan only: it enables no option, changes no evaluator and certifies nothing. See
[the slice](../build/V53-human-level-one.md).

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`. Neither pin was
changed, no vendor file was modified, and no online source was consulted. The researcher did not
read `vendor/forge-steel` at all, so no value here is derived from Forge.

## What makes this unit unusual

**Exactly one Human trait produces a number a sheet computes.** Staying Power increases Recoveries by
2. Every other Human option is conditional, triggered or applied at roll time. A Human who buys
Can't Take Hold and Determination has **identical derived statistics** to a Human who buys nothing.

That shapes the whole unit: a test that diffs derived values between a no-trait build and a
two-trait build would see nothing and pass while the traits were entirely missing. The acceptance
checks must assert the *presence of readable entitlements*, not only the absence of numeric drift.

## Baseline

| Value | Source | Note |
| --- | --- | --- |
| Size 1M, speed 5, stability 0 | [Starting Size and Speed](../../vendor/steel-compendium/en/unified/md/rule/character/speed.md) | Human's own record carries no size, speed or stability field; the baseline must come from the rule file |
| No cultural benefits from ancestry | [Ancestries](../../vendor/steel-compendium/en/unified/md/chapter/ancestries.md) — "This choice doesn't grant you cultural benefits, such as crafting or lore skills, though." | Narrower than "ancestries never grant skills": Devil's Silver Tongue does grant one. True for Human, which grants none |

No Human trait changes size, speed or stability.

**A correction for an existing module, stated precisely.** `shared/content/ancestries/devil/level-one.ts`
carries the note "Absent from en/unified/md/chapter/ancestries.md; present only in the clean Heroes
text." Its **second** half is wrong: the sentence appears in many files including
`rule/character/speed.md`, which is what `SENTENCES.baseStatistics` already cites. Its first half is
right as written, scoped to `en/unified/md/` — the sentence *is* present in the `md-linked` variant
of that chapter, so the scope matters. This is also not a new observation; it is already recorded in
`docs/fury-level-one-decisions.md` and `docs/hero-fixture.md`. The Human module must not copy the
note; correcting Devil's belongs to whoever owns that module.

## Signature trait

One, and the ancestry record's `signature_trait_name` is **correct** here — verified against the
`#### Signature Trait:` headings in
[the linked ancestries chapter](../../vendor/steel-compendium/en/unified/md-linked/chapter/ancestries.md)
(line 1132) and the printed book at `en/books/heroes/clean/Draw Steel Heroes.md:2379`, which between
them contain exactly one such heading for Human. Corrected 2026-09-19: an earlier draft cited "the
printed Human Traits section", but `feature/trait/human/human-traits.md` carries only the
`#### Purchased Human Traits` heading, and the unified `chapter/ancestries.md` stops before the
per-ancestry sections. Those two paths are the citable ones. That field was wrong for Polder, which has two signature
traits; this unit does not inherit that defect, but the headings remain the authority, not the field.

[Detect the Supernatural](../../vendor/steel-compendium/en/unified/md/feature/trait/human/detect-the-supernatural.md)
is a maneuver after which, until the end of your next turn, you know the location of any
**supernatural object**, or any **undead, construct, or creature from another world**, within 5
squares, even without line of effect, and you know whether you are detecting an item or a creature
and the nature of any creature detected. Note the asymmetry, corrected 2026-09-19 after audit: only
*objects* are keyed to "supernatural"; the creature clause is a closed list of three kinds. An
earlier draft here said "supernatural objects and creatures", which would broaden the trait for
anyone writing readable content from this summary. It contributes **no** build number; the 5 squares
is a range inside a conditional action.

**Implementation trap:** it has **no `cost` key**, unlike every purchased trait. A loader that
iterates "traits with a cost" drops the signature trait silently. It also lives under
`feature/trait/human/`, not `feature/ability/human/` — Human grants no formatted ability statblock,
unlike Polder's Shadowmeld.

## The 3-point budget and five purchased traits

"You have 3 ancestry points to spend on the following traits. (*Quick Build:* Perseverance, Staying
Power.)" Total available cost is 7 against a budget of 3, so at most a subset is reachable.

| Trait | Cost | Effect | Classification |
| --- | ---: | --- | --- |
| [Can't Take Hold](../../vendor/steel-compendium/en/unified/md/feature/trait/human/cant-take-hold.md) | 1 | Ignores *temporary* difficult terrain created by magic and psionic abilities; when force moved **by a magic or psionic ability**, may reduce the distance by 1 | Conditional, **and it states a number** |
| [Determination](../../vendor/steel-compendium/en/unified/md/feature/trait/human/determination.md) | 2 | While frightened, slowed or weakened, a maneuver immediately ends one of those conditions | Conditional, no number |
| [Perseverance](../../vendor/steel-compendium/en/unified/md/feature/trait/human/perseverance.md) | 1 | An edge on Endurance tests; while slowed, speed is 3 instead of 2 | Split: a roll-time entitlement **and** a conditional number |
| [Resist the Unnatural](../../vendor/steel-compendium/en/unified/md/feature/trait/human/resist-the-unnatural.md) | 1 | On taking damage that is not untyped, a triggered action halves it | Conditional, **and it states a number** |
| [Staying Power](../../vendor/steel-compendium/en/unified/md/feature/trait/human/staying-power.md) | 2 | "You increase your number of Recoveries by 2." | **Computed build value — the only one** |

**Three** of these state numbers under conditions — Can't Take Hold's reduction of 1, Perseverance's
slowed value of 3, and Resist the Unnatural's halving. Corrected 2026-09-19: an earlier draft said
two, which its own table already contradicted, and undercounting is exactly how the mis-filing this
paragraph warns against happens. Following the correction this project applied to Polder Geist, none
may be filed as "non-numeric": each amount is real and belongs in readable content with its
condition intact, while never reaching an unconditional total.

**No nested choices.** No Human trait offers a pick, so the only choice in this unit is the 3-point
purchase itself. **No skill, language, ability or characteristic change** comes from Human — a
citable "none", not an unknown.

## Structured-data findings

The truncation check that caught Polder's Shadowmeld was run across all seven Human files: the
markdown body and the structured `effects` text are **identical for all seven**, including both
traits whose second clause begins "Additionally,". No clause is lost.

Two *other* structured losses do exist and matter to any loader:

1. `ancestry: human` is present in the markdown frontmatter but **absent from the unified YAML and
   JSON twins**, at top level and under `metadata`. A loader keyed on that field finds zero Human
   traits; association is recoverable only from `metadata.type` or the `scc` path segment.
2. `cost` is an unparsed string — `"1 Point"`, `"2 Points"` — in the unified twins. Point arithmetic
   must parse it or read the `md-dse` variant, which splits amount from resource.

## Double-count hazards

1. **Recoveries.** Staying Power is `+2`, not a total; the class value is the base. Recovery *value*
   is unaffected, because it derives from Stamina maximum, which Staying Power does not touch.
2. **Can't Take Hold is not stability.** Stability reduces *all* forced movement; this trait reduces
   only magic and psionic forced movement, and is optional. Modelling it as `stability +1` is wrong.
   Human has no stability trait at all.
3. **Perseverance's slowed value is flat.** While slowed, speed is 3 — not 3 plus a kit speed bonus.
   It replaces the slowed condition's own flat 2.
4. **Edges do not sum.** Two edges is a double edge, which improves the outcome by one tier rather
   than adding +4. Any implementation that adds edge values is wrong.
5. **Resist the Unnatural consumes the one triggered action per round**, so it competes with class
   triggered actions. Modelling it as passive halving overstates it substantially.
6. **Maneuver competition.** Detect the Supernatural and Determination both cost a maneuver.

## Unspent points

Settled, and **not** a new question: the pin constrains only the ceiling, and **Q-CHAR-10** already
resolved the product behaviour as warn without enforcing. Enforce total cost ≤ 3 as the hard rule and
surface unspent points as a warning. Human's costs make an exact spend always reachable, so the
question is never forced by arithmetic.

## Pipeline dependency this unit cannot avoid

`shared/content/compendium/ancestry.json` contains **only Devil and Polder**, and — understated in
an earlier draft — `trait.json` likewise omits **all seven** `feature/trait/human/` entries, which
acceptance check 1 depends on for source paths and verbatim text. Both files are generated and must
regenerate byte-for-byte from the clean pin; the build script performs a full string comparison and
refuses a dirty pin.

The thing to edit is the `SELECTIONS` constant in `scripts/build-content.ts`, **not** `manifest.json`,
which is itself generated output. An earlier draft said "a manifest selection change", which would
have sent an implementer to the wrong file. This is a shared-pipeline change and needs a file claim
through the integration owner before it is made.

## Witness plan

Five newly enabled options, and the costs make three completed builds sufficient. The class frame is
Fury, Berserker aspect, Mountain kit and career Soldier — all supported before this unit and before
V47 — so V53 is verifiable and mergeable on its own.

| Build | Purchased traits | Points | Witnesses |
| --- | --- | ---: | --- |
| H1 | Perseverance + Staying Power (the printed Quick Build) | 3 | Both, and the only derived number in the unit: Recoveries 10 → 12 |
| H2 | Can't Take Hold + Determination | 3 | Both, and the zero-derived-change case |
| H3 | Can't Take Hold + Perseverance + Resist the Unnatural | 3 | Resist the Unnatural, with two repeats |
| H0 | none | 0 | Control for H2: identical derived values, plus the unspent-points warning |

H2 against H0 is the load-bearing pair, and it must be asserted in both directions: the derived
values identical, **and** the two entitlements present and readable on the sheet. Identical numbers
alone would also be produced by the traits not being granted at all.

## Recorded uncertainties

All are resolution-time questions with **zero effect on any level-one derived number**, since the
only such number is Recoveries +2 and it is unambiguous. One further item an earlier draft listed
here was withdrawn; see below.

1. "Untyped damage" is never formally defined. The damage-type rule describes typical damage as
   having no type and names the nine types. *Interpretation, labelled:* "isn't untyped" means the
   damage carries one of those nine. Alternative considered — an eleventh distinct category —
   rejected because no pin text creates one.
2. "Temporary difficult terrain" is not a defined term; the difficult-terrain rule does not
   distinguish temporary from permanent.
3. Whether Can't Take Hold's reduction and stability stack, and in what order. Both are reductions to
   the same event; the pin never addresses them together.
**Withdrawn, 2026-09-19 after audit:** an earlier draft listed the rounding of "half the damage" as
a fourth uncertainty. The pin answers it, and its worked example is this exact case —
[Always Round Down](../../vendor/steel-compendium/en/unified/md/rule/general/always-round-down.md):
"Whenever you divide an odd number in half and it results in a decimal, round the result down to the
nearest whole number. For instance, if a tactician takes 7 damage and uses the Parry ability in
response—a triggered action that halves the damage—then the damage is reduced to 3." Recording a
resolved rule as unresolved is itself an error, and the rule is already in this project's own
content snapshot.

None of the remaining items blocks the unit, and none is a question for the user in a build thread.
