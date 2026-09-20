# V80 — Time Raider level one

Status: implemented in [V82](V82-remaining-ancestries.md); focused/full checks, independent reviews and hosted API proof pass. Forge live comparison and main delivery pending.
Branch `slice/V80`; unit owns new content/evaluator/tests. Shared registration belongs to the lead.

## Source and behavior

Authority: pinned Steel Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/feature/trait/time-raider/` and `feature/ability/time-raider/`.
Normal size 1M, speed 5, stability 0 plus kit. Psychic Scar grants psychic immunity equal to level.
Three points buy six traits. Psionic Gift requires one of Concussive Slam, Minor Acceleration or
Psionic Bolt. Unstoppable Mind appears inside `time-raider-traits.md`, not a standalone trait file;
it grants dazed immunity. Parent replacement prunes the gift selection and revokes its ability.

## Trait and action audit

| Trait | Classification and implementation |
| --- | --- |
| Psychic Scar | Permanent psychic immunity equal to level; no new action |
| Beyondsight | Maneuver to adjust or restore vision; trait retained and maneuver exposed with both effects |
| Foresight | Passive concealment benefit plus triggered action when targeted by a strike; both retained |
| Four-Armed Athletics | Conditional skill-test edge; no skill grant |
| Four-Armed Martial Arts | Modifies existing Grab/Knockback maneuvers and simultaneous grabs; no separate action |
| Psionic Gift | Mandatory nested choice grants one native signature ability with original action type and rules |
| Unstoppable Mind | Dazed immunity; no new action |

Gift grants use native Compendium ability entries, retaining power rolls, ranges and targets. The
prose actions use the shared trait action catalog. Effects remain manually resolved where the engine
has no automation; the wizard does not invent permanent characteristic, speed, skill or target bonuses.
Beyondsight's vision is a manual effect, not a choice that conditionally grants a different ability.

## Compact option witnesses

All witnesses set `ancestry.choice` to `Time Raider`. Purchases use
`ancestry.time-raider.purchased-traits`; the gift uses `ancestry.time-raider.psionic-gift.ability`.

| Legal completed purchases | Gift | Options witnessed |
| --- | --- | --- |
| Beyondsight, Psionic Gift | Psionic Bolt | Quick build, maneuver, native ranged signature |
| Foresight, Psionic Gift | Concussive Slam | Trigger and second ranged signature |
| Four-Armed Athletics, Psionic Gift | Minor Acceleration | Conditional skills and native maneuver |
| Beyondsight, Four-Armed Martial Arts | — | Additional Grab/Knockback targets retained as manual source |
| Foresight, Unstoppable Mind | — | Embedded immunity and triggered action |

All witnesses have psychic immunity 1 at level one. Fury fixture kit gives stability 2; all have
speed 5 and size 1M. Focused tests catch omitted nested grants, invalid or absent children, overspending,
omitted prose action/embedded trait and stale grants. Lead acceptance must compare all witnesses
against Forge and prove saved API create/reload and replacement. Browser testing remains suspended.
