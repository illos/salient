# Dragon Knight level-one implementation preparation

Prepared 2026-09-19 from local pinned sources for the [V54 slice](../build/V54-dragon-knight-level-one.md)
under the [V44 delivery plan](../build/V44-character-option-delivery.md). **Preparation only.** No
option is enabled, no reference has been captured, no script has been run and no verification has
been performed.

## Source boundary

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Reference structure: Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`.
Neither pin changed; no vendor file modified; local files only; no online lookup. Forge's ancestry
files are hidden by sparse checkout and were read with
`git -C vendor/forge-steel show HEAD:src/data/ancestries/dragon-knight.ts`, which touches neither
the pin nor the sparse configuration.

Book section: `en/books/heroes/clean/Draw Steel Heroes.md` lines 1659–1812; 1813 is the Dwarf heading.

## Baseline

Size **1M**, speed **5**, stability **0** from
[Starting Size and Speed](../../vendor/steel-compendium/en/unified/md/rule/character/speed.md).
No Dragon Knight file states an override; the only size/speed/stability text under
`feature/trait/dragon-knight/` is Wings' flight, which grants a movement mode rather than changing
speed.

## Signature trait: Wyrmplate — free, and a genuine build selection

> "Your hardened scales **grant you** damage immunity equal to your level to one of the following
> damage types: acid, cold, corruption, fire, lightning, or poison. You can change your damage
> immunity type when you finish a respite."

**Six types, not seven** — there is no sonic, unlike the Elementalist's Ward of Excellent
Protection. Do not reuse that list.

Unlike the Dwarf's Runic Carving, this **is** a creation choice, and the grammar is why: Wyrmplate
"grant**s** you" immunity in the present tense, so a selection must already exist for the sentence
to be true. V50 established that contrast; here it lands on the other side. It is corroborated
inside the pin by Prismatic Scales referencing "one damage immunity **granted by** your Wyrmplate
trait", which presupposes the selection exists at build time.

Immunity value is **equal to level** — 1 at level one — not a characteristic score.

Respite reselection is out of V54's scope; the build-time choice is what this unit delivers.

## Purchased traits — 3 points

Quick build: Dragon Breath plus Prismatic Scales (2 + 1 = 3).

| Trait | Cost | Source-backed effect | Build requirement and manual boundary |
| --- | ---: | --- | --- |
| [Draconian Guard](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/draconian-guard.md) | 1 | Triggered action when you or an adjacent creature takes strike damage: reduce that damage by your level | **Manual.** A triggered reduction, not a permanent value. Grant the readable ability; the amount (1 at level one) is derived but applied at the table |
| [Prismatic Scales](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/prismatic-scales.md) | 1 | "Select one damage immunity granted by your Wyrmplate trait. You always have this immunity, in addition to the immunity granted by Wyrmplate" | **Permanent build, and a nested cross-trait dependency.** See below |
| [Remember Your Oath](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/remember-your-oath.md) | 1 | Maneuver reciting the oath; until the start of your next turn, saving throws succeed on 4+ | **Manual.** A temporary, self-activated threshold change. Must **not** become a permanent `savingThrowThreshold` of 4 — contrast the Devil's Impressive Horns, which *is* permanent |
| [Draconian Pride](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/draconian-pride.md) | 2 | Signature ability: Area, Magic, main action, 1 burst, each enemy; Might **or** Presence; 2 / 5 push 1 / 7 push 2 | **Readable ability grant.** Power roll and push are manual |
| [Dragon Breath](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/dragon-breath.md) | 2 | Signature ability: Area, Magic, main action, 3 cube within 1, each enemy; Might **or** Presence; 2 / 4 / 6; damage type chosen **on use** from the six | **Readable ability grant.** The damage type is a per-use choice, **not** a build-time lock |
| [Wings](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/wings.md) | 2 | Fly; aloft for rounds equal to Might (minimum 1) before falling; while flying at 3rd level or lower, damage weakness 5 | **Conditional.** Same shape as the Devil's Wings — needs V46's `movementModes` and `conditionalEffects`, not `damageWeaknesses` |

## Prismatic Scales — INTERPRETATION, two live readings, unresolved

> "Select one damage immunity granted by your Wyrmplate trait. You always have this immunity, in
> addition to the immunity granted by Wyrmplate."

**This is an interpretation between two live readings, not a derivation.** An earlier draft of this
document asserted Reading A flatly and called the alternative "source-illegal". That was wrong on
the evidence below, and it drove the option count, the data model and every acceptance check.

**Reading A — the type is pinned to whatever Wyrmplate currently grants.** Wyrmplate confers one
immunity at a time, and "granted by your Wyrmplate trait" points at a conferred immunity. The pin's
only comparable phrasing supports this: Null's level-9 feature reads "immunity to all damage equal
to the cold damage immunity **granted by your Entropic Adaptability** trait", and Entropic
Adaptability does confer a specific immunity ("You have cold immunity equal to twice your Intuition
score"). Under A, Prismatic Scales makes that one type permanent while Wyrmplate's own remains
changeable at respite.

**Reading B — one of the six types Wyrmplate can grant.** Two clauses in the sentence work only
under B. "**Select one**" has exactly one candidate under A, so the verb is vacuous. And "**in
addition to** the immunity granted by Wyrmplate" is self-referential under A at selection time — it
acquires meaning only after a later respite change, which is outside this unit's scope. Under B all
three clauses are non-degenerate at once.

**A consideration against A that the delivered behaviour makes concrete:** under A, and with respite
reselection out of scope, Prismatic Scales produces **no observable level-one value at all** — the
build gains a second provenance entry on an immunity that already has the same value, because only
the highest applies. The printed quick build, Dragon Breath plus Prismatic Scales, would then spend
a third of the ancestry budget on something with no level-one effect.

**Salient already ships Reading B, in two places.** This is decisive for how the unit must proceed
and the earlier draft missed it entirely:

- `shared/content/supporting-complications.ts` defines `complication.dragon-dreams.immunity`,
  labelled "Prismatic Scales immunity", quoting this exact sentence, with
  `options(['acid','cold','corruption','fire','lightning','poison'], …/wyrmplate.md)` — six free
  options, **no link to any Wyrmplate selection**. It is on main today.
- [Q-CHAR-7](../rules-questions-for-user.md)'s recorded research recommendation reads "allow
  choosing **one of Wyrmplate's six types** with level-scaled immunity".

**Forge also implements Reading B**, flattening the trait into six independent one-point options
`dragon-knight-feature-2-2` … `-2-7`, named "Prismatic Scales (acid)" … "(poison)", each a
standalone `createDamageModifier`, with no reference to `dragon-knight-feature-1` (Wyrmplate). That
is a third-party structure and not authority — but it is no longer a divergence Salient stands apart
from, because Salient's own shipped decision does the same thing.

**This unit does not decide it.** It is recorded as
[Q-CHAR-21](../rules-questions-for-user.md) because it changes the delivered option count from
twelve to eighteen, changes the data model, and would otherwise have V54 forbid on the ancestry path
exactly what the complication path already offers.

## Existing implementation, and the overlap nobody should duplicate

`ancestry.choice` offers Dragon Knight with `supportedInV001: false`, and there is no
`shared/content/ancestries/dragon-knight/` module and no evaluator. The ancestry is unimplemented.

**But two of its abilities already exist in the tree**, delivered by V37's supporting choices:
`shared/content/supporting-complication-abilities.ts` carries Dragon Breath and Draconian Pride,
sourced from `feature/ability/dragon-knight/`, for the **Dragon Dreams complication**. Its recorded
note states the damage type is "chosen on use ... not a permanent type lock" and that "Wyrmplate is
referenced for dependency research, NOT granted". Draconian Guard also appears by SCC id in
`supporting-complications.ts`.

V54 must reuse those ability definitions rather than author a second copy, and must not disturb the
complication path that already consumes them. Whether the shared ability records can serve both an
ancestry grant and a complication grant is a concrete question for the integration owner.

## Other Forge divergences, which V44 requires be recorded

Beyond Prismatic Scales, from `git -C vendor/forge-steel show HEAD:src/data/ancestries/dragon-knight.ts`:

| Pin | Forge |
| --- | --- |
| Draconian Pride | **Draconic** Pride (`dragon-knight-feature-2-9`) |
| Remember Your Oath | "Remember your Oath" casing |
| Wings: "before you fall"; "at 3rd level or lower" | "before you fall **prone**"; "at 1st, 2nd, and 3rd level" |
| Wyrmplate selection timing unstated beyond respite change | modelled `selectAt: 'respite'` |
| Draconian Guard: no flavour, no target line | invented flavour and `target: 'Self'` |
| — | Forge attaches an ancestral culture (Vastariax; Secluded/Bureaucratic/Martial) to the ancestry |

The name differences alone will make a capture disagree unless the comparison normalizes them. The
ancestral culture matters to "class and background held constant" and must be handled explicitly in
the capture plan.

Also worth recording for implementation: **Draconian Pride's damage is untyped**, in contrast to
Dragon Breath's per-use chosen type. The Ancestry Measurements row (6'0"–7'0", 200–350 lb, 50–90
years) is flavour with no mechanical effect.

## Shared representation needs

1. **`damageImmunities` at level scale.** Wyrmplate is level-based (1 at level one), unlike Polder's
   `level + 2` and the Elementalist ward's Reason score. The existing field shape fits; the producer
   must **append**, not assign, for the same clobbering reason V48 recorded.
2. **Two immunities of the same type.** With Prismatic Scales, Wyrmplate and Prismatic Scales grant
   the *same* damage type. Under
   [Damage Immunity](../../vendor/steel-compendium/en/unified/md/rule/damage/damage-immunity.md)
   only the highest applies, and both are equal to level, so the effective value is level — **not**
   doubled. Both provenances must be retained; the merge must not sum.
3. **Wings** needs V46's `movementModes` and `conditionalEffects`, live at **`b2c660a`** on `slice/V46` and
   not on main (an earlier draft cited `dd514ff`, which is not reachable from any ref;
   `shared/contracts/characterEvaluation.ts` is byte-identical between the two). The aloft limit is `max(1, Might)` and the weakness is conditional on flying **and**
   on level ≤ 3, so it is a two-condition effect — the Devil's Wings has the same level gate.
4. **Remember Your Oath must not touch `savingThrowThreshold`.** The Devil's Impressive Horns sets
   it permanently to 5; this sets 4 only until the start of your next turn, after a maneuver. It
   belongs in readable text or `conditionalEffects`, never in the baseline.
5. **Draconian Pride and Dragon Breath use "Might or Presence"**, a per-use characteristic choice.
   Confirm how existing ability records represent an either-characteristic power roll before
   assuming the current shape holds it.

## Legal purchased-trait combinations

Costs: Draconian Guard 1, Prismatic Scales 1, Remember Your Oath 1, Draconian Pride 2,
Dragon Breath 2, Wings 2. Budget 3. Partitions are `1+1+1` and `2+1`; `2+2` exceeds the budget, as
the ancestries chapter states with its own Dragon Knight example — "they couldn't select both
Impressive Horns and Wings" is the Devil case, and the same arithmetic applies here.

Sets spending exactly three points: one `1+1+1` (Guard + Scales + Oath) and nine `2+1`
(each of Pride, Breath, Wings with each of Guard, Scales, Oath) — **ten** sets.

**Minimum builds to cover all six traits: three.** The three two-point traits are pairwise
exclusive, so at least three builds are needed for them alone; each such build has one point left
and so covers one of the one-point traits. Three builds therefore cover three two-pointers and
three one-pointers — exactly all six — and two builds cannot, because two builds contain at most two
of the three mutually exclusive two-point traits. (An earlier draft said two builds "reach at most
four traits", which is false — two `1+1+1` sets reach six. The conclusion stands on the
exclusivity argument alone.)

Proposed minimal cover, holding class and background constant:

| # | Purchased traits | Points | Covers |
| ---: | --- | ---: | --- |
| K1 | Dragon Breath + Prismatic Scales | 3 | The printed quick build; exercises the Wyrmplate dependency |
| K2 | Draconian Pride + Draconian Guard | 3 | |
| K3 | Wings + Remember Your Oath | 3 | The conditional and the manual-threshold cases |

Wyrmplate's six types need six witnesses of their own. Reusing K1–K3 across them, **six builds** is
the minimum for complete option coverage, with Prismatic Scales' type pinned to Wyrmplate's in
whichever builds carry it.

## What this preparation does not establish

No capture has been made, no script has been run, and nothing is verified. The ledger above is
derived from the pin and from reading Forge's structure; it is not a rules review, and the
Prismatic Scales reading and the Forge divergence both need the independent rules reviewer the V44
gates require.
