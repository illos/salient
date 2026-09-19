# V56: Hakaan, level one — source-grounded option ledger

**Preparation only. Nothing here is implemented, and nothing here is a parity claim.** No
application code is touched, no runtime job was run, and no Forge export was produced. This document
records what the pinned source says the Hakaan is, which parts the composed Salient definitions
could already express, which parts need a primitive that does not exist, and what a genuine capture
plan would have to cover.

Branched from `main` `7e5f50f` in `/srv/presidium/projects/salient/opus-hakaan` on `slice/V56`.

Sources, both at their pins and unmodified:

- Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`
- Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f` — **structure reference only, never a rules
  authority**, per the project's sourcing rules.

## 1. The option set

`feature/trait/hakaan/hakaan-traits.md` — *"You have 3 ancestry points to spend on the following
traits. (Quick Build: Doomsight, Forceful.)"*

One signature trait, granted automatically, and five purchasable traits against a **3-point** budget.
There is no nested choice anywhere in the ancestry: no skill pick, no sub-selection, no
prerequisite between traits. That makes Hakaan structurally simpler than the Devil, whose Silver
Tongue carries a thirteen-option skill choice.

Quoted effects below are the **mechanical sentence** of each trait. Five of the six files open with
a flavour sentence — Forceful is the exception — and those are elided, marked with a leading `…`,
not silently dropped.

| Trait | Cost | Source file | Effect |
| --- | ---: | --- | --- |
| **Big!** (signature) | — | `feature/trait/hakaan/big.md` | …*"Your size is 1L."* |
| All Is a Feather | 1 | `.../all-is-a-feather.md` | …*"You gain an edge on tests made to lift and haul heavy objects."* |
| Forceful | 1 | `.../forceful.md` | *"Whenever you force move a creature or object, the forced movement distance gains a +1 bonus."* |
| Stand Tough | 1 | `.../stand-tough.md` | …*"Your Might score is treated as 1 higher for the purpose of resisting potencies, and you gain an edge on Might tests when called for to resist environmental effects or a creature's traits or abilities."* |
| Great Fortitude | 2 | `.../great-fortitude.md` | …*"You can't be made weakened."* |
| Doomsight | 2 | `.../doomsight.md` | three paragraphs; see §4 |

### Every legal spend of 3 points

With costs {1, 1, 1, 2, 2} and no repeats, the budget admits exactly **seven** complete spends,
enumerated programmatically rather than by hand:

1. All Is a Feather + Forceful + Stand Tough (the only three-trait build)
2. Great Fortitude + All Is a Feather
3. Great Fortitude + Forceful
4. Great Fortitude + Stand Tough
5. Doomsight + All Is a Feather
6. Doomsight + Forceful ← **the printed Quick Build**
7. Doomsight + Stand Tough

An earlier draft of this section claimed seven and then listed six, having missed entry 7, and
counted an over-budget pair as if it were legal. The list above is generated from the costs, not
transcribed.

**The one pair that cannot be afforded:** Doomsight + Great Fortitude, 4 points. It is the Hakaan's
equivalent of the Devil's Impressive Horns + Wings exclusion — the only combination the budget
refuses — and it should be a required negative test.

**Under-spending is legal and is a separate case.** `chapter/ancestries.md:256` describes the budget
as points *"you can use to select traits"* and states no obligation to spend them all, so a
one-trait or two-point build is a valid completed character. Nothing in this ledger's cases covers
that shape, and it is worth one.

## 2. What the existing definitions can already express

Both of these have a working precedent in `shared/evaluate/ancestries/polder.ts`, so they need no
new primitive — only content.

| Trait | Primitive | Precedent |
| --- | --- | --- |
| **Big!** → `size` set to `1L` | `DerivedBaseline.size` (`characterEvaluation.ts:249`) | Polder Small! sets `1S` at `polder.ts:41-48`, same shape, `operation: 'set'` |
| **Great Fortitude** → `conditionImmunities` entry for `weakened` | `DerivedBaseline.conditionImmunities` (`:290`) | Polder Fearless adds `frightened` at `polder.ts:69-80`, structurally identical |

Both surface today. `size` is rendered at `web/wizard/hero-so-far.tsx:124`, and
`conditionImmunities` at `web/wizard/supporting-components.tsx:217` — though that is the **wizard
panel only**: `conditionImmunities` has no character-sheet consumer, so Great Fortitude would appear
during the build and not on the finished sheet without new rendering. These two traits are the whole
of what Hakaan gets for free.

