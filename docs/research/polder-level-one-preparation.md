# Polder level-one implementation preparation

Prepared 2026-09-19 for the V49 unit under the
[V44 delivery plan](../build/V44-character-option-delivery.md). Research and a proposed
implementation plan only: it enables no option, changes no evaluator and certifies nothing. See
[the slice](../build/V49-polder-level-one.md).

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`. Reference structure:
Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`. Neither pin was changed, no vendor file was
modified, and no online source was consulted. A private `/tmp` review map was read as a starting
point only; every claim below was re-derived from the pin by an independent reviewer.

## What already works, and must keep working

The Polder ancestry is already partly delivered. `shared/content/ancestries/polder/level-one.ts`
grants both signature traits and encodes the 4-point budget; `shared/evaluate/ancestries/polder.ts`
derives size, speed, stability, the corruption immunity value, the frightened immunity and the
Disengage bonus.

| Value | Source | State |
| --- | --- | --- |
| Size 1S | [Small!](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/small.md) — "Your size is 1S." | Implemented as a `set`, correctly replacing the 1M default |
| Speed 5, stability 0 | [Starting Size and Speed](../../vendor/steel-compendium/en/unified/md/rule/character/speed.md) | Implemented; Polder itself grants no speed or stability change |
| Shadowmeld ability | [Shadowmeld](../../vendor/steel-compendium/en/unified/md/feature/ability/polder/shadowmeld.md) | Granted as both a signature trait and an ancestry ability |
| Corruption Immunity | level + 2, so **3** at level one | Implemented as a numeric damage immunity |
| Fearless | "You can't be made frightened." | Implemented as a condition immunity |
| Graceful Retreat | +1 to the Disengage shift distance | Implemented as `disengage + 1` |
| 4-point budget | [Polder Traits](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/polder-traits.md) | Implemented with the correct per-trait costs |

**Do not drive the free-trait list from `signature_trait_name`.** The ancestry record carries a
single scalar naming only Shadowmeld, but Polder has **two** signature traits, and the chapter says
"Each ancestry has one or more signature traits". Driving the list from that field silently drops
Small! and therefore drops size 1S. Our module already lists both explicitly; keep it that way.

## The gap this unit closes

Three of the six purchasable traits are marked unsupported. They are exactly the traits whose
effects are not a simple number, which is why they were deferred and why they need care now.

| Trait | Cost | Effect, verbatim | Classification |
| --- | ---: | --- | --- |
| [Nimblestep](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/nimblestep.md) | 2 | "You ignore the effects of difficult terrain and can move at full speed while sneaking." | A movement-cost waiver **plus a second conditional numeric effect**; no unconditional change |
| [Polder Geist](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/polder-geist.md) | 1 | "At the start of each of your turns during combat, if no enemy has line of effect to you or if you are hidden from or have concealment from any enemy with line of effect to you, you gain a +3 bonus to speed until the end of your turn." | **Conditional amount**: a sourced +3 that never reaches the unconditional speed |
| [Reactive Tumble](../../vendor/steel-compendium/en/unified/md/feature/trait/polder/reactive-tumble.md) | 1 | "Whenever you are force moved, you can use a free triggered action to shift 1 square after the forced movement is resolved." | Triggered, opt-in, **free** action |

### Polder Geist is a conditional amount, not an absent one

Corrected 2026-09-19 after lead review: an earlier draft filed Polder Geist as "non-numeric", which
understates it. The source states a specific amount — **+3 speed** — under a specific condition. The
right representation carries **both**: the amount is calculated and shown, and it never reaches the
unconditional speed.

The condition is gated on three things at once — **at the start of your turn**, **during combat**,
and **only if** no enemy has line of effect to you or you are hidden from or have concealment from
any enemy that does — and it lasts **until the end of that turn**, being re-evaluated every turn. A
level-one Polder with Polder Geist still has speed 5 as their ordinary speed. Printing "speed 8", or
"speed 5 (8)" without the full condition, misstates the source.

