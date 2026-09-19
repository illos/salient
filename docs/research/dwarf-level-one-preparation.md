# Dwarf level-one implementation preparation

Prepared 2026-09-19 from local pinned sources for the [V50 slice](../build/V50-dwarf-level-one.md)
under the [V44 delivery plan](../build/V44-character-option-delivery.md). This is research for a
separately scoped ancestry commit. **No option is enabled by this document, no reference has been
captured and no verification has been run.**

## Source boundary

Rules authority: Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Reference structure: Forge Steel `5a846aadb623a9855a023e9403bb887a956c341f`.
Neither pin was changed and no vendor file was modified. Local files only; no online lookup.

Forge's ancestry definitions are hidden by the submodule's sparse checkout. They were read with
`git -C vendor/forge-steel show HEAD:src/data/ancestries/dwarf.ts`, which touches neither the pin nor
the sparse configuration — the same technique
[the navigation guide](../compendium-navigation.md) documents for the Compendium.

| Purpose | Exact repository source |
| --- | --- |
| Ancestry identity and signature trait name | [Dwarf](../../vendor/steel-compendium/en/unified/md/ancestry/dwarf.md) |
| Three-point purchased-trait budget and quick build | [Dwarf Traits](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/dwarf-traits.md) |
| Signature trait | [Runic Carving](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/runic-carving.md) |
| Purchased traits | [Great Fortitude](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/great-fortitude.md), [Grounded](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/grounded.md), [Spark Off Your Skin](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/spark-off-your-skin.md), [Stand Tough](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/stand-tough.md), [Stone Singer](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/stone-singer.md) |
| Default size, speed, stability | [Starting Size and Speed](../../vendor/steel-compendium/en/unified/md/rule/character/speed.md) |
| Ancestry selection context and point budget | [Ancestries](../../vendor/steel-compendium/en/unified/md/chapter/ancestries.md) |
| Potency resistance | [Potency](../../vendor/steel-compendium/en/unified/md/rule/character/potency.md) |
| Edge value | [Edge](../../vendor/steel-compendium/en/unified/md/rule/dice/edge.md) |
| Stability floor and sources | [Stability](../../vendor/steel-compendium/en/unified/md/rule/character/stability.md) |
| Recovery value formula | [Recoveries](../../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md) |
| Weakened | [Weakened](../../vendor/steel-compendium/en/unified/md/condition/weakened.md) |
| Forge structure | `git -C vendor/forge-steel show HEAD:src/data/ancestries/dwarf.ts` |

A mechanical comparison of the book section against the seven unified trait files found the rules
text **identical**. The differences are structural only: the ancestry entry carries flavour and a
`signature_trait_name` label but no trait list and no point budget; costs move from book headings
into trait frontmatter; and Runic Carving's three runes are bold-lead paragraphs in both, with the
JSON twin storing one opaque effect blob. **The ancestry-to-trait association, the costs and the
rune options are not machine-readable anywhere in the pin** and must be authored in Salient.

## Baseline

Size **1M**, speed **5**, stability **0**. The Dwarf entry states no override — the only
size/speed/stability text anywhere under `feature/trait/dwarf/` is Grounded's stability bonus. The
contrast case proving the search is meaningful is the Hakaan trait
[Big](../../vendor/steel-compendium/en/unified/md/feature/trait/hakaan/big.md), "Your size is 1L",
an explicit override the Dwarf does not have.

## Signature trait: Runic Carving

Free with the ancestry — "Each ancestry has one or more signature traits, which your hero gets for
free if they take that ancestry." The trait grants the capacity to carve one rune, chosen from
Detection, Light or Voice, with one active at a time.

| Rune | Nested choice | In-play controls |
| --- | --- | --- |
| Detection | **Yes** — "Pick a specific type of creature … or object", open-ended, not a closed list | change the type **as a maneuver** |
| Light | none | on and off **as a maneuver** |
| Voice | a specific target creature, bound to the rune rather than a free parameter | initiate as a maneuver; changing the creature requires **changing the rune**, i.e. 10 minutes |