## 3. What has no primitive today

### 3.1 Forceful — forced movement is not modelled at all

There is no forced-movement distance anywhere in the evaluation or roll contracts. The nearest thing
is `shared/contracts/rollResolution.ts:70`, which describes the remaining verbatim clauses that are
**not** supported damage — *"(push, potency conditions, ...)"* — i.e. push is explicitly in the
unsupported remainder and resolved by hand.

The source's scope is the whole category: `movement/forced-movement.md:7` defines push, pull and
slide and says *"Collectively, these types of movement are called forced movement"*, so a `+1` to
"the forced movement distance" covers all three and nothing else. Forge models exactly that as three
separate `+1` bonuses — `ForcedMovementPush`, `ForcedMovementPull`, `ForcedMovementSlide`
(`vendor/forge-steel/src/data/ancestries/hakaan.ts:39-55`) — which is a faithful decomposition, not
an extra rule.

**The interaction that must not be missed.** `movement/forced-movement.md:31`: *"When a larger
creature force moves a smaller target with a melee weapon ability, the distance of the forced
movement is increased by 1."* `rule/character/size.md:9` orders 1T, 1S, 1M, 1L within size 1, so 1L is larger than both 1M and
1S. Big! makes every Hakaan 1L, so a Hakaan force-moving a 1M or 1S target
with a melee weapon ability gets +1 from size *and* +1 from Forceful. **That the two stack is an
inference, not a stated rule** — see §7; the source states each independently and the only stacking
sentence found, `rule/dice/bonuses-and-penalties.md:7`, is scoped to power rolls.

**And the distance is not the end of it.** Forced-movement distance feeds damage in three separate
clauses of the same file, so Forceful's +1 raises damage as well as movement:

- `:35` — force moving a creature into another creature: *"both creatures take 1 damage for each
  square remaining in the first creature's forced movement"*;
- `:45` — into a stationary object of the target's size or larger that does not break: *"2 damage
  plus 1 damage for each square remaining"*;
- `:47` — downward into an unbreaking object: falling damage *"as if they had fallen the distance
  force moved"*.

Any manual note that presents Forceful as purely a movement bonus understates it.

### 3.2 Stand Tough — two effects, neither with a home

The trait does two separate things and they need separating.

**Defensive potency resistance.** `DerivedBaseline.potency` (`characterEvaluation.ts:254-258`) holds
the hero's *own* weak/average/strong values — the numbers a hero's abilities impose on others. Stand
Tough is the mirror image: the hero's Might when a foe's potency is checked against them. Nothing in
the baseline expresses a defensive characteristic value, so this needs a new field or an explicit
manual note; it cannot be folded into `potency`.

