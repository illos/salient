# Minion specification consistency review

Checkpoint note: this report preserves the original review and subsequent rulings. Initial cleanup
findings describe that earlier snapshot; their fixes are integrated. Use
[the latest checkpoint](../spec-consistency-review.md#latest-rulings-checkpoint) and
[owning table contracts](../table-spec.md#minion-squads-and-captain-state) for current status.

Reviewed 2026-09-13 against the current user rulings and local Steel Compendium revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. This is a specification review, not certification
of implementation or complete interpretation of every minion trait. No vendor or runtime files changed.

## Verdict

The latest authoritative minion model is coherent. Its separate creature identities, squad pool,
shared turn, captain action allowances, coordinated targeting and final area-damage ceiling agree
with one another. Cleanup is chiefly needed where older summaries still call the selected UI open
or describe all turn bookkeeping as one creature with one spent-turn flag. The captain-with-extra-turns
case was a source ambiguity. Subsequent user ruling, 2026-09-13: only the captain receives its
personal extra turn; squad participation does not refresh. Attachment and benefits remain in place.

The review searched every Markdown specification and supporting research document for minion, squad
and captain references, then inspected the owning targeting, clock, initiative, history, catalog and
storage contracts and the general minion/captain sources. Historical fixture/parser coverage was
distinguished from future gameplay requirements. References below use paths and section names;
line numbers identify the pre-cleanup reading and may move during integration.

## Definite cleanup and clarifications

| Finding | Evidence | Minimal correction |
| --- | --- | --- |
| Research still presents the selected interaction surface as undecided. | [Lifecycle §3 and §12](minion-lifecycle.md), approximately lines 108–110 and 383–395, says the interaction surface is a product choice and member controls are not approved. [Table initiative groups](../table-spec.md#initiative-groups-confirmed-app-model), approximately 1391–1418, now confirms the subgroup, member targeting, assigned counts and captain actions. | Update only the research's current-status statements and remaining-issues table. Preserve its original source uncertainty and historical recommendations. Detailed visual layout is not another gameplay approval question. |
| General clock language can be read as serially starting each minion/captain. | [Game clock](../table-spec.md#game-clock-and-scheduled-rules-work), approximately 2015–2017, says boundaries belong to individual creatures. The [captain rule](../../vendor/steel-compendium/en/unified/md/rule/monster/captain.md#separate-actions-and-stamina) and [Acting Together](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#acting-together) require shared timing. | Explicitly preserve shared squad/captain timing while retaining each affected creature's own effects, saves and usage state. Switching member controls does not start a new individual turn or close response cards. Do not assign one saving throw to the whole squad. Subsequent user ruling: global “every turn” effects fire once per shared turn, not per participant. |
| Summary representations remain too narrow after the turn-entry refinement. | [Data architecture §5](../data-architecture-spec.md#5-encounter-actions-and-undo), approximately 538, distinguishes each creature's spent turn from group completion; [V1 roster summary](../v1-spec-checkpoint.md#sessions-roles-and-rosters), approximately 135, similarly attaches spent turns to creatures. The primary table already qualifies older ordinary-one-entry wording. | Summarize separate creature state, available/used turn entries, shared squad participation and group completion. One creature can own several entries; a shared squad turn still retains member identities. No database schema needs selecting in this cleanup. |
| “No extra minion-only interaction system” can sound inconsistent with the new subgroup UI. | [Command overflow contract](../table-command-spec.md), approximately 726–732, concerns the existing casualty response mechanism; the later confirmed subgroup/card provision is approximately 829–833. | Scope the older sentence explicitly to casualty selection. The accepted dynamic squad-turn UI reuses registered operations/cards; it is not prohibited by reuse of the existing casualty card. |
| Several summary paragraphs repeat entire decisions or retain broad “minion sequencing open” wording. | [Build handoff](../web-app-build-handoff.md), rows near 54/67/77 and appended paragraphs near 187–202; [rules status](../workstream-rules-status.md), near 47–58 and 316–337; [catalog preparation](../monster-catalog-spec.md#user-visible-flow), near 98–105. | Keep a concise current contract linked to the table. Leave only specific unresolved lifecycle/source interactions open. Preserve chronological rows in the decision record rather than deleting superseded answers. |

## Source constraints worth retaining in one compact owning paragraph

These are already sourced in the lifecycle research; they do not need another product vote or an
ability-specific interface:

- A squad has up to eight **same-name** minions and at most one eligible captain. A captain is a
  non-minion, non-Mount creature speaking a language they understand, and cannot captain a second
  squad. Its Stamina stays separate. See [squad](../../vendor/steel-compendium/en/unified/md/rule/monster/squad.md)
  and [captain](../../vendor/steel-compendium/en/unified/md/rule/monster/captain.md).
- A minion normally chooses move plus main action, move plus maneuver, or two moves. An individual
  maneuver excludes that member from the squad's main action/maneuver that turn. A signature critical
  grants another **main action only to participating minions**, not another turn or an action for the
  captain. Coordinated maneuvers and simultaneous same-squad free strikes have their own aggregation
  rules; the three-contributor cap belongs to the signature attack, not all minion activities.
  See [Acting Together](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#acting-together).
- Ordinary movement remains outside this client's mandatory bookkeeping. Showing per-member
  participation does not authorize new mandatory movement controls or claiming to know unreported
  movement. See [movement scope](../table-spec.md#game-clock-and-scheduled-rules-work) immediately
  before the game-clock section.
- Final area pool loss is capped by the applicable Stamina of affected members in that squad, after
  its modifiers; casualties stay within the affected set. A captain is calculated separately. The cap
  uses per-member squad values, not invented independent wounds. Non-area overflow retains nearest
  additional casualties and missing-fact cards. This is the **selected interpretation** of the
  [two source paragraphs](../../vendor/steel-compendium/en/unified/md/chapter/monster-basics.md#minions-and-area-effects),
  not proof the source supplies an unambiguous modifier algorithm.
- Required casualty identity is part of resolving the original action and its death/zero-Stamina
  consequences. It cannot silently expire like an unused optional response, deduct pool damage twice,
  or erase its causal record. Existing undo, pause, archive and saved-preparation contracts already
  cover the ordinary lifecycle; no new minion-only history mechanism is indicated.

The older [targeting cases](table-command-targeting-cases.md) and [command inventory](table-command-rules-inventory.md)
accurately quote the ambiguous modifier scope but should link to the selected final ceiling so their
“last”/“additionally drop” language is not reused to revive outside-area casualties. Historical
[milestone coverage](../milestone-1-review.md) legitimately supports only one target and at most
three attackers; that is an implementation limitation, not a contradictory intended rule.

## Bounded unresolved cases

| Case | What is established | What is still missing |
| --- | --- | --- |
| Multiturn captain | Captain eligibility does not exclude Solos; captain and squad act at the same time, with separate allowances. | Subsequent user ruling: personal extra turns are captain-only and do not refresh squad participation; attachment and benefits persist. The shared squad/captain entry must be distinguishable from personal extra entries; existing legal entry selection and source timing apply. The boss review records the selected interpretation. |
| Global “every turn” effects | Shared timing and each affected creature's personal due work must coexist. | Subsequent user ruling: one global firing per actual turn, including the shared squad/captain turn. Personal effects/saves remain per affected creature; a separate captain-only turn supplies another global boundary. |
| Damaged pool gains/loses a Stamina captain bonus | [Dwarf Axethrower](../../vendor/steel-compendium/en/unified/md/monster/dwarf/statblock/dwarf-axethrower.md) has Stamina 7 and +2 with captain. Captain benefits exist while attached. | Subsequent user rulings settle loss/gain: remove the bonus without casualties; add a replacement bonus for survivors only, without revival. Later non-area pool exhaustion defeats remaining ordinary members. Residual threshold arithmetic, a pool floor and area exhaustion with outside survivors remain bounded follow-ups. |
| Existing damaged squads change membership | Sources can summon, revive, transform or promote minions; saved encounters preserve prepared independent relationships. | Subsequent user ruling excludes manual live-squad splitting/merging: add a new independent squad entry, default four, with count 1–8. Explicit source-driven membership changes remain separate; ordinary initiative dragging does not change squad membership. |
| Different modifiers inside a shared attack | One squad roll; attacker identities, affected targets and conditions remain individual. | Differing participant edges/banes or characteristics require an interpretation without erasing those differences. The existing partial-automation policy is usable until that interpretation is settled. |
| Exceptional pool/death behavior | [Troll minions](minion-lifecycle.md#10-troll-exceptions-to-ordinary-death-and-healing) explicitly heal pools and delay/transform death; other features promote or revive. | Source-specific pool reconciliation and some incomplete source values remain research/automation coverage work. Do not present the ordinary no-healing/threshold formula as unconditional or invent missing values. |
| Captain/member removed during shared turn | Current-monster roster removal ends that monster's actual turn; a captain's death does not kill its squad, and squad depletion does not kill its captain. | Apply that administrative rule to the removed creature without accidentally exhausting surviving participants. A shared-turn removal path needs explicit handling before implementation; it is not evidence that ordinary removal should finish the whole squad. |

These issues do not invalidate the ordinary Director/player minion flow. Subsequent captain-bonus
rulings are recorded in the owning table spec: loss reduces the pool without casualties; later non-area
pool exhaustion defeats the remaining ordinary squad; gain adds the bonus for surviving members only
without revival. Non-exhausting damage thresholds after stat adjustment remain a bounded follow-up.

## Verification examples for later implementation

Use a small set of meaningful examples rather than one test per stat block: eight attackers allocated
3/3/2 with one roll; an opted-out member excluded from critical extra actions; four simultaneous
same-squad free strikes combining without the signature's three-member cap; per-creature saves on
shared timing; ordinary area damage plus weakness bounded to affected members; a partly damaged pool
with a casualty choice; separate captain damage; casualty consequences restored by exact redo; and a
saved squad/captain load followed by Void restore. These are coverage suggestions, not new prototype
milestone gates or claims that tests were run during this review.
