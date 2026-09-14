# Question queue: duplicate and prior-decision audit

Date: 2026-09-14. Scope: all 32 actual question entries through Q-A-601, excluding the template.
The dedicated `question_queue_dedup_audit` subagent reviewed the queue against owning specifications,
the gameplay decision record and answered entries. The primary agent checked the actionable findings
and applied documentation corrections. This is a documentary audit, not a rules or implementation
certification. No new user rulings are inferred from proposals, research assertions or shipped code.

## Result

Before cleanup: 22 open and 10 answered/resolved entries. After cleanup: **20 open, 11
answered/resolved, and one engineering follow-up**. No duplicate IDs or exact duplicate question
blocks were found. Several questions share context but ask different remaining decisions.

- **Q-A-400 already has a policy answer.** Deliberate turn-rule departures receive warnings while
  access, session and coherent-state constraints remain enforced. Finished groups and spent entries
  retain their recorded state. Existing policy does not authorize competing ordinary active turns.
  The question is resolved from that policy; the A04 implementation repair remains outstanding.
- **Q-A-200 belongs to engineering follow-up.** A02 still owes evaluated baselines, so the temporary
  bridge is technically live. It is neither an obsolete issue nor a user-approved permanent override.
- **Q-A-600/601 were open entries beneath the Resolved heading.** Both now appear under Open.
- **Q-R-52 was an older answered duplicate already corrected in this discussion.** The September 12
  decision already gave ordinary newcomers an unused turn in the current round.

