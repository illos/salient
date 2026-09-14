# Gameplay specification consistency review

Updated 2026-09-13 after the captain, shared-clock, squad-count and proportional-EV rulings.
This is a review of written contracts against the latest user decisions, not a claim that application
code implements them or that every core rule has been independently re-researched.

The [table specification](table-spec.md) owns gameplay behavior; [commands](table-command-spec.md) own
shared execution. Supporting specs, instructions, checkpoints and the app handoff now follow those
contracts. The [decision record](gameplay-decision-record.md) retains superseded historical choices.

## 2026-09-14 final audit

Documentation-only correction pass across the specifications; corrections in progress, see each file's diff.
No new rulings; no implementation, commit or deployment claimed.

- Table spec: `docs/table-spec.md`.
- Engine, data and tech-stack specs: `docs/engine-architecture.md`, `docs/data-architecture-spec.md`, `docs/v1-tech-stack-spec.md`.
- Wizard and pre-alpha scope: `docs/character-wizard-spec.md`, `docs/pre-alpha-design-gaps.md`.
- Accounts and product specs: `docs/accounts-and-access-spec.md`, `docs/product-features.md`.
- Decision record and status files: `docs/gameplay-decision-record.md` (superseded-row markers), `docs/workstream-rules-status.md`, `docs/workstream-app-status.md`, `docs/v0.01-readiness-audit.md`, `docs/v001-basic-play-walkthrough.md`.
- Handoff and checkpoint: `docs/web-app-build-handoff.md`, `docs/v1-spec-checkpoint.md`.

## Latest rulings checkpoint

The requested full specification sweep is complete. It checked all project specification/checkpoint
Markdown and supporting research for the new contracts, traced relevant source assertions to the pinned
Compendium, and reviewed their interactions with targeting, history, pause locks, saved encounters,
visibility and prototype scope. This pass was performed by the lead agent; the earlier three independent
reports remain evidence from their reviewed snapshots, not newly rerun reviews.

| Audit finding | Resolution |
| --- | --- |
| Captain changes and squad add/EV choices remained labeled open in several summaries. | Updated current checklists and research status; retained original source uncertainty and chronological rulings separately. |
| A squad’s pool could be mistaken for independent member health or a formula for living count. | Track living identities and pool separately. Bonus loss causes no casualties; gain applies only to survivors without revival. Ordinary fixed-threshold examples do not normalize living count after stat changes. |
| Generic pool-exhaustion wording could conflict with area-only casualties or special death traits. | Scope the confirmed exhaustion ruling to later non-area damage and ordinary minions; preserve explicit exceptions and outside-area survivors. Missing arithmetic remains named rather than invented. |
| Prepared counts, current living count, and repeated turn entries could give conflicting EV totals. | Apply count × printed EV ÷ printed quantity, preserving fractions. Templates retain prepared counts; live undefeated-roster EV uses living identities. Captain EV is separate; multiple turns never multiply a creature’s EV. Pool adjustments alone do not change membership/EV. |
| The command reference still moved creatures rather than selected turn entries. | Updated its proposed example to explicit turn references. Shared creature state, group completion, squad membership and per-turn participation remain distinct. |
| Generic active-monster removal summaries could exhaust an entire shared turn. | Scope ordinary removal/handoff wording and preserve surviving participants; exact shared-turn handoff remains a separate source case. Captain-bonus rules are already settled. |
| Clock registration wording assumed one affected creature and research mentioned separate object clocks. | The clock owns registered scheduling; due work can invoke abilities and collect affected entities. Sources supply behavior/state without a second schedule. Global work runs once per actual turn; personal effects/saves remain individual. |
| Long append-only handoff/status paragraphs repeated decisions and contradicted their own “remaining” sections. | Consolidated the status and handoff, organized the owning minion section, and linked checkpoints to one current queue. Historical decision records and source examples remain available. |
| Source research and current product scope could be conflated. | Marked earlier recommendations as historical where superseded. Default-four/1–8 entries, no manual live split/merge, captain-only extra turns and once-per-shared-turn clock work are settled. Terrain research still does not add saved terrain or expand the prototype. |

### Remaining questions after this pass

These are bounded gaps, not contradictions repaired by silently choosing behavior:

