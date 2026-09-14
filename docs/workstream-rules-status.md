# Rules/combat workstream status

Checkpoint: **2026-09-14 — game basics first**. This is specification work, not an implementation
report. G4's [combat checklist](pre-alpha-design-gaps.md#v001-combat-acceptance-checklist) remains,
with the [new runtime boundary](pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope):
defer class/stat-block-specific execution and stop reviewing those features one by one for v0.01.
The previous turn-start Ferocity inclusion is superseded; all unique class-resource logic is manual.

Common Malice lifecycle, Stamina/winded, ordinary-foe Slain status, clock/saves, shared action/dice/state
operations, fixed costs from known inputs, manual adjustments, persistent log, undo/redo and closeout
remain required. The Director edits persistent numeric values on their own displays; each edit appends
a Manual adjustment entry. The log exposes editable inputs only through case-specific interactive
cards. Hero-dying automation and the other G4 deferrals remain.

**Active:** [the draft basic-play walkthrough](v001-basic-play-walkthrough.md). Foe hiding is deferred
beyond v0.01: all loaded foes are visible, without hide/reveal or Add visibility controls; full stat
blocks remain Director-only. F2 is closed by this scope choice, including hidden initiative questions.
Confirmed: player/Director-supplied edge and bane counts feed automatic shared-roll arithmetic
and recorded inputs/results; discovery of every modifier source is not required. Next-attack
controls are also confirmed: start at zero, set before target-completion firing, record with the
accepted attack and reset afterward. Placement remains flexible for playtesting. The characteristic
default is confirmed: automatically select the highest permitted current value with a pre-fire
choice available. Target-specific edge/bane counts for multi-target attacks are confirmed, with
inputs and outcomes recorded by target. Input composition is settled: enter each target's
complete counts directly, with no attack-wide field or inherited stacking layer. See
[the target-only clarification](v001-basic-play-walkthrough.md#next-review-case-attack-wide-and-target-specific-counts).
Complete and verify the common-operation contracts, including actual persisted
state, log records, manual resolution, retries and history. G1–G3 remain hero creation/evaluation/
initialization dependencies. Preserve experimental parser/engine research for later feature work.
Resume only material product questions, one at a time; ordinary source definitions are research work.

## Where to read

| Document | Responsibility |
| --- | --- |
| [Table specification](table-spec.md) | Authoritative gameplay, lifecycle, targeting, timing and history. |
| [Minion contracts](table-spec.md#minion-squads-and-captain-state) | Entry/count/EV, shared participation, pooled Stamina and captain behavior. |
| [Commands and action cards](table-command-spec.md) | Shared UI/palette/slash/headless operations and continuations. |
| [Command reference](table-command-catalog.md) | Proposed spellings; no implemented API claim. |
| [Pre-alpha checkpoint](pre-alpha-design-gaps.md) and [V1 checkpoint](v1-spec-checkpoint.md) | Immediate versus fuller-product scope. |
| [App build handoff](web-app-build-handoff.md) | Integration contracts for the separate app thread. |
| [Decision record](gameplay-decision-record.md) | Chronological recommendations, answers and superseded alternatives. |

## Effective gameplay baseline

- **Opening and rosters:** draft until Director OK; then snapshot and combat locks before initiative.
  Active players/Director may roll; observers cannot. Ordinary monsters initially have independent groups.
  Both rosters are locked while paused. FreePlay damage/resources carry forward under source startup
  rules, but earlier actions never consume the new combat economy or replay themselves.
- **Turn entries:** entries link to creatures; spent entries, live creature state and group completion
  remain distinct. Drag only the selected entry. Additions receive a current-round turn in a new bottom
  group. Unspent arrivals can join active groups, never reopen finished ones; genuine round completion
  does not fabricate unacted turns. Source-required immediate turns preserve/resume interrupted contexts
  without refreshing spending or duplicating boundaries. Extra main actions are not full turns.
- **Minion addition and EV:** one squad entry defaults to four, with plus/minus selecting 1–8. Another
  squad is another entry; no manual live split/merge or refill through the add control. Captain is
  additional to eight. EV = count × printed EV ÷ printed quantity, retaining fractions; six at EV 3 per
  four cost 4.5. Captain EV is separate; repeated turns do not multiply it. Prepared counts and living
  membership are distinct, and pool Stamina is not a count of creatures.
- **Squad actions:** members/captain retain individual targets and effects. Use one coordinated squad
  roll with up to three participants per target; captain actions have their own costs, rolls and Stamina.
  Personal extra captain turns do not refresh the squad. The subgroup shares a turn, not serial member turns.
- **Squad Stamina:** track current pool and surviving identities separately, with no personal current
  Stamina. Bonus loss reduces the pool without casualties; replacement bonus gain adds only for survivors,
  without revival. Later non-area damage exhausting the pool defeats remaining ordinary members, subject
  to explicit exceptions. Area damage remains capped at affected minions’ combined applicable Stamina and
  cannot kill outside the area. Derive known casualties and collect only missing identities, once.
- **Clock:** abilities register turn/round effects; the clock owns scheduling and shared-operation dispatch.
  Global work runs once per actual turn, including one shared squad/captain turn. Personal effects/saves
  remain per creature. Separate captain turns supply new boundaries; selection/resumption does not.
  Due work uses enqueue order and save-ends last, preserving source exceptions and applicable effects
  applied before the final save phase. No wall-time advancement or synthetic closeout tick.
- **Actions, costs and partial automation:** all table controls use registered shared operations and ordered,
  attributed log entries. Show full used-action text and actual results. Fixed costs debit automatically;
  optional spending remains a choice; unaffordable execution blocks while legal negative ranges remain
  valid. Other game-rule warnings are advisory. Unsupported effects can be marked Resolved at table;
  dependent automation still requires real facts. Standalone damage tools are deliberately excluded.
- **Targeting and navigation:** ordinary single/self inputs can auto-fire; multi-target cards preserve all
  required choices. Persistent areas confirm each firing with prior membership prefilled; dependent work
  waits. Resolve now handles unobserved triggers. Sheets follow the viewed character; log cards bind their
  labeled actor. Explicit successful Take turn switches only the invoking user’s pane. Ordinary board
  movement is not recorded, and no I moved/Convert to maneuver buttons are selected.
- **Responses:** apply the triggering outcome, then append a valid response’s effective revisions.
  Still-valid prompts survive End turn until next actual turn start or End combat. An affected character’s
  new action or spending of the hit’s grant closes that hit’s window for all responders, including allied
  Parry; preserve explicit response chains and unrelated events. Undo can restore a valid opportunity,
  but never creates duplicate entitlement or bypasses seams/authority.
- **History:** players sequentially undo uninterrupted own-character actions to the nearest seam and
  turn/FreePlay outer bound. Another character’s action or Director correction closes that window,
  regardless of shared controller. Director rewind is sequential across seams in the current encounter.
  Older edits require undoing all intervening gameplay. Exact Redo restores recorded dice/state; a new
  execution rolls afresh. Clock registrations, participation and identities restore with their causes.
- **Closeout:** End combat ends structured turns and closes old optional responses; required caused work
  completes before source ending effects/rewards. Each character receives applicable optional cleanup
  choices. Director confirms Victories (editable initial 1, including 0), then Finish cleanup closes
  unused choices and archives. Void keep/reset skips ordinary cleanup; reset restores the entire
  precombat Director gameplay snapshot, including foes/relationships and loot. Void while paused keeps
  the pause lock. Neither terminal path can be reopened by gameplay undo.
- **Scope and visibility:** generic Request test UI is deliberately excluded; verbal requests and direct
  rolls remain, with source-specific test steps. Known difficulty follows the campaign visibility setting
  even in history. Show Malice defaults off; full monster stat blocks stay Director-only while used-action
  text remains in the log. Terrain research does not add saved terrain. Playable retainers/friendly
  monsters remain beyond V1; broader references and source coverage are not prototype gates.

## Research and evidence

Research uses only pinned local Steel Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`. The earlier independent
[minion](research/minion-spec-review.md), [boss/captain](research/boss-and-captain-turn-review.md), and
[35-entry terrain](research/dynamic-terrain-action-economy.md) reviews inform the later user rulings.
The [lifecycle report](research/minion-lifecycle.md) and
[116-entry inventory](research/minion-statblock-inventory.csv) retain source evidence and exceptions.
The [research index](research/README.md) also links command/targeting, trigger, test and clock studies.
Their historical recommendations are not automatically current product policy.

## Remaining decisions and next work

Prioritize the common-operation walkthrough under [re-scoped G5](v0.01-readiness-audit.md#g5-automation-level-for-the-furygoblin-exchange)
and the remaining G1–G3 hero contracts. Do not resume the class/stat-block feature questionnaire;
those runtime automations are deferred. Research shared rules, define inputs/outcomes and verify
persisted behavior without inventing feature effects or re-asking settled product choices.

Use [the table queue](table-spec.md#8-continue-exploring) for fuller-product follow-up. Deferred
creature numeric cases include non-exhausting damage after bonus adjustment, the pool floor,
and area exhaustion with unaffected survivors. Other cases include mixed squad-roll modifiers,
source-driven membership changes and multi-recipient turn grants, and exact shared-turn removal handoff.
Terrain object saves/protective-object destruction, conditional costs, source-specific response/ending
sequences, FreePlay fictional-time reuse and respite remain bounded work in their respective scope.

Exact schemas, dispatcher/parser implementation, required-input recovery and concurrency verification
remain engineering work. The current audit is documentation-only; it does not certify application behavior.

## Earlier checkpoint audit (historical)

Earlier passes validated 90 and later 97 syntax fixtures; those counts describe their respective
snapshots. Current link/whitespace results and this audit’s scope are recorded in
[the consistency report](spec-consistency-review.md#validation). No previous engine test or independent
review is claimed to have rerun merely because the documentation checkpoint was refreshed.