**Proposed representation, and its dependency.** No conditional-effect type exists in this checkout;
`ConditionalEffect` appears nowhere under `shared/`. The shape below was read read-only from V46's
**unmerged** commit `7b7174b`, which adds a `ConditionalEffect` entry to the derived baseline for
exactly this kind of rule: a calculated amount plus the verbatim condition, deliberately kept out of
the fields that resolve rolls or apply damage automatically, with an `effect` field that is at that
commit a closed union of `rounds-aloft`, `damage-weakness` and `extra-strike-damage`. Polder Geist
needs one new member — `speed-bonus` — with `amount` 3, the verbatim condition sentence and the
trait's source path.

That is a minimal additive extension of a seam another unit is building, and the citation is an
unmerged commit rather than current main. If V46's shape changes before it merges, this proposal
changes with it, and the field names in the reference data are provisional until then.

This makes V49 **depend on V46 merging**, which is recorded here rather than hidden. If V46 has not
landed when this unit is released, the options are to wait, or to implement the same shape locally
and reconcile at integration; the first is preferable and the choice belongs to the integration
owner, not to this unit.

### Nimblestep waives a cost and overrides a halving

Corrected 2026-09-19 after independent review: calling both clauses plain entitlements was wrong,
because the second one overrides a number the source states elsewhere.

"Ignore the effects of difficult terrain" removes the extra square of movement cost that difficult
terrain imposes — a cost waiver, not a speed bonus, and it must not be folded into a speed total.

"Can move at full speed while sneaking" overrides the sneaking rule in the tests chapter: "While
sneaking, your speed is halved." So for a level-one Polder this is a **conditional numeric** effect
in exactly the sense Polder Geist is — speed 5 instead of 2 while sneaking — and it deserves the same
treatment: the condition is readable and the ordinary speed is untouched. The claim this unit
actually tests, that none of the three traits changes an *unconditional* total, still holds for all
three; the classification was what was wrong.

### Reactive Tumble stays readable and manual

The source makes it an opt-in free triggered action: "you can use a free triggered action to shift 1
square after the forced movement is resolved", and a free triggered action "doesn't count against
your limit of one triggered action per round". Both facts belong in the readable grant so the table
can apply them correctly.

Corrected 2026-09-19 after lead review: this slice adds **no action-budget automation**. An earlier
draft said the trait "must appear in the sheet's triggered-action list without consuming the
one-per-round budget", which implies the wizard tracks that budget. It does not, and this unit does
not add it. Activation, timing and the budget itself remain manual. The sequencing note still holds:
the shift resolves after the forced movement, so it is sequential with stability rather than
additive to it.

## Shadowmeld: the full clause list and a real extraction trap

Eight clauses. The summary below paraphrases for readability; the exact wording lives in the source
file and in the test plan's quoted assertion, and any assertion must quote the source, not this
paraphrase. The clauses are: flatten against a touched wall or floor and become
hidden from any creature you have cover or concealment from or who is not observing you; full
awareness while in shadow form; strikes against you and tests to search for you take a bane; you
cannot move or be force moved; you cannot take main actions or maneuvers except to exit the form or
to direct creatures under your control; an ability or effect targeting more than 1 square affects you
only if it explicitly affects the surface you are flattened against; you can exit as a maneuver; and
**if the surface you are flattened against is destroyed, the ability ends and you take 1d6 damage
that cannot be reduced in any way**.

That final clause is **body-only**. It is absent from the structured `effects` field in every
generated representation — the markdown frontmatter, the unified YAML, the unified JSON, and the
copy nested inside the trait record — while `metadata.content` and the markdown body carry it. Any
consumer that rebuilds text from `effects[]` loses both the ending condition and the irreducible 1d6.

Checked in our own code rather than assumed: `shared/presentation/ability.ts` prefers
`ability.content.text` and only falls back to reconstructing from `metadata.effects` when no content
row matches; our `shared/content/compendium/ability.json` record stores the complete body; and
`convex/characters.ts` resolves that record by source path. So the clause is displayed today through
the content path, and the truncation would bite only on the fallback. **That makes it an assertion
to add, not a defect to fix** — but it is exactly the kind of silent loss that a later refactor could
introduce, so the test belongs in this unit.

Two further notes on Shadowmeld: the source states no use limit, no duration cap and no square count
beyond "a wall or floor you are touching"; absence of a limit in the pin is not evidence of one
elsewhere. And its data marks it `subtype: signature` while its actual usage is a **maneuver**, so an
implementation that counts class signature abilities must not absorb it or present it as a main
action.

## Double-count hazards

