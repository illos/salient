# V1 roadmap

Recorded 2026-09-14; development tracks revised with the user on 2026-09-15 after v0.01 acceptance.
Detailed behavior remains in the owning specs; this roadmap does not assign release dates or
intermediate version numbers.

Session handoff: [2026-09-16 checkpoint and next-session kickoff](checkpoint-2026-09-16-development-tracks.md).
Recheck its repository snapshot before resuming; it is not a second progress tracker.

## Current V1 release target — confirmed 2026-09-22

This is the user-confirmed target we are now building toward. Use it to prioritize slices and
assess V1 readiness. It supersedes broader earlier release-completeness expectations where they
conflict; the owning specifications still define how included features behave.

- **Characters and engine:** all eleven classes playable, with close to full engine automation
  through level two or three. The exact release ceiling (two versus three) remains open; level
  three is the proposed planning target, not a separately confirmed requirement. Valid builds,
  readable actions and paid manual records alone do not meet the automation target.
- **Foes:** a useful, varied roster for low-level play, with the selected foes' combat behavior
  implemented and tested. Complete monster bands/families and full-catalog automation are not V1
  requirements. The roster was confirmed on 2026-09-24: 36 stat blocks (goblins and bugbears,
  undead, humans, and the Arixx, Werewolf and Thorn Dragon), with orcs as a later stretch wave.
  See the [V1 foe roster](decisions/2026-09-24-v1-foe-roster.md).
- **App:** most app features working and tested, supporting practical play. The exact release
  checklist and any feature deferrals remain to be settled; this does not silently require every
  item in the older, broader V1 specifications.

Measure progress by usable play and verified persisted effects through the shared UI/CLI/API
operations. Report remaining manual mechanics explicitly. Source ingestion, character build support,
compiler recognition and passing action-record tests are separate from automated gameplay. The
precise acceptable manual exceptions to “close to full” remain open.

Continue the active engine coverage work toward this target. Prefer shared mechanics that improve
several classes and useful low-level foes, then prove connected encounters and the surrounding app
workflows. This direction does not assign new work to another thread or declare current slices
complete. Keep implementation status in [the build tracker](build/STATUS.md).

Higher-level character coverage (including the broader levels 1–10 design) and additional foe
families remain expansion scope; existing support beyond the release ceiling may remain available.

## Confirmed development tracks — 2026-09-15

Following the [v0.01 acceptance](build/evidence/v001-acceptance.md), organize further development into
five distinct tracks. Character and foe coverage can grow without waiting for complete parser/engine
support. UI/polish and app/social features are separate tracks; the user continues polishing the existing
UI and infrastructure.

This structure and the working arrangements below are confirmed by the user. The first assignments
listed later are recommended starting points; they do not settle unresolved mechanics or declare
unbuilt features complete.

| Track | Responsibility | Owning specifications |
| --- | --- | --- |
| Parser and rules engine | Interpret supported source wording, execute effects, collect missing facts, and preserve timing, state application and history through shared UI/headless operations. | [Engine](engine-architecture.md), [rules language](rules-language.md), [table](table-spec.md) |
| Foe coverage | Expand eligible core foe content, readable stat blocks, catalog access and encounter preparation/loading, distinguishing available content from supported creature mechanics. | [Monster catalog](monster-catalog-spec.md), [references](reference-library-spec.md), [table](table-spec.md) |
| Characters | Expand the character wizard, sheets, valid derived builds, advancement and progression history across eligible core options. | [Character wizard](character-wizard-spec.md), [sheets](character-sheet-spec.md) |
| UI and polish | Improve visual design, navigation, interaction clarity, responsive layouts and perceived performance across the app, including human playtest feedback. | [Tech stack](v1-tech-stack-spec.md), [table](table-spec.md), [sheets](character-sheet-spec.md) |
| App and social features | Develop the surrounding account and campaign workflows, settings, invitations/share codes, friendships, blocking, character sharing/delegated access and campaign chat within the existing release scope. | [Accounts and access](accounts-and-access-spec.md), [table](table-spec.md), [V1 checkpoint](v1-spec-checkpoint.md) |

