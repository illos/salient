# V79 — Revenant level one

Status: complete and merged/live as `1fa8aac` through [V82](V82-remaining-ancestries.md); focused/full checks, independent reviews, hosted API proof and Forge acceptance pass. Hosted and shared-main API acceptance pass.
Branch `slice/V79`. Owns `shared/content/ancestries/revenant/`,
`shared/evaluate/ancestries/revenant.ts`, `tests/character-v79-revenant.test.ts`.

## Rules and behavior

Authority: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/feature/trait/revenant/`, `feature/ability/revenant/detonate-sigil.md`,
and each selected former ancestry's paid-trait source.

Former Life selects one of the other eleven core ancestries, inherits only its size,
and sets base speed 5. Tough But Withered grants cold, corruption, lightning and
poison immunity equal to level and fire weakness 5. Its inert/destroyed/restored
outcomes remain readable manual rules. Polder former life gives size 1S and three
ancestry points; Hakaan gives 1L and two points; all others give 1M and two points.

A single purchase list combines Bloodless (2), Undead Influence (1), Vengeance Mark
(2), and the chosen former ancestry's one- and two-point purchases. Displaying the
borrowed trait's actual name avoids indistinguishable repeated Previous Life slots.
Every distinct one-point purchase is allowed once; all selected costs share the
Revenant budget. Nested paid choices retain their source options and grant behavior.
Only purchase-dependent subtrees are cloned, never original signature choices.
Changing Former Life prunes its purchase list and nested decisions.

Prismatic Scales explicitly requires an immunity granted by **your Wyrmplate trait**.
Former Life does not grant Wyrmplate, so that borrowed option is unavailable with a
source-prerequisite explanation. This is an intentional source-driven restriction;
reference comparisons must report any contrary Forge behavior, not grant Wyrmplate
implicitly. Revenant cannot name itself as its former ancestry and recurse into an
unbounded undead history; the prior living ancestry is the recorded choice.

## Trait and action audit

Former Life and Tough But Withered grant baseline/manual rules without activated
actions. Bloodless grants bleeding immunity, including while dying. Undead Influence
modifies social tests against undead. Vengeance Mark retains its trait and grants
three actions: place a sigil (maneuver), remove a sigil (no action), and Detonate Sigil
(main action with the structured source ability). Sigil tracking, targeting, damage
and forced movement remain manually resolved, as with existing granted abilities.

Previous Life grants the actual borrowed trait and all of its actions, using the
original trait source path. Native action audits from the other eleven ancestry
units apply equally to these purchases. Paid prose actions include Glowing Eyes,
Stone Singer, Doomsight, Determination, Resist the Unnatural, Reactive Tumble,
Draconian Guard, Remember Your Oath, Glamor of Terror, Keeper of Order, Beyondsight
and Foresight. Structured grants include Dragon Breath, Draconian Pride,
The Wode Defends and the selected Psionic Gift ability. Signature-only actions,
including rune carving, Detect the Supernatural, Relentless and Shadowmeld, do not
transfer. Passive modifiers, including Wings and critical-hit or recovery modifiers,
retain full source text and do not become fabricated actions.

Paid permanent-value matrix: Beast Legs, Swift and Lightning Nimbleness set speed;
Impressive Horns and Otherworldly Grace set save threshold; Grounded adds stability;
Spark Off Your Skin adds Stamina and recalculates recovery/winded values; Staying
Power adds Recoveries; Great Fortitude, Fearless, Nonstop, Unphased and Unstoppable
Mind grant their condition immunities. Corruption Immunity replaces the weaker
Tough But Withered corruption value with level + 2, without duplicate additive
immunity. Graceful Retreat adds Disengage distance after its default is established.
All other paid effects remain source-readable manual behavior.

## Witnesses and gates

| Witness | Former life and purchases | Distinct coverage |
| --- | --- | --- |
| RV1 | Hakaan: Bloodless; Polder: Bloodless + Undead Influence | Large/small sizes, size-dependent budgets, undead baselines |
| RV2 | Polder: Corruption Immunity + Graceful Retreat + Reactive Tumble | Multiple distinct one-point imports, maximum immunity, granted trigger |
| RV3 | Time Raider: Psionic Gift, each nested ability | Nested required choice and structured action |
| RV4 | Human: Vengeance Mark | Three granted activations and retained trait |
| RV5 | Every other former paid option, alone or with compatible native filler | Source option coverage, permanent/manual grants and borrowed actions |
| RV6 | Orc: Passionate Artisan + Grounded, Alchemy/Architecture targets | Nested skill targets do not become skill grants |

The root-owned Forge generator expands RV5 into legal completed counterparts for
every eligible borrowed option, includes all three Psionic Gift choices, and retains
raw characters and exact saved selections. Focused tests catch concrete budget,
immunity, missing-action, nested availability and stale-parent defects. Root owns
integrated checks, authenticated save/readback/replacement proof and reference
comparisons. No runtime tests were run by the unit implementer. No browser testing
under the moratorium. Independent implementation and rules reviews remain required.

Integration: call `createRevenantDecisions(allOtherAncestryDecisions)` once after
all other ancestry modules exist; enable Revenant. Invoke `applyRevenantBaseline`
after class/kit vitals and before complications; invoke `applyRevenantDisengage`
after default Disengage. Aggregate `revenantAbilities` for the two prose actions;
Detonate Sigil uses the ordinary `ancestry-ability` option grant. Nested IDs preserve
the suffix under `ancestry.revenant.<former-slug>.`; the shared purchase ID helper
is `revenantPurchaseId(former)`.