1. **Disengage.** Kits carry their own disengage bonus, and Graceful Retreat is a second bonus to the
   same quantity. Both add on top of the base shift of 1. The failure mode is computing disengage in
   two places, or storing an ancestry-derived total that already includes the base and then adding
   the base again.
2. **Speed.** Kits give unconditional speed bonuses. Polder Geist must not share that accumulator.
3. **Damage immunity does not stack**: where several apply, only the highest value does. Summing
   Corruption Immunity with another immunity is a rules error, not a display error.
4. **Stability.** Shadowmeld's "you can't be force moved" is an absolute prevention, not a stability
   increase, and must not be modelled as one.
5. **Triggered-action budget**, as above.
6. **Revenant**, for later units: a Revenant's budget depends on being size 1S and its previous-life
   traits draw on other ancestries' lists, so Polder's costs must stay a single shared source.

## Unspent points

Settled, and not a rules question: the source constrains only the ceiling — overspending is
forbidden, underspending is not addressed — and **Q-CHAR-10** resolved the product behaviour on
2026-09-15 as warn without enforcing. Unspent points alone do not block completion. No new question
is needed.

## Witness plan

Only three options are newly enabled, and their costs are 2 + 1 + 1 = exactly the 4-point budget, so
**one new counterpart build covers all three**.

Corrected 2026-09-19 after lead review: an earlier draft proposed reusing the V47 Fury Build B as the
witness for the three already-supported traits. That is not usable evidence — V47's capture script
has never been executed, so no artifact exists. Certifying a planned capture as evidence is exactly
the error the per-option gate forbids. The real retained artifact is used instead.

| Build | Ancestry choices | Class frame | Covers | Evidence status |
| --- | --- | --- | --- | --- |
| P1 | Nimblestep + Polder Geist + Reactive Tumble, 4 of 4 points | Fury, **Berserker**, Mountain kit — all already supported, so this unit does not depend on V47's release | All three newly enabled traits | To be captured by this unit |
| P2 | Corruption Immunity + Fearless + Graceful Retreat | Elementalist level 1, from V45 | Size 1S, Shadowmeld, corruption immunity, frightened immunity, Disengage +1 | **Real retained artifact**: `tests/fixtures/v45-reference/Bethell-corrected-export.ds-hero` with its sheet png and txt, a genuine level-one Polder Elementalist whose ancestry features are exactly Shadowmeld, Small!, Corruption Immunity, Graceful Retreat and Fearless |

Bethell is authentic captured evidence and counts for what it actually proves: the three
already-supported traits and both signature traits, as built in Forge. Two caveats travel with it —
it was captured from the public website at version 14.198.0, which is newer than our pinned Forge
source, and it is an Elementalist, so it proves the ancestry contributions rather than any Fury
interaction. Record both rather than presenting it as a same-build Fury counterpart.

Build P1 deliberately avoids the Reaver and Stormwight aspects and the stormwight kits so that V49
can be verified and merged whether or not V47 has been released. Expected values for P1 are the
Polder baseline — size 1S, speed 5, stability from the kit, Shadowmeld granted — with **every
unconditional vital unchanged** from the same build with no purchased traits, **and** Polder Geist's
conditional +3 present as a calculated conditional contribution with its verbatim condition and
readable source. Both halves are required: an implementation that silently drops the +3 fails this
build just as one that adds it to the ordinary speed does.

Behavioural cases, as tests rather than counterparts: overspending the budget is invalid;
underspending warns without blocking; swapping a purchased trait removes the old trait's effects and
applies the new one; and changing ancestry away from Polder removes size 1S, Shadowmeld and every
purchased trait while preserving independent class and career choices.

## Recorded uncertainties

1. Whether Nimblestep's "ignore the effects of difficult terrain" also lifts the separate
   prohibition in
   [Shifting](../../vendor/steel-compendium/en/unified/md/movement/shifting.md) — "You can't shift
   into or while within difficult terrain or damaging terrain". The pin does not say. Record it; do
   not resolve it by assumption, and do not implement a shifting change on the strength of it.
2. Shadowmeld states no use limit or duration cap. Represent what the source says and nothing more.

Neither blocks the unit. If a rules reviewer needs item 1 settled before the entitlement can be
displayed accurately, it goes to the question queue with the paths read and a recommendation, and the
rest of the unit continues.