1. **Arithmetic after a captain adjustment:** count casualties on non-exhausting damage; define whether
   bonus loss reaching/passing zero clamps or retains a negative pool and how later damage is processed.
   The no-casualties-on-bonus-loss rule remains fixed.
2. **Area exhaustion with outside survivors:** after pool/count divergence, an area hit can exhaust the
   pool while unaffected minions remain. They cannot die from that area; the continuation of pooled
   damage/threshold accounting still needs a ruling. Do not import the non-area exhaustion rule.
3. **Other source-specific squad cases:** differing participant modifiers in one roll, transformations/
   revival, explicit multi-recipient turn grants and exact shared-turn handoff on removal. Shared versus
   personal captain entries need clear labels under the existing selection rules, not another turn grant. Manual live split/merge is deliberately excluded.
4. **Terrain and broader flow:** object save timing, simultaneous protective-object destruction and terrain
   product scope remain separate. Conditional costs, other source-specific response/ending sequences,
   FreePlay fictional-time reuse and respite retain their existing follow-ups.

Resume from [the table queue](table-spec.md#8-continue-exploring), one question at a time. No generic
Request test flow, standalone damage tool, roll-result cache, old-event editing, or new approval workflow
was introduced. No application implementation, vendor update, deployment or commit was performed.

## Earlier history and lifecycle cleanup

The following findings describe earlier passes; the current checkpoint above supersedes their pending
labels where later user rulings exist.

## Contradictions and stale guidance corrected

| Finding | Current contract |
| --- | --- |
| Access, data, product and acceptance summaries allowed player undo to turn/FreePlay start without the intervening-action restriction. | Player undo reverses the character's uninterrupted latest actions only to the nearest seam. Another character's committed action closes the window, regardless of shared controller; turn/FreePlay start remains the outer bound. Director rewind is sequential across seams within the current encounter. |
| The earlier End turn exception allowed a player to undo through a Director correction. | A committed Director correction is an intervening action under the current ruling. The old exception is superseded. Director rewind must unwind the correction before the earlier action. Automatic consequences remain linked to their cause. |
| Token-refund summaries could imply skipping a later optional spend to undo End turn. | Unwind the optional token action first, then End turn while the window remains open. Refund recorded spending and restore effect/clock state in sequence; exact Redo restores recorded results, while new execution rolls normally. |
| Broad prompt summaries described next-turn start as the only cutoff. | Still-valid opportunities survive End turn; next-turn start and explicit End combat close outstanding optional responses. An unrelated new ability closes that actor's earlier unused trigger. Ordered responses, required work and persistent effect lifetimes keep their established distinctions. |
| A current FreePlay checklist still treated request expiry as a settled live feature; research still described removal as pending. | Generic Director Request test UI/commands and their lifecycle are deliberately excluded for now. Verbal requests and direct character rolls are selected. Specific actions can retain test steps; missing difficulty leaves interpretation to the Director. This omission is not a spec gap. |
| Some character-context summaries were broader than the clarified UI rule, and the V1 grouping summary omitted the initial default. | Sheet/player pane follows the viewed character. Log cards act for their clearly labeled character independently. Explicit successful Take turn switches the invoking user's pane. Ordinary monsters initially get individual initiative groups; minion squads remain separate. |
| Void/cleanup wording suggested releasing every roster lock. | Encounter completion releases combat-imposed locks. The session pause lock still applies while paused; ordinary roster mutations remain blocked. Existing session-close/void and forced account/access-change policies remain separate. |
| A current scope queue still described settled blocking/deletion/departure policy as unanswered; grammar verification counts were obsolete. | Distinguish settled fuller-product policy from deferred prototype implementation and genuinely unresolved recovery details. That earlier syntax set had 90 cases and 10 explicit expected trees; earlier checkpoint evidence is labeled historical. |

The main history contract and related acceptance examples also distinguish undo from source-specific
response revisions. Lines of Force still uses its accepted apply-then-revise flow. The sequential undo
rule does not silently turn that ability response into a forbidden generic Undo operation.

## Remaining questions, not silently decided by cleanup

Resolved follow-up, 2026-09-13: the user requires sequential rewind of the entire intervening chain
before ordinary correction of an older event, even within the same turn. The first question raised by
this review is therefore settled; valid source-specific responses remain separate.

Resolved follow-up, 2026-09-13: the user rejected special same-boundary result reuse. Explicit Redo
restores recorded dice and consequences; new execution resolves current conditions with fresh dice,
including turn/round work. No extra roll cache or changed-effect reconciliation is required. The
Director can adjudicate reroll abuse using existing correction controls and history boundaries.

Follow-up review, 2026-09-13: the closeout product sequence is now settled: End combat ends turn
structure, required work completes, characters receive applicable cleanup choices, the Director confirms
Victory grants and finishes cleanup. Void uses its keep/reset choice and skips normal ending effects.
Both paths seal a historical archive. The Director-panel reset restores its combat-start gameplay snapshot,
including foes and loot. Standalone damage tools are deliberately excluded; result corrections and live-stat
adjustments provide Director fine-tuning. These are no longer unanswered product questions.

The end-to-end review still identifies the following work; it does not certify a complete combat flow:

1. **Special turn scheduling.** Confirmed follow-ups: groups contain actor-linked turn entries.
   Granted entries default to new groups at the bottom unless source timing requires otherwise. A
   forced normal turn consumes its round turn and returns to the interrupted group. An immediate
   granted turn interrupting an individual turn returns to that same unfinished turn with spending
   intact, without extra start/end boundaries. Regrouping moves only the selected turn entry, an
   implication the user identifies as already established by this model. No separate confirmation
   is needed for that behavior. Other multi-creature/source sequences require source verification;
   raise another product question only when a concrete case exposes a choice the contracts do not answer.
2. **Dependent responses.** The Parry/Ferocity example is resolved by clarified existing precedent:
   Thorn taking another action or spending the hit's resources closes that hit's response window,
   including allied prompts. Correct the earlier actor-only interpretation. Preserve ordered response
   chains, unrelated events' windows and ordinary sequential history. No special dependency-repair
   mechanism is approved; any further case must be checked against this clarified contract first.
3. **Source coverage and engineering follow-through.** Required cards must recover without lost input
   or duplicate effects. Precise source timing, conditional costs, cleanup ordering, durable operations
   and concurrency need implementation contracts and verification. Those requirements do not by
   themselves call for new product controls or another approval of the general card/clock rules.

FreePlay fictional-time rules and respite remain separate fuller-product work. Exact visual placement,
empty-group styling and optional character-switch prompts are not combat-flow completion gates.

The checks also covered adjacent access, character, inventory, catalog and dice contracts. Separate
inventory/progression history, public versus private information, affordability, source-timed grants,
manual-resolution support and warning-only game-rule departures were preserved. No additional product
policy was chosen merely to eliminate an open question.

## Creature action-economy review, 2026-09-13

Three independent reviews cover [minions](research/minion-spec-review.md),
[bosses and captains](research/boss-and-captain-turn-review.md), and
[all 35 core dynamic terrain entries](research/dynamic-terrain-action-economy.md).
Their findings describe the reviewed snapshot; the following cleanup is now integrated into the owning
specifications and supporting checkpoints:

- Replaced creature-wide spent-turn shorthand with turn-entry state and shared creature identity.
- Preserved shared squad/captain timing and individual participation without serial artificial turns.
- Consolidated the selected squad card and final area-damage ceiling; retired stale UI proposals and
  earlier outside-area weakness implications.
- Marked repeated mixed-group activation and counter-only boss proposals superseded.
- Kept ordinary active-monster removal from implying that surviving shared-turn participants lose
  their allowances. Exact shared-turn removal remains a source-specific follow-up.

The later captain, shared-turn, bonus, count and EV rulings are consolidated in
[the current checkpoint](#latest-rulings-checkpoint). The earlier reviewers’ follow-up checked their
then-current corrections. Its 694-link/17-document result is historical and is not the validation count
for the present full sweep.

## Validation

- All **1,307 local file/anchor links across 62 Markdown documents** resolve, including project instructions.
- Existing command syntax fixtures: **90/90 pass**. The revised proposed group-move example parses with
  explicit turn references; syntax validation does not certify operation semantics or implementation.
- `git diff --check` passes. Reviewed the affected prose against the latest rulings after consolidation.
- Steel Compendium remains clean at `fb83a789da8f0327a389c277a0c790b1648d5810`; Forge Steel remains clean
  at `5a846aadb623a9855a023e9403bb887a956c341f`.
- This audit changed documentation/instructions only. Existing app work was preserved; no application
  tests, implementation changes, commit or deployment were performed.