Note the asymmetry: Detection's target type is re-selectable as a maneuver, Voice's target creature
only by re-carving. Voice also carries prerequisites — willing, previously met, within 1 mile, you
know their name, and they speak a language you know.

### Whether a rune is a creation choice is UNRESOLVED, and must not be invented

**The pinned source does not settle it, and describes an in-play activity.** An independent
Compendium-only derivation reached this conclusion; an independent review then confirmed the
conclusion while refuting one of the arguments originally offered for it. Both corrections are
recorded below rather than quietly dropped.

What the source says: "You can carve a rune onto your skin with **10 uninterrupted minutes of
work**" and "You can have one rune active at a time, and can **change or remove** a rune with 10
uninterrupted minutes of work." Every clause is framed as a time-costed in-fiction activity, the
same shape as Stone Singer's "When you spend 1 uninterrupted hour singing".

**There is no sentence anywhere in the pin of the form "choose a rune when you create your
character", "you begin play with a rune", or "you know the following runes."** That absence was
established by searching the whole Heroes book for `rune` — **12 matching lines**: one chapter
thumbnail, four lines of the trait itself (the Light paragraph contains no occurrence), and seven
unrelated entries across the Basics, a gear table, treasures and a title — and by searching the
whole `en/` tree for "Runic Carving", which returns only the trait, its JSON twin, an index link,
the ancestry frontmatter label and the per-book mirror. The word never appears in
`making-a-hero.md` or `ancestries.md`. An earlier draft of this document said "ten hits" and
miscategorised two of them; the corrected count does not change the conclusion, but a number
offered as proof has to be right.

**What Forge actually does, corrected.** An earlier draft asserted that Forge models the rune as a
build-time choice and treated that as a tension to be resolved against. **That was wrong, and I
did not verify it before asserting it.** Forge marks the feature `selectAt: 'play'`
(`src/data/ancestries/dwarf.ts`, on `dwarf-feature-1`). The field's type is
`'build' | 'respite' | 'play'`, the factory default is `'build'`, and Forge uses all three
deliberately — Dragon Knight's Wyrmplate is `'respite'`, and Dwarf Traits carries no `selectAt` and
so is build-time. `HeroLogic.getConditionalFeatures` filters on `selectAt === 'play'` precisely to
classify a feature as an in-play selection rather than a build choice. **The structural reference
therefore agrees that the rune is not a creation choice.** That is corroboration, not authority, and
the question remains open on the source.

**One argument is withdrawn as refuted.** An earlier draft argued that `making-a-hero.md` states
every 1st-level option carries a Quick Build pick, that the Dwarf quick build names no rune, and
that a rune is therefore not a 1st-level option. The pin refutes this: the quick-build parenthetical
sits inside the **Purchased Traits** heading in every ancestry that has one and names only purchased
traits. Dragon Knight's is "Dragon Breath, Prismatic Scales" and names **no Wyrmplate damage type**,
although Wyrmplate unambiguously requires a current selection. The convention never covers
signature-trait selections, so the rune's absence from it carries no information either way.