Evidence for Q-A-400: [Taking a turn](../../table-spec.md#taking-a-turn) allows warned deliberate
rule departures and separately forbids competing active turns;
[mid-combat regrouping](../../table-spec.md#mid-combat-additions-and-regrouping) preserves completed
groups, spent-entry history and warned adjudication. The
[adaptation principles](../../rules-adaptation-principles.md) explicitly distinguish coherent state
from disguising game-rule enforcement as technical validation. The current A04 refusal is an
implementation finding, not a new user decision. Its bundled active-group sequencing concern remains
engineering work under those constraints, not blanket approval of every option B behavior.

## Every initially open entry

| Question | Finding | Evidence and retained boundary |
| --- | --- | --- |
| Q-CHAR-2 | Unresolved; overlaps R-201 in context | [Wizard spec](../../character-wizard-spec.md), open decisions, and [live-state contract](../../live-state-initialization.md), section 3, leave changed-maxima/resource reconciliation open. Preserving damage and spent Recoveries is still a proposal. This concerns changing a build; R-201 concerns transfer. |
| Q-CHAR-3 | Unresolved | [Wizard spec](../../character-wizard-spec.md), Level-up and detachment, confirms clearing campaign XP while retaining level but leaves advancement eligibility open. The offset in [V1 contracts](../../v1-character-wizard-contracts.md) is proposed. |
| Q-CHAR-4 | Unresolved | [Progression history](../../character-wizard-spec.md#5-progression-history) preserves later records but leaves new choices after restoration open. Gameplay undo branching does not settle build-history policy. |
| Q-CHAR-5 | Unresolved | [Wizard flows](../../character-wizard-spec.md#4-wizard-flows) distinguishes reviewed full edits from ungated level-ups. Source-authorized reconfiguration has a separate proposed path in [V1 contracts](../../v1-character-wizard-contracts.md). |
| Q-CHAR-6 | Partial overlap; residual unresolved | Core-only mechanics and authored flavor are settled in the [wizard spec](../../character-wizard-spec.md) and [wizard foundation](../../character-wizard.md). The remaining boundary is custom selectable language identities and deity portfolios. The question now states that boundary without reopening ordinary authorship. |
| Q-CHAR-7 | Unresolved | [V1 contracts](../../v1-character-wizard-contracts.md) distinguish ordinary Revenant borrowing from a purchased trait's dependence on a missing signature trait. No prior ruling for this combination was found. |
| Q-CHAR-8 | Unresolved | [V1 contracts](../../v1-character-wizard-contracts.md) distinguish improving an event from applying both Melodrama improvements to the same event. No prior ruling was found. |
| Q-CHAR-9 | Partial overlap; residual unresolved | [V1 scope](../../v1-spec-checkpoint.md) defers projects; [V1 contracts](../../v1-character-wizard-contracts.md) leave the starting career grant's treatment open. Keep only the grant/balance/manual-allocation question; project automation is not reopened. |
| Q-CHAR-10 | Unresolved | [V1 contracts](../../v1-character-wizard-contracts.md) explicitly leave intentional ancestry under-spending open. Rejecting illegal budgets in the [wizard spec](../../character-wizard-spec.md) does not establish that under-spending is illegal. |
| Q-CHAR-11 | Unresolved after the fixed/fixed case | [V1 contracts](../../v1-character-wizard-contracts.md) establish fixed-grant collision treatment but leave fixed/chosen and chosen/chosen collisions open. Skill replacement entitlement is distinct from R-100's language-slot consumption. |
| Q-CHAR-12 | Unresolved | [Derived values](../../character-derived-values.md) and [V1 contracts](../../v1-character-wizard-contracts.md) leave the divergent modified-character potency case open. Q-R-2's damage-characteristic default does not answer potency. |
| Q-CHAR-13 | Partial overlap; residual unresolved | [Inventory](../../inventory-spec.md) includes starting equipment; [V1 contracts](../../v1-character-wizard-contracts.md) separately leave discretionary higher-level treasure allowances open. |
| Q-R-100 | Unresolved | [Fury decisions](../../fury-level-one-decisions.md) and [derived values](../../character-derived-values.md) explicitly label duplicate-language fixture acceptance provisional. The table-warning policy does not independently decide wizard completion or slot accounting. |
| Q-R-101 | Unresolved despite research overlap | Permutations appear in [V1 contracts](../../v1-character-wizard-contracts.md), whose opening status labels them research/proposed contracts. The primary [wizard spec](../../character-wizard-spec.md) and [Fury decisions](../../fury-level-one-decisions.md) retain provisional status. Research is not a recorded user answer. |
| Q-R-102 | Unresolved | [Fury decisions](../../fury-level-one-decisions.md) leaves the printed language pool provisional. This differs from custom identities (CHAR-6) and duplicate slot consumption (R-100). Corrected the queue's arithmetic to 34 table entries / 33 unique names because Khoursirian appears twice. |
| Q-R-103 | Unresolved despite research overlap | The kit split appears in [wizard research](../../character-wizard.md) and [V1 contracts](../../v1-character-wizard-contracts.md), but primary [wizard scope](../../character-wizard-spec.md) and [Fury decisions](../../fury-level-one-decisions.md) preserve provisional status. No user answer is inferred from that research. |
| Q-R-201 | Unresolved; overlaps CHAR-2 in context | [Wizard open decisions](../../character-wizard-spec.md#12-open-decisions) and [live-state section 3](../../live-state-initialization.md) separately leave transfer retention and changed-build reconciliation open. Cross-links explain when both apply. |
| Q-A-200 | Engineering follow-up | [A02 requirements](../A02-wizard-and-character-sheet.md) already require evaluated baselines and sourced admission values. At review, A02 was still in progress and the baseline-null bridge remained in use. Its provisional provenance is retained; no user answer is fabricated. |
| Q-R-3 | Unresolved | [Catch Breath](../../table-spec.md#v001-catch-breath) calls for verifying the cap; [R04 section 7](../../roll-and-damage-resolution.md#7-catch-breath-and-recovery-spending) labels it provisional. Earlier healing and temporary-Stamina decisions do not explicitly settle it. |
| Q-A-400 | Resolved from existing policy | The specific [regrouping contract](../../table-spec.md#mid-combat-additions-and-regrouping) preserves warned adjudication, while [Taking a turn](../../table-spec.md#taking-a-turn) separates eligibility from application permission. A04 must repair its refusal behavior while preserving coherent sequencing. |
| Q-A-600 | Narrow unresolved clarification | The [undo contract](../../table-spec.md#undo-permissions-and-proposed-campaign-control) establishes turn start as the outer limit, but no explicit answer says whether reversing the initiating Take turn itself crosses that limit. [A06](../A06-history-undo-corrections.md) calls its exclusion an interpretation. |
| Q-A-601 | Narrow unresolved clarification | [Modifier correction](../../table-spec.md#director-edits-to-inline-results) shares undo's temporal boundaries; [Enable user undo](../../table-spec.md#undo-permissions-and-proposed-campaign-control) explicitly names player undo permission. The setting's effect on correction permission remains unspecified. Reworded the premise to distinguish timing from permission. |

## Every previously answered or resolved entry

| Question | Finding |
| --- | --- |
| Q-R-1 | Correctly resolved by the explicit natural-roll decision and [independent source check](../../research/natural-roll-precedence.md). General critical-hit recognition alone had not explicitly settled double bane. |
| Q-R-2 | Correctly resolved by the current highest-permitted damage default in [R04](../../roll-and-damage-resolution.md#41-damage-expressions). The earlier [roll-default decision](../../gameplay-decision-record.md) expressly did not infer separate damage choices. |
| Q-R-52 | Historical answered duplicate, already corrected. The [decision record](../../gameplay-decision-record.md) records same-round newcomer acceptance on September 12. Preserve that provenance and the later source research. |
| Q-R-51 | Correctly resolved in [the Malice contract](../../conditions-and-clock.md#33-manual-parts-in-v001); the answer also establishes the explicit standing rounding convention. |
| Q-R-50 | Correctly resolved in [the Malice contract](../../conditions-and-clock.md#33-manual-parts-in-v001). Current participation refines the earlier automatic-lifecycle decision. |
| Q-R-200 | Correctly resolved in [live labels](../../live-state-initialization.md#23-labels-derived-at-read-time). Raising Stamina to clear Slain was distinct from initially marking zero-Stamina foes Slain. |
| Q-TS-1 | Correctly answered in [the clock contract](../../table-spec.md#game-clock-and-scheduled-rules-work). The later answer explicitly settles v0.01 save-ends automation, extending the overlap with manual-toggle saves. |
| Q-CHAR-1 | Correctly answered in [the wizard decision system](../../character-wizard-spec.md#3-decision-system). Preserve the rejected recommendation as history. |
| Q-HAND-1 | Correctly answered in [login footer wording](../../design-mockups/v1/README.md#login-footer-wording). |
| Q-REC-1 | Correctly answered in [monster scope](../../monster-catalog-spec.md). Feature deferral and keeping versus deleting dormant code were separate questions. |

## Cleanup and verification

The queue now keeps open questions, engineering follow-ups and resolved questions under matching
headings. Historical recommendations remain identifiable as recommendations, with current disposition
stated explicitly. Related character/language questions are cross-linked without merging distinct
decisions. The queue instructions require checking prior decisions before raising or asking a question.

The build tracker and A02/A04 handoffs identify the remaining implementation work. No application code
was changed and no behavior is certified by this cleanup. Validation: targeted Prettier check,
`pnpm check-links`, `git diff --check`, and a structural check of all 32 IDs and their section/status
placement.
