# V107 — Summoner level one

## Goal

Complete the last level-one class in the editor, including circles, formations, commands, portfolios and sourced manual actions.

## Scope

[Character scope](../character-wizard-spec.md#1-product-outcome-and-scope),
[participation boundary](../table-spec.md#2-participation-and-presence), and
[reference source contract](../reference-library-spec.md#confirmed-release-scope).
Pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810` only. No vendor changes.

Four characteristic arrays, four circles, four formations, four quick commands, six 5-Essence abilities;
25 minion options (13 signature, 12 cost-three). No ordinary kit at level one. Pixie Dust gives two
Recoveries; Elite changes each minion's Stamina/stability, Horde changes summon limits; hero modifiers
never leak from minion statistics. Summoner Strike replaces ordinary free strikes in sheet and API.

Labelled interpretation: `class/summoner.md#Summoner Advancement` lists `1, 1, 3, 3`, while
`feature/summoner/level-1/portfolio.md` maps each circle to its family. Read as two distinct known
signature species and two distinct known three-Essence species within that portfolio. Alternative:
repeated selection could denote duplicate species; that grants no additional known option and is not
explicitly stated. Record in the rules questions file; no other source silently fills the gap.

All summoned-creature combat, shared turns, squads, automatic resource income, sacrifice discounts,
recovery spending, outside-combat reuse, summons/transformations and timing stay explicit/manual under
the existing table scope. Every action records source effects through `commands:invoke`; fixed Essence
costs debit the hero pool, waived outside combat. These are manual records, not summoned actors or
claims of automated combat. Portfolio statistics and full sources remain readable. Higher-level
linked reference articles do not enable higher-level builds.

## Acceptance checks

Independent Compendium ledger covers every circle, formation, command, heroic choice and all 25
portfolio entries. Public create/admit/read journeys compare persisted builds. Every distinct manual
record gets invoked, event readback, cost/debit/empty-pool refusal and unchanged affected state.
Circle edits prune obsolete portfolio, unauthorised edits refuse, level two remains unsupported.
TESTER owns generators, full check and isolated cohort. ENGINE independently reviews source and proof.

## Work log

- Started from main `a0792cd`. ENGINE source audit requested. Runtime work in progress.