**The strongest in-pin consideration on the other side**, which the earlier draft missed:
[Wyrmplate](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/wyrmplate.md)
is the pin's closest analogue — a free signature trait whose benefit requires a currently-selected
option, explicitly re-selectable in play ("You can change your damage immunity type when you finish
a respite"). The pin then hangs a purchased trait off that selection:
[Prismatic Scales](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/prismatic-scales.md)
reads "**Select one damage immunity granted by your Wyrmplate trait.**" That presupposes the
Wyrmplate selection exists at build time. So "the text describes an in-play, changeable activity"
does **not** by itself imply "not chosen at creation" in this rules set.

Two distinctions keep the rune unsettled rather than resolved by that analogue: Runic Carving has no
dependent purchased trait, and "change **or remove**" makes *no rune* a legal state, which Wyrmplate
has no equivalent of.

Recorded as an open question. Until it is answered, the proposed treatment is to grant the Runic
Carving **capability** with its full readable text and to model no mandatory creation decision. See
[V50's open questions](../build/V50-dwarf-level-one.md#open-questions).

## Purchased traits

Three ancestry points. Quick build: Grounded plus Spark Off Your Skin, which spends exactly 3.

| Trait | Cost | Source-backed effect | Build requirement and manual boundary |
| --- | ---: | --- | --- |
| [Grounded](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/grounded.md) | 1 | "+1 bonus to stability" | **Permanent build.** Stability 0 → 1. Cumulative with class and kit stability per [Stability](../../vendor/steel-compendium/en/unified/md/rule/character/stability.md) |
| [Stand Tough](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/stand-tough.md) | 1 | "Your Might score is treated as 1 higher **for the purpose of resisting potencies**, and you gain an edge on Might tests when called for to resist environmental effects or a creature's traits or abilities" | **Permanent derived value that is NOT the Might characteristic.** See below |
| [Stone Singer](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/stone-singer.md) | 1 | Reshape unworked mundane stone within 3 squares after 1 uninterrupted hour singing | **Manual.** No roll, no test, no resource; table-adjudicated |
| [Great Fortitude](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/great-fortitude.md) | 2 | "You can't be made weakened" | **Permanent flag** → `conditionImmunities` entry `weakened`, matching the existing Polder Fearless/`frightened` precedent |
| [Spark Off Your Skin](../../vendor/steel-compendium/en/unified/md/feature/trait/dwarf/spark-off-your-skin.md) | 2 | "+6 bonus to Stamina, and that bonus increases by 6 at 4th, 7th, and 10th levels" | **Permanent build.** +6 at level one, and the recovery value must be recomputed |

### Stand Tough must not raise the Might characteristic

The prepositional phrase limits the first clause absolutely. It does **not** change Might, and so
does not affect power rolls that add M, damage expressions of the form "X + M", the hero's own
weak/average/strong potency values (which derive from the highest characteristic score), which
characteristic is highest, or ordinary Might tests.

That this is fixed house phrasing rather than loose wording is corroborated twice inside the pin:
the identical sentence is the Hakaan trait of the same name and the same cost, and the second clause
reuses the exact trigger phrase from the
[Defend](../../vendor/steel-compendium/en/unified/md/feature/common/main-actions/defend.md) main
action.

**Resisting a potency involves no dice.** Per
[Potency](../../vendor/steel-compendium/en/unified/md/rule/character/potency.md), an effect is
applied "only if the effect's potency value is higher than the target's indicated characteristic
score" — a static comparison. Stand Tough substitutes `Might + 1` on the target side of that one
comparison.

**The discriminating case, for a hero with Might −1:**

| Ability potency | Without Stand Tough | With Stand Tough |
| --- | --- | --- |
| M < −1 | resists | resists |
| **M < 0** | affected | **RESISTS** ← the only band that changes |
| **M < 1** | affected | **still affected** |
| M < 2 | affected | affected |

Stand Tough converts exactly the `potency value == Might + 1` band and nothing else. **A Might −1
hero with Stand Tough facing "M < 1, prone" is still knocked prone.** Any implementation that models
the trait as "+1 Might", or that displays an unconditional improvement, fails this case. It is the
single most valuable regression test in this unit.

The edge half applies only to **Might tests** called for to resist environmental effects or a
creature's traits or abilities. It does **not** apply to resisting potencies (no roll exists there,
so the two clauses never both fire), to saving throws (a d10 against 6, not a power roll), to Might
tests that are not resistance tests, or to any other characteristic.

### Spark Off Your Skin scales by enumerated level, not by echelon

The trait says "increases by 6 at 4th, 7th, and 10th levels": +6 at levels 1–3, +12 at 4–6, +18 at
7–9, +24 at 10. Those thresholds coincide with the echelon boundaries, so an echelon-indexed value
is arithmetically identical across the pinned ten-level range — but the trait text does not say "per
echelon", and kits that do mean that say so (`kit/shining-armor.md` prints "+12 per echelon").
**Prefer a literal level-threshold representation.** This matters twice over: the existing
`amountOf` helper recognises only a closed literal vocabulary that does not include a six-per-echelon
form, and an unrecognised literal is silently skipped with no diagnostic — the defect V48 records as its gap C. V48 is
unmerged on `slice/V48`, so it is cited here by code location rather than by link.

Recovery value is "one-third of their Stamina maximum, rounded down", so +6 Stamina raises the
recovery value by exactly **+2** at every level; 6 is divisible by 3, so the floor never distorts it.
The builder must recompute it rather than cache it.

## Legal purchased-trait combinations

Costs: Grounded 1, Stand Tough 1, Stone Singer 1, Great Fortitude 2, Spark Off Your Skin 2. Budget 3.
Partitions of 3 are `1+1+1` and `2+1`; `2+2` is barred by the chapter's own worked example, which
states that a devil "couldn't select both Impressive Horns and Wings, since their combined cost of 4
exceeds the ancestry points budget".

**Seven sets spend exactly three points:**

| # | Set |
| ---: | --- |
| 1 | Grounded + Stand Tough + Stone Singer |
| 2 | Great Fortitude + Grounded |
| 3 | Great Fortitude + Stand Tough |
| 4 | Great Fortitude + Stone Singer |
| 5 | **Spark Off Your Skin + Grounded** — the printed quick build |
| 6 | Spark Off Your Skin + Stand Tough |
| 7 | Spark Off Your Skin + Stone Singer |

**Minimum builds to cover all five traits: three.** Great Fortitude and Spark Off Your Skin can
never share a build, so at least two are needed for them alone; any build containing a two-pointer
has at most one point left and therefore covers at most two traits; with only two builds the maximum
coverage is four. Three is achievable, so three is minimal.

## Comparison against the existing Polder reference

The [reference procedure](../build/character-verification.md#vary-ancestry-as-well-as-class-and-level)
asks for paired examples with the same class, subclass and level but different ancestries. The
existing counterpart is **Bethell Corrected V25** — Polder / Fire Elementalist 1 / Mage's Apprentice
/ no kit, in [the V45 inventory](v45-reference-inventory.md).

Holding Bethell's culture constant is legal: ancestry "doesn't grant you cultural benefits", and
`culture.language` carries no `dependsOn`, so Khoursirian is reachable for any ancestry. The Typical
Ancestry Cultures table suggesting Zaliac for a dwarf is an optional archetype, not a grant — the
background chapter makes the point with a dwarf example, contrasting one raised in the Great Wode
who speaks Yllyric with one from Kal Kalavar who speaks Zaliac. **A builder that auto-assigned
Zaliac on picking Dwarf would be wrong.**

Bethell's Might is **−1**, which makes the Stand Tough discriminating case live in the paired build
rather than requiring a contrived one.

Expected differences, ancestry only, everything else held constant:

| Value | Bethell (Polder) | Dwarf counterpart |
| --- | --- | --- |
| size | 1S | **1M** |
| speed | 5 | 5 (unchanged) |
| stability | 0 | 0, or **1** with Grounded |
| disengage | 2 | **1** — Graceful Retreat is a Polder trait; the dwarf has no disengage contribution |
| Stamina / recovery / winded | 18 / 6 / 9 | unchanged, or **24 / 8 / 12** with Spark Off Your Skin |
| `damageImmunities` | corruption 3 | **none** — Corruption Immunity is a Polder trait |
| `conditionImmunities` | frightened | **none**, or **weakened** with Great Fortitude |
| skills, languages, career, class grants | — | **identical**; the dwarf ancestry grants no skills, languages or characteristics |

The skill set being identical is the point of the pairing: it isolates the ancestry contribution and
exercises removal of the old ancestry's grants while preserving independent choices.

## What the ancestry does NOT grant

No languages, no skills, no characteristic scores, no Stamina base, no Recoveries, no abilities, and
no restriction on class, culture, career, kit or complication. The Dwarf has no ancestry-granted
ability, so the "Where an ancestry provides you with an ability" clause in the size-and-speed rule
does not apply. Height, weight, life expectancy and example names are flavour with no mechanical
effect; the stated weight does not change size or stability.

## Unresolved questions

Recorded in the [slice document](../build/V50-dwarf-level-one.md#open-questions). The rune-timing
question is the one that shapes the implementation; the others are narrower and none blocks the
unit's level-one work.
