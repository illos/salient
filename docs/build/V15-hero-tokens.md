# V15: Hero tokens

| Field | Value |
| --- | --- |
| Family | V |
| Milestone | V1 |
| Owner type | App team with rules researcher |
| Rules review | required |
| Depends on | A09 |
| Unblocks | None |
| Status | see `STATUS.md` |

## Goal

Deliver the shared hero-token counter deferred from v0.01: a campaign-level pool with sourced gain and
spend rules, Director grants, player spends through registered operations with recorded causes and
before/after values, and the sourced uses (including the failed-save follow-up previously deferred).
Class- or monster-specific token granting features are not authorized by this slice; only the common
rule lifecycle is built.

## Spec references

- `docs/table-spec.md#v001-hero-tokens--deferred` — the deferral and what remains future scope.
- `docs/table-spec.md#persistent-values-and-manual-adjustment-entries` — pool edits as recorded adjustments.
- `docs/table-spec.md#game-clock-and-scheduled-rules-work` — where any reset or timed grant registers.
- `docs/pre-alpha-design-gaps.md#confirmed-v001-scope-by-feature` — hero tokens row.
- `docs/rules-adaptation-principles.md#confirmed-exception-resource-affordability` — a spend with zero tokens is blocked.
- `docs/v1-spec-checkpoint.md#settled-boundaries-to-preserve` — shared resource controls preserved.

## In scope

- Sourced contract for hero tokens: who holds them, when they are gained, what they can be spent on, when they reset.
- Shared pool per campaign; Director grant/remove; player spend with the use recorded.
- Spend options implemented as registered operations that apply the sourced effect where the common systems support it (for example the failed-save reroll), otherwise recorded manual resolution.
- Respite/session interaction as the source states (coordinate with V01).

## Out of scope

- Class/monster features that grant tokens (`agent.MD` and `docs/table-spec.md#v001-hero-tokens--deferred`: not authorized).
- Surge, Recovery and Malice controls (already delivered).
- Any invented pool size, reset timing or use.

## Inputs and dependencies

- Hard: A09 (persistent values, saves, clock, affordability check).
- Soft: V01 for respite-linked behavior if the source ties tokens to respite; otherwise record the interaction as pending.

## Deliverables

- `docs/hero-token-contract.md` — sourced rules with citations.
- Pool field, registered operations grant/spend, spend-option cards.
- Convex-test cases with expected values derived from the cited text; implementation note in `docs/table-spec.md#v001-hero-tokens--deferred`.

## Acceptance checks

1. Every gain, spend and reset rule in the contract quotes its Compendium sentence with path.
2. A Director grant of 1 token writes a log entry with cause and before/after pool values readable from the campaign query.
3. A spend by a player with a zero pool is refused with the affordability reason; with one token it succeeds and the pool reads 0.
4. The failed-save spend option applies a new save roll through the existing save operation and links both results in the log.
5. Observers cannot spend; players cannot grant.
6. Any token use the common systems cannot apply is recorded as manual with the source text shown, never silently applied.

## Rules research

- `vendor/steel-compendium/en/unified/md/rule/resource/hero-token.md`
- `vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md`
- `vendor/steel-compendium/en/unified/md/chapter/for-the-director.md`, `chapter/the-basics.md`
- `vendor/steel-compendium/en/unified/md/rule/resource/respite.md` — only to confirm any reset interaction.

No ruling in `docs/gameplay-decision-record.md` covers hero tokens.

## Open questions

Candidate `Q-V-n` entries:

- Whether the pool is shown to observers (`docs/table-spec.md#v001-hero-tokens--deferred` leaves audience unstated; compare `docs/table-spec.md#malice-visibility`).
- Token behavior across session closure and respite if the source is silent (record after research).

## Work log

_Empty._
