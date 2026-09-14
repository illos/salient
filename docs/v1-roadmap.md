# V1 roadmap

Recorded 2026-09-14 at the user's request. This is the working order for continued specification toward
a stable V1, alongside the separate v0.01 build. Detailed behavior will be settled in the owning specs;
this roadmap does not assign release dates or intermediate version numbers.

The [v0.01 build handoff](web-app-build-handoff.md) and
[pre-alpha scope](pre-alpha-design-gaps.md) continue to govern the current build. The
[V1 checkpoint](v1-spec-checkpoint.md) retains the full release scope and existing exclusions.

1. **Respite and advancement:** complete the adventure–rest–progression loop. Define participation,
   start/completion/interruption, resource restoration, Victory-to-XP conversion, supported respite
   choices and the connection to leveling. Research mechanics in the pinned Compendium before settling
   behavior. Owning specs: [table](table-spec.md#respite-mode) and
   [character wizard](character-wizard-spec.md).
2. **Character changes:** settle current resources after leveling, full edits, progression restoration,
   detachment and duplication. Cover access changes during play and the resulting session/combat
   recovery. Owning specs: [character wizard](character-wizard-spec.md),
   [accounts and access](accounts-and-access-spec.md) and [table](table-spec.md).
3. **Inventory and prepared encounters:** complete loot distribution and preparation workflows,
   including claim eligibility, deposit timing versus character locks, saved foes/groups/squads/rewards,
   and independent loaded instances. Owning specs: [inventory](inventory-spec.md),
   [monster catalog](monster-catalog-spec.md) and [table](table-spec.md).
4. **Remaining combat support and release criteria:** finish unresolved resolution, response, clock,
   special-turn and history contracts; define and verify core content and automation coverage. Specify
   what must work reliably for stable V1, including the connected campaign-to-next-session journey,
   Forge Steel import, multiplayer access/retries/reconnect, mobile/tablet usability and sustained table
   performance. Owning references: [table](table-spec.md), [character wizard](character-wizard-spec.md),
   [reference libraries](reference-library-spec.md), [tech stack](v1-tech-stack-spec.md) and
   [V1 integration acceptance](v1-spec-checkpoint.md#remaining-work-before-complete-v1-play).

## Current discussion

The [respite rules deep dive](research/respite-rules.md) and
[source inventory](research/respite-source-inventory.csv) establish the initial core-rule findings.
The report separates source rules, bounded ambiguities and a proposed product-question order.

Participation revised 2026-09-14: include Director-controlled participant selection, defaulting to the
current party and allowing individual exclusions. This supersedes the earlier whole-party-only choice.
Individual sourced benefits and exceptions remain distinct; see [the owning contract](table-spec.md#respite-mode).

Next: whether respite can continue between closed game sessions, allowing players to complete their
choices asynchronously. This is still a proposal and would need an explicit contract against the current
running-session gameplay boundary. Keep confirmed requirements, proposals and source findings distinct.