Forge's shape agrees with the pin, and an earlier draft of this section wrongly raised it as "a
divergence worth resolving". Its call site omits the amount
(`vendor/forge-steel/src/data/ancestries/hakaan.ts:65-69`), but the factory defaults it:
`src/logic/factory-feature-logic.ts:563` is `value: data.value || 1`. That is the same +1 the
Compendium states. The lesson is the one that matters here — a presumption ("Forge presumably
supplies the +1") was written down as something needing resolution when a single grep settled it.

**The edge.** *"an edge on Might tests when called for to resist environmental effects or a
creature's traits or abilities"* is conditional on the situation the Director is adjudicating. It is
manual, and it should be recorded as a readable conditional carrying its verbatim condition rather
than silently omitted.

### 3.3 All Is a Feather — conditional edge, manual

*"tests made to lift and haul heavy objects"* is a Director adjudication with no build-time value.
Readable text with its condition; nothing computable.

## 4. Doomsight — almost entirely a table procedure

`feature/trait/hakaan/doomsight.md` is the longest trait in the ancestry and the least automatable.
Three distinct mechanics:

1. **Predetermined death encounter.** *"Working with your Director, you can predetermine an
   encounter in which you will die."* On becoming doomed: automatic tier 3 outcomes on tests and
   ability rolls, no death however low Stamina falls, then *"you then die immediately at the end of
   the encounter, and can't be returned to life by any means."*
2. **Unplanned doom.** If no encounter was predetermined, the hero may choose to become doomed while
   dying, with Director approval, no action required. The source attaches an explicit expectation
   about when this is appropriate.
3. **Rubble instead of death.** *"when your Stamina reaches the negative of your winded value and
   you are not doomed, you turn to rubble instead of experiencing death… After 12 hours, you regain
   Stamina equal to your recovery value."*

Only (3) touches values the baseline already derives — `windedValue` and `recoveryValue` are both
present (`characterEvaluation.ts:246`, `:244`) — and even then the trait changes *what happens at a
threshold during play*, not a build-time number. **Nothing here is a creation-time calculation.**
Doomsight is a readable grant plus live-state behaviour. The honest treatment is to carry the full
text, mark it resolved at the table, and not manufacture a derived value so it looks complete.

## 5. Summary: what a V56 implementation would actually owe

| Trait | Build-time derivation | Needs new primitive | Manual at the table |
| --- | --- | --- | --- |
| Big! | `size = 1L` | no | — |
| Great Fortitude | `conditionImmunities += weakened` | no | — |
| Forceful | forced-movement `+1` | **yes** (§3.1) | applying it, plus the 1L size interaction |
| Stand Tough | Might +1 vs potency | **yes** (§3.2) | the conditional Might edge |
| All Is a Feather | none | no | the whole trait |
| Doomsight | none | no | the whole trait |

Two of six traits are automatic with existing primitives. Two need a primitive that does not exist.
Two are entirely manual. That ratio is the honest scope statement for this ancestry.

An earlier draft added that this is "materially different from the Devil, where most purchased
traits produced a derivable number". That was backwards: `shared/evaluate/sources.ts:280` shows only
Beast Legs and Impressive Horns carry a derived field, two of the Devil's seven purchased traits.
The two ancestries are in fact comparable in how little is automatic, and the claim is withdrawn
rather than reworded.

## 6. Capture plan — a minimal set covering every option

Per [character verification §2](character-verification.md#2-build-and-capture-the-reference),
captures must be genuine completed builds driven through the real editor, with the export taken from
the application's own export path. **No export is fabricated and none is produced by this
preparation.**

Four captures cover all six traits and both budget behaviours:

| # | Purchased traits | Points | Covers |
| --- | --- | ---: | --- |
| H-A | All Is a Feather + Forceful + Stand Tough | 3 | the only three-trait build; all three 1-point traits at once |
| H-B | Doomsight + Forceful | 3 | the printed Quick Build; the 2+1 shape |
| H-C | Great Fortitude + All Is a Feather | 3 | the other 2-point trait; the second 2+1 shape |
| H-D | Doomsight + Great Fortitude | 4 | **over budget — must be refused, not captured as a completed build** |

H-A, H-B and H-C between them include every trait at least once, and Forceful and All Is a Feather
twice across different partners. H-D is a negative case: Forge should refuse it, and what is
recorded is the refusal, not an export.

Each capture must also record, per the verification document: capture date, the served Forge version
and its source commit, enabled sourcebook IDs, the exact export location and fingerprint, the
readable sheet evidence, and both pinned revisions. A Hakaan at 1L should have its size visible on
the rendered sheet, since `size` is the one automatic numeric difference from the ancestries already
supported.

## 7. Open questions and labelled interpretations

**No rules question is raised for the user**; every trait's own effect is stated outright in the
pin. Two readings are recorded here as interpretations rather than left to look like source facts.

**Interpretation 1 — Forceful and Big! compound (§3.1).** `forceful.md` gives forced movement +1;
`forced-movement.md:31` gives a larger creature +1 against a smaller target with a melee weapon
ability. Each is stated independently. **Nothing in the pin states that they combine, and nothing
forbids it.** The only stacking sentence located, `rule/dice/bonuses-and-penalties.md:7`, is scoped
to power rolls and does not govern a forced-movement distance. An earlier draft asserted the
compounding as a fact under a heading saying it "must not be missed"; it is an inference, and the
alternative — that the two +1s do not both apply — is not excluded by anything cited here. If an
implementation would behave differently under the two readings, that is when it becomes a question
for `docs/rules-questions-for-user.md`, not before.

**Interpretation 2 — Forceful's scope is push, pull and slide (§3.1).** `forced-movement.md:7`
defines those three and says *"Collectively, these types of movement are called forced movement"*,
so "the forced movement distance" reaches exactly them. This is a reading of an explicit definition
and is the stronger of the two.

Nothing is invented to make a feature look finished. If implementation surfaces a genuine ambiguity,
it goes to the questions file under its own id.