The tracks share content identities, actor/build contracts and live-state boundaries. Complete ability
automation is not a prerequisite for making a valid character or exposing sourced foe content. Show
unsupported mechanics as source text with explicit manual resolution; never label content coverage as
verified automation. Character build evaluation still needs to produce correct supported derived values,
and special creature models still need their own state contracts before being advertised as playable.
Manual play follows the existing recorded-adjustment and partial-automation contracts; dependent automated
effects require actual resulting state/facts.

UI/polish owns presentation and usability across the feature tracks; those tracks own their functional
contracts. App/social owns account, campaign and sharing behavior, coordinating character access with
the character track and table authority with the engine/shared operations. These are areas of ownership,
not a sequential build order; individual changes retain their concrete dependencies.

This is a workstream decision, not approval of every proposed implementation or unresolved rule. The
[current release target](#current-v1-release-target--confirmed-2026-09-22) sets release breadth; the
[V1 checkpoint](v1-spec-checkpoint.md) retains detailed behavior and exclusions where compatible. Existing
[build slices](build/STATUS.md) remain the implementation tracker; split or refine their outlines when
claiming concrete work, preserving actual dependencies. Respite, inventory and integration remain
release work spanning the relevant tracks, with their owning contracts unchanged.

## Independent progress and shared contracts

Track completeness has separate dimensions: sourced content availability, valid character/creature
representation, verified automated behavior, and usable presentation. Report these separately. A fully
readable stat block may be partly automated; a valid character may still require manual feature resolution.
For a particular ability, report which effects were applied, which need table resolution, and which need
facts before dependent work can continue. Resuming automation must not apply a manual result twice.

Parser and engine remain one track, developed together in bounded end-to-end increments:
source text → structured effects → rules resolution → persisted state → visible log → history restoration.
Retain useful prototype code, reconcile it with current contracts, and test reusable mechanics against
contrasting source examples. A representative playable encounter with less manual bookkeeping is a useful
milestone; parser coverage counts alone do not establish that the encounter works.

Each slice has one primary track and coordinates with consumers when changing shared contracts. Content
identities and provenance connect foes/characters to the parser; derived character baselines remain separate
from live play state; registered operations connect rules, permissions, persistence and UI. Record affected
consumers and dependency changes in the slice work log. Agree the shared contract first, then merge a small
prerequisite slice when multiple tracks need it. Do not keep separate implementations of the same mechanic
in track branches or put rules logic in presentation code.

## User feedback and work cadence

The user continues UI/infrastructure polishing. Hands-on UI feedback primarily happens at the desktop and
may arrive slowly. Parser/engine discussion can advance through phone dictation, concise reports, concrete
source examples and screenshots. Foe source audits and character build/progression calculations can also
advance independently; wizard and sheet interaction design benefits from hands-on feedback. Ordinary
app/social work proceeds under existing contracts between the product decisions it needs.

User availability is a dependency of particular decisions, not of the whole project. Continue authorized
implementation, research and verification that do not depend on a pending answer. Ask only concrete material
questions, in plain text with a recommendation, and use the existing
[question queue](rules-questions-for-user.md) to carry decisions between build and user-facing threads.
Do not start a continuous questionnaire or treat silence as approval. Record answers in the owning spec.

Reports should state the behavior added, evidence, remaining manual/unsupported behavior, and the next
decision if one is needed. Provide screenshots for appearance and flows; provide recorded inputs, outcomes
and persisted-state/history evidence for mechanics. Automated acceptance supports tested behavior; it does
not certify enjoyable interaction or sustained table performance. User feedback on one screen does not
need to delay unrelated backend/content work.

## Branches, worktrees and environments

Keep `main` as the integrated, tested playable baseline. Each active track works in its own Git worktree
(a separate working directory), using short-lived `slice/<id>` branches that are reviewed, integrated
frequently and retired. Worktrees can be reused for the next slice from current `main`; tracks do not need
permanent divergent branches or to finish before contributing improvements. Additional simultaneous slices
need separate worktrees. The [build process](build/README.md#branch-and-merge-policy) owns setup, integration
and environment-isolation details.

Code isolation does not isolate a running backend. Changes to server behavior or schemas must be verified
against an isolated development backend, with distinct local configuration, ports and test data as needed.
The shared playable environment is updated through coordinated integration. Development data is still
disposable, but one track may not reset another track's or the user's active environment as a side effect.
No automatic deployment or new hosting requirement is introduced.

## Starting implementation

Use [the track kickoff](kickoff-development-track.md) for a new implementation thread. First establish the
actual current Git/build state and active work; the acceptance record certifies its recorded prototype
revision and scope, not every later change. Set up isolation for the first active slice and record its
track, owner, worktree/branch and development/test target in that slice's work log. Keep
[build status](build/STATUS.md) as the single progress tracker.

Recommended first assignments, to refine into bounded slices when claimed:

| Track | First useful assignment | Reviewable outcome |
| --- | --- | --- |
| Parser and rules engine | Assess `src/parser.ts`, `src/engine.ts`, shared resolution and their live integration against current contracts; identify reusable behavior and the first small set of mechanics to implement. | Evidence-backed implemented/experimental/missing inventory, then a sourced end-to-end slice with explicit manual fallback and history checks. |
| Foe coverage | Audit eligible core catalog coverage and the direct load path; select a bounded content/preparation gap independent of new complex creature automation. | Sourced entries are searchable/readable; supported live instances load correctly, with unsupported creature mechanics explicit. |
| Characters | Assess the minimal wizard/evaluator/sheet against the next bounded set of core choices and progression requirements. | Valid persisted choices and derived values, preserved live state, readable abilities, and explicit manual gameplay effects. |
| UI and polish | Review the current desktop build with the user and address a bounded interaction or readability problem. | Before/after screenshots and a working flow for desktop feedback, plus regression checks appropriate to the change. |
| App and social features | Select one settled account/campaign/social workflow from existing V1 slices and implement it through its access boundaries. | A connected usable workflow with permissions and relevant lifecycle behavior verified. |

These are not assignments to complete all five tracks at once. Existing V-slice outlines remain starting
material; split oversized work before implementation. In particular, V05 currently depends on V04: an
assessment can proceed now, but implementing a smaller independent automation slice requires recording
its actual dependencies rather than silently bypassing that gate. Respite, minions, inventory and other
cross-track work retain their source and product contracts.

A completed implementation slice includes its specified behavior, meaningful checks, required independent
and rules reviews, updated owning specs, and a handoff describing limitations. Follow the existing build
process for the exact checks and merge procedure. Neither this plan nor a source import is proof that a
feature has been implemented.

## Earlier specification sequence — 2026-09-14

The sequence below records the earlier specification discussion, not a requirement to finish each topic
before starting the five development tracks.

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

## Respite discussion checkpoint

The [respite rules deep dive](research/respite-rules.md) and
[source inventory](research/respite-source-inventory.csv) establish the initial core-rule findings.
The report separates source rules, bounded ambiguities and a proposed product-question order.

Participation revised 2026-09-14: include Director-controlled participant selection, defaulting to the
current party and allowing individual exclusions. This supersedes the earlier whole-party-only choice.
Individual sourced benefits and exceptions remain distinct; see [the owning contract](table-spec.md#respite-mode).

Sessions settled 2026-09-24: a session cannot close while a respite is open and unresolved, so respite
never spans sessions. Next within respite: level-up ordering, interruption and finishing (V161). Keep confirmed requirements, proposals and source findings distinct.
