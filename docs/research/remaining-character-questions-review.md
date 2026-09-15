# Remaining character questions: rules and specification review

Date: 2026-09-15. Scope: all 13 questions open when the user requested this review:
Q-CHAR-2 through Q-CHAR-13, and Q-R-201.

Subsequent user decisions: Q-CHAR-2 now [preserves current amounts with downward caps](../character-wizard-spec.md#current-values-when-a-build-changes),
superseding the deficit-preservation proposal below. Q-CHAR-3 now [uses admission-level advancement eligibility](../character-wizard-spec.md#level-up),
with the campaign awarding XP and the character sheet owning level-up steps. Q-CHAR-4 now
[appends a new snapshot when restoring a build](../character-wizard-spec.md#5-progression-history),
with later edits continuing from that newest entry. Q-CHAR-5 now [uses normal edits for languages
and a dedicated respite option for kits](../character-wizard-spec.md#language-edits-and-respite-kit-changes);
other class exceptions are not established. The audit findings below
remain the historical pre-answer record; the queue is current.

## Method and result

Three independent research agents read the relevant local Compendium entries and surrounding Heroes
book context, then checked the owning specifications and existing decisions. The coordinating agent
reviewed the conclusions and directly checked the two proposed source resolutions. All game evidence
uses pinned revision `fb83a789da8f0327a389c277a0c790b1648d5810` in
`vendor/steel-compendium`. No web rules or other RPG precedent was used. Forge comparison is not rules
authority. References below name the actual source sections read; absence claims are bounded to this
research, not a claim to have proved that no passage anywhere could bear on a case.

**Result: two source resolutions, nine product decisions, two unresolved source ambiguities.**
The [queue](../rules-questions-for-user.md) now has 11 open questions. A recommendation below is
unanswered unless explicitly marked source-resolved. No new user ruling or app implementation is
claimed. Later class content remains outside the v0.01 Berserker/Mountain wizard scope.

| Question | Classification | Remaining issue or result |
| --- | --- | --- |
| [Q-CHAR-2](#q-char-2) | Product decision | Reconcile live resources after build changes |
| [Q-CHAR-3](#q-char-3) | Product decision | Advancement eligibility after campaign XP clears |
| [Q-CHAR-4](#q-char-4) | Product decision | New continuation after restoring an earlier build |
| [Q-CHAR-5](#q-char-5) | Product decision | Review path for narrow source-authorized changes |
| [Q-CHAR-6](#q-char-6) | Product decision | Scope of campaign language/deity identities |
| [Q-CHAR-7](#q-char-7) | Source ambiguity | Borrowed trait depends on absent Wyrmplate |
| [Q-CHAR-8](#q-char-8) | Source-resolved interpretation | Two improvements may target one owned event |
| [Q-CHAR-9](#q-char-9) | Product decision | Manual use of career project-point grants |
| [Q-CHAR-10](#q-char-10) | Product decision | Completion with intentionally unspent points |
| [Q-CHAR-11](#q-char-11) | Source ambiguity | Discretionary duplicate-skill replacements |
| [Q-CHAR-12](#q-char-12) | Source-resolved | Class-named potency characteristic takes precedence |
| [Q-CHAR-13](#q-char-13) | Product decision | Optional higher-level starting-treasure picker |
| [Q-R-201](#q-r-201) | Product decision | Transfer/duplication of existing live values |

## Q-CHAR-2

**Rules:** [Stamina](../../vendor/steel-compendium/en/unified/md/rule/health/stamina.md),
[Recoveries](../../vendor/steel-compendium/en/unified/md/rule/health/recoveries.md),
[Respite](../../vendor/steel-compendium/en/unified/md/rule/resource/respite.md), and
[Making a Hero](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md), Changing
Character Options, define damage, spending, actual restoration and changing options. They supply no
generic formula for mapping current resources to an edited build. [Clarity and Strain](../../vendor/steel-compendium/en/unified/md/feature/talent/level-1/clarity-and-strain.md)
permits negative clarity; a legal-range check cannot assume every resource has minimum zero.

**Spec check:** [Character concepts](../character-wizard-spec.md#2-character-concepts),
[revision lifecycle](../character-wizard-spec.md#7-revision-and-review-lifecycle) and
[live-state initialization](../live-state-initialization.md) already prohibit incidental healing,
stale draft state restoration and inventory rewind. Reconciliation remains explicitly open.

**Disposition:** Retain only changed-baseline reconciliation. Recommend preserving damage and
Recoveries spent for compatible resource types, with an atomic preview and explicit mapping for
incompatible values. Maximum/current 30/20 becoming maximum 36 would yield current 26. This formula
is an app proposal, not source-mandated restoration.

## Q-CHAR-3

**Rules:** [Making a Hero](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md),
Heroic Advancement, and [Experience](../../vendor/steel-compendium/en/unified/md/rule/resource/experience.md)
establish cumulative thresholds 0, 16, 32, …, 144 and advancement during respite. They do not define
campaign-transfer XP resets or eligibility offsets.

**Spec check:** [Level-up](../character-wizard-spec.md#level-up),
[campaign lifecycle](../character-wizard-spec.md#campaign-lifecycle) and
[higher-level contracts](../v1-character-wizard-contracts.md#9-higher-level-creation-advancement-and-revision-safety)
already retain level/build/history while clearing campaign XP/Victories. Eligibility is expressly open.

**Disposition:** Retain the app decision. Recommend an offset based on the admitted effective level's
minimum threshold: level seven starts at zero campaign XP plus offset 96 and needs 16 new XP for
level eight. Do not use a higher historical build's level or import old campaign XP.

## Q-CHAR-4

**Rules:** [Making a Hero](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md),
Changing Character Options (clean Heroes lines 1194–1202), permits changes in its stated context;
it does not define stored build revisions or history branching.

**Spec check:** [Progression history](../character-wizard-spec.md#5-progression-history) already
retains later records for forward restoration and keeps present inventory independent. New choices
after restoration remain open. Deleting the previous future is not an undecided retention option.

**Disposition:** Recommend recording a new continuation from the restored point, retaining the prior
future for inspection/restoration, with dated entries and an origin label. Existing activation review
applies; a general branch/merge interface is not required.

## Q-CHAR-5

**Rules:** [Kits](../../vendor/steel-compendium/en/unified/md/chapter/kits.md), Changing Your Kit,
and [Prayer](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/prayer.md) permit their
stated respite changes. [Making a Hero](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md),
I Speak Their Language, permits filling retained language choices later in play. Changing Character
Options distinguishes changes for dissatisfaction from tactical procedures; general respite ability
swapping is explicitly optional. These permissions do not define an app approval queue.

**Spec check:** [Wizard flows](../character-wizard-spec.md#4-wizard-flows),
[reconfiguration contracts](../v1-character-wizard-contracts.md#source-authorized-reconfiguration-versus-full-edit)
and [respite research](respite-rules.md) retain full-edit review and leave the narrow exception open.

**Disposition:** Recommend logged owner operations without full-edit review for the exact permitted
scope/timing, retaining locks and entitlement limits. Filling a language slot is not necessarily a
respite activity. This would not enable optional general ability swapping or exempt broad full edits.

## Q-CHAR-6

**Rules:** [Heroes](<../../vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md>),
Languages in Orden (lines 3341–3345), permits a Director's campaign language list; Culture Benefits
(lines 3217–3233) permits culture assembly. [Conduit Deity and Domains](../../vendor/steel-compendium/en/unified/md/feature/conduit/level-1/deity-and-domains.md)
and [Censor Deity and Domains](../../vendor/steel-compendium/en/unified/md/feature/censor/level-1/deity-and-domains.md)
permit a custom deity with Director permission and a four-domain portfolio. Conduits choose two domains;
Censors choose one. Four is the custom portfolio rule, not a cap on printed deity portfolios.

**Spec check:** [Fuller product scope](../character-wizard-spec.md#fuller-product-scope) excludes
homebrew mechanics. [Culture/language contracts](../v1-character-wizard-contracts.md#5-culture-skills-languages-and-careers)
explicitly leave campaign identities and combinations open while allowing authored flavor/core culture
assembly. Generic no-homebrew scope does not unambiguously classify every source-authorized assembly
of core domains. The scope researcher proposed closing this as a duplicate; the coordinating review
retains this narrower boundary because the owning contract explicitly leaves it unresolved.

**Disposition:** No new homebrew mechanics question. Retain whether source-authorized selectable
identities/portfolios fit V1; recommend printed core choices for now. Q-R-100 and Q-R-102 resolve
Caelian and spoken-language selection in v0.01, not custom identities or all fuller V1 language scope.

## Q-CHAR-7

**Rules:** Revenant [Former Life](../../vendor/steel-compendium/en/unified/md/feature/trait/revenant/former-life.md)
and [Previous Life](../../vendor/steel-compendium/en/unified/md/feature/trait/revenant/previous-life-1-point.md)
do not grant the former ancestry's signature trait. [Prismatic Scales](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/prismatic-scales.md)
costs one point but selects an immunity granted by the hero's [Wyrmplate](../../vendor/steel-compendium/en/unified/md/feature/trait/dragon-knight/wyrmplate.md).
The researched ancestry context (clean Heroes lines 1747–1801 and 2929–2957) supplies no substitute
for that absent dependency. Previous Life's two-point version and Tough But Withered were also checked.

**Spec check:** [Nested ancestry choices](../v1-character-wizard-contracts.md#nested-ancestry-choices)
explicitly preserve this gap; dependency/unsupported-state requirements do not settle its mechanics.

**Disposition:** Retain the exact ambiguity. One fixed, level-scaled immunity from Wyrmplate's six-type
list is a proposed adaptation only. It must not grant Wyrmplate, a second changeable immunity or a
general prerequisite bypass; existing immunity/weakness interactions still apply.

## Q-CHAR-8

**Rules:** [Melodrama](../../vendor/steel-compendium/en/unified/md/feature/troubadour/level-4/melodrama.md)
grants two new-event choices and allows forgoing a new event to improve an already-owned event,
including one gained with this feature. The alternative has no different-target or once-per-event
restriction. [Classes](../../vendor/steel-compendium/en/unified/md/chapter/classes.md), Stacking Unique
Effects, concerns overlapping ability uses/targets/durations; it supplies no prohibition on these two
permanent build choices. Drama and clean Heroes context (lines 15815–15825) were also checked.

**Spec check:** [Advancement contracts](../v1-character-wizard-contracts.md#advancement-through-all-ten-levels)
previously left this open; no user prohibition was recorded. The old queue recommendation added a
restriction absent from the source.

**Resolution by research:** Each entitlement may add a new event or improve an event already owned.
Both can improve the same previously owned event for +2 drama. Adding a new event then improving it
gives that event +1. Preserve both choice identities; do not select the same new event twice. The
source does not literally say “twice” or “each”; this is the compositional reading of its two-choice
grant and alternative, independently checked, not a new user ruling or universal stacking precedent.

## Q-CHAR-9

**Rules:** [Heroes](<../../vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md>), Career
Benefits → Project Points (lines 3477–3481), [Project Points](../../vendor/steel-compendium/en/unified/md/rule/downtime/project-points.md)
and the seven career entries establish 240 points for Artisan/Disciple/Sage and 120 for
Criminal/Farmer/Laborer/Warden. The benefit can be split among qualifying projects and spent once;
prerequisites still apply. Materials are at Director discretion. Use before adventuring is permitted
when conditions are met; otherwise the points can be retained.

**Spec check:** [Career grants](../v1-character-wizard-contracts.md#all-career-grants) preserves the
benefit; [V1 scope](../v1-spec-checkpoint.md) defers project workflows.
[Inventory authority](../inventory-spec.md) already governs resulting items.

**Disposition:** The grant is settled; the app spending workflow is not. Recommend retaining the
balance and allowing manual Director-recorded allocation to named core projects, with prerequisites
and resolution handled at the table. Alternatively retain the balance without spending controls.
Neither path grants free items, automates projects or replenishes spent points on career editing.

## Q-CHAR-10

**Rules:** [Ancestries](../../vendor/steel-compendium/en/unified/md/chapter/ancestries.md), Ancestry
Traits, and [Devil Traits](../../vendor/steel-compendium/en/unified/md/feature/trait/devil/devil-traits.md)/
[Memonek Traits](../../vendor/steel-compendium/en/unified/md/feature/trait/memonek/memonek-traits.md)
provide budgets and prohibit overspending. No mandatory full expenditure or later live reserve-spending
permission was found in those entries or clean Heroes lines 1505–1511.

**Spec check:** [Completion](../v1-character-wizard-contracts.md#completion-is-more-specific-than-a-nonempty-form)
and [decision system](../character-wizard-spec.md#3-decision-system) distinguish incomplete/invalid states.
R02's provisional under-spending warning does not establish a user completion policy.

**Disposition:** Retain only the product completion choice. Recommend acknowledged intentional
under-spending can complete with a warning; an unset choice remains incomplete, overspending invalid.
Later spending uses the established edit/review path.

## Q-CHAR-11

**Rules:** [Making a Hero](../../vendor/steel-compendium/en/unified/md/chapter/making-a-hero.md), Choosing
Skills, grants an unrestricted replacement when two sources grant the same specific skill.
[Warden](../../vendor/steel-compendium/en/unified/md/career/warden.md) plus
[Fury](../../vendor/steel-compendium/en/unified/md/class/fury.md) fixed Nature grants clearly qualify.
The wording neither defines “specific” as fixed-only nor expressly authorizes deliberately duplicating
a restricted choice to expand its pool. Conduit/Censor God's Library entries were checked: their
explicit replacement rules remain feature-specific exceptions.

**Spec check:** [Duplicate skills](../v1-character-wizard-contracts.md#duplicate-skills) already settles
fixed/fixed replacement and explicitly leaves discretionary collisions open. The Caelian decision is
about language slots and provides no general duplicate-entitlement precedent.

**Disposition:** Retain fixed/chosen and chosen/chosen cases only. Fixed-first resolution with
unrestricted replacements for unavoidable duplicates, then distinct choices from printed pools,
remains a proposed interpretation. Exhausted pools require their actual feature context.

## Q-CHAR-12

**Rules:** [Potencies](../../vendor/steel-compendium/en/unified/md/rule/character/potency.md) explicitly
says the basis is determined by class before describing highest-characteristic formulas.
[Conduit Basics](../../vendor/steel-compendium/en/unified/md/class/conduit.md) specifies Intuition;
[Fury Basics](../../vendor/steel-compendium/en/unified/md/class/fury.md) specifies Might.
[The Basics](../../vendor/steel-compendium/en/unified/md/chapter/the-basics.md), Game of Exceptions,
explicitly makes specific rules prevail over general ones. Matching clean Heroes sections were checked.

**Spec check:** [Baseline contracts](../v1-character-wizard-contracts.md#baseline-statistics-and-characteristic-assignment)
and [R02 potencies](../character-derived-values.md#110-potencies) recorded uncertainty, not a contrary
user ruling. Forge's highest-characteristic behavior is a compatibility difference, not authority.

**Resolution by research:** Use the class-named characteristic, subject to specific effect overrides.
A Conduit with Intuition 2 and another characteristic 3 has baseline potencies 0/1/2. Effects that
change how a hero resists potency do not automatically increase offensive potency. Remove Q-CHAR-12
as an unresolved label; ordinary Fury examples retain their existing numbers.

## Q-CHAR-13

**Rules:** [Heroes](<../../vendor/steel-compendium/en/books/heroes/clean/Draw Steel Heroes.md>), For the
Director → Treasures Above 1st Level (lines 27237–27246), describes an optional Director award when
starting a higher-level campaign; players choose the treasures. Guidance: levels 2–3 one first-echelon
trinket; 4–6 one leveled treasure plus that trinket; 7–9 two leveled treasures plus first-/second-echelon
trinkets; 10 two leveled treasures plus first-/second-/third-echelon trinkets. Each leveled treasure or
trinket can instead be one consumable of the hero's echelon or lower. [Echelons](../../vendor/steel-compendium/en/unified/md/rule/general/echelon.md)
defines the level bands.

**Spec check:** [Higher-level creation](../v1-character-wizard-contracts.md#9-higher-level-creation-advancement-and-revision-safety)
is required; [inventory](../inventory-spec.md) already permits Director editing. No dedicated optional
picker has been approved. Admission/readmission by itself is not the source's award trigger.

**Disposition:** Retain only whether V1 needs a Director-enabled picker for new higher-level starting
heroes or uses existing Director inventory editing. Recommend an explicit allowance and player selection,
including consumable substitutions, recorded once. Preserve existing heroes' retained inventory.

## Q-R-201

**Rules:** [Respite](../../vendor/steel-compendium/en/unified/md/rule/resource/respite.md),
[Victories](../../vendor/steel-compendium/en/unified/md/rule/resource/victories.md),
[Experience](../../vendor/steel-compendium/en/unified/md/rule/resource/experience.md), Stamina and
Recoveries define ordinary gameplay, not app transfer/duplication. [Surges](../../vendor/steel-compendium/en/unified/md/rule/resource/surge.md)
expire at combat end; [temporary Stamina](../../vendor/steel-compendium/en/unified/md/rule/health/temporary-stamina.md)
ordinarily expires at encounter end. Ferocity and Clarity/Strain have their own encounter-end reset
rules. Preserving live state must not resurrect already-expired values.

**Spec check:** [Campaign lifecycle](../character-wizard-spec.md#campaign-lifecycle),
[open decisions](../character-wizard-spec.md#12-open-decisions) and
[live-state initialization](../live-state-initialization.md) already settle XP/Victory clearing,
independent duplication and admission review. Non-campaign live values remain open for detachment,
duplication and later admission. First-admission initialization is not a reinitialization ruling.

**Disposition:** Recommend retaining existing non-campaign values after any already-applicable source
cleanup. Transfer itself neither heals nor invents a respite/encounter boundary. Existing manual
adjustment authority is not another transfer policy. Changed-baseline mapping remains Q-CHAR-2.

## Build handoff

The queue and owning potency/Melodrama contracts are updated by this documentation review. A02/R02/R03
owners should remove stale Q-CHAR-12 uncertainty markers from executable/generated artifacts and
check divergent-characteristic behavior when supported. This review does not claim those artifacts
have been repaired. V08 should preserve independent Melodrama choices and the repeated-improvement
case when later-level content is built. All eventual user operations retain shared UI/headless paths.

Participants: `remaining_lifecycle_research` (five lifecycle questions), `remaining_content_research`
(five content questions), `remaining_scope_research` (three scope/workflow questions), and coordinating
review by the question-thread agent. The earlier [queue deduplication audit](../build/audits/2026-09-14-question-queue-dedup.md)
remains a historical snapshot; this report records the subsequent source review.
