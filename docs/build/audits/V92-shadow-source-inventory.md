# V92 Shadow level-one source inventory

Independent source inventory by WIZARD.2 delegated source reader, 2026-09-20. This is a rules
inventory, not an implementation review. Only the pinned Steel Compendium was used:
`fb83a789da8f0327a389c277a0c790b1648d5810`. Paths below are relative to
`vendor/steel-compendium/en/unified/md/`.

## Baseline and choices

`class/shadow.md`, Basics and Shadow Advancement Table, establishes Agility 2; arrays
`2, 2, -1, -1`, `2, 1, 1, -1`, `2, 1, 0, 0`, or `1, 1, 1, 0` for the other four characteristics;
starting Stamina 18; 8 Recoveries; and weak/average/strong potency of Agility minus 2,
Agility minus 1, and Agility. At Agility 2 those potencies are 0/1/2.

The class grants Hide and Sneak, then five choices from Criminal Underworld or the exploration,
interpersonal, or intrigue groups. Criminal Underworld is available, not mandatory.
`chapter/making-a-hero.md`, Choosing Skills, says that receiving the same specific skill from
two different sources permits a replacement from any skill group. Fixed grant overlaps must
therefore retain that replacement opportunity; rejecting a repeated selected skill must not
suppress replacement for overlapping fixed class, college, career, or culture grants.

`feature/shadow/level-1/shadow-abilities.md` establishes one signature, one 3-Insight ability,
and one 5-Insight ability. The individual files under `feature/ability/shadow/level-1/`
confirm these memberships through their signature subtype or cost and absence of a college restriction:

| Choice | Options |
| --- | --- |
| Signature | Gasping in Pain; I Work Better Alone; Teamwork Has Its Place; You Were Watching the Wrong One |
| 3 Insight | Disorienting Strike; Eviscerate; Get In Get Out; Two Throats at Once |
| 5 Insight | Coup de Grace; One Hundred Throats; Setup; Shadowstrike |

Every Shadow also gains Hesitation Is Weakness, a free triggered action costing 1 Insight
(`feature/ability/shadow/level-1/hesitation-is-weakness.md`).

## College grants and costs

Sources: `feature/shadow/level-1/shadow-college.md`, `1st-level-college-features.md`, and
`college-triggered-action.md` in that same directory, plus the named individual ability files.

| College | Skill | Maneuver or feature | Triggered action |
| --- | --- | --- | --- |
| Black Ash | Magic | Black Ash Teleport | In All This Confusion |
| Caustic Alchemy | Alchemy | Coat the Blade; Smoke Bomb | Defensive Roll |
| Harlequin Mask | Lie | I'm No Threat | Clever Trick |

In All This Confusion has no base cost and an optional Spend 1+ Insight effect. Defensive Roll
has no base cost and an optional Spend 1 Insight effect. Only Clever Trick has a mandatory
1 Insight cost. Black Ash Teleport and Coat the Blade similarly have optional Spend 1+ Insight
effects, and I'm No Threat has an optional Spend 1 Insight effect, with no mandatory base cost.

Smoke Bomb modifies the existing Hide maneuver rather than granting a separately named action
(`feature/shadow/level-1/smoke-bomb.md`). I'm No Threat gives +1 Disengage only while its illusion
lasts, not as an unconditional baseline. Its body text specifies the illusion's termination and
surge gain; that paragraph is absent from the frontmatter effects list and must not be lost
when presenting the ability (`feature/ability/shadow/level-1/im-no-threat.md`).

## Insight boundary

`feature/shadow/level-1/insight.md`, Insight Outside of Combat, applies to both abilities and
effects that cost Insight. After use, the same ability or effect cannot be used outside combat
again until the hero earns one or more Victories or finishes a respite. An unlimited-spend
effect is used as if spending Insight equal to current Victories. The shorthand “once per
Victory or respite” omits these distinctions. Combat gains and edge discounts remain separate
rules in the same source.

## Kits

`feature/shadow/level-1/kit.md` grants kit access, corroborated by the introduction to
`chapter/kits.md`. Ordinary-kit eligibility is confirmed. Exclusion of Stormwight kits remains
the project's stated interpretation: explicit Stormwight access is granted by
`feature/fury/level-1/beast-shape.md`.

The four witness kits have these bonuses, from their respective `kit/*.md` files:

| Kit | Stamina bonus | Speed bonus | Stability bonus | Disengage bonus | Signature |
| --- | --- | --- | --- | --- | --- |
| Cloak and Dagger | 3 per echelon | 2 | 0 | 1 | Fade |
| Sniper | 0 | 1 | 0 | 1 | Patient Shot |
| Swashbuckler | 3 per echelon | 3 | 0 | 1 | Fancy Footwork |
| Panther | 6 per echelon | 1 | 1 | 0 | Devastating Rush |

Zero denotes no listed bonus, not an absolute character value. Ancestry and other selected
grants must still be included when deriving complete witness values.
