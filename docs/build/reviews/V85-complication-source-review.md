# V85 independent complication source review

Reviewer: fresh Astra delegated source reviewer, 2026-09-20. Reviewed complication catalog and eligibility changes independently; did not author those changes. This reviewer authored V86's starting-item action catalog, which is explicitly excluded from this review and needs a different reviewer.

Status: source representation and independent proof-code review pass for candidate `b15fc5952dd1ca94dab9520398fa571c3573b22e`; formal acceptance remains blocked on deployed API evidence.

## Scope and evidence

Read all pinned core complication bodies for action, activity, possession and resource language, then compared the new prose catalog's timings, triggers and conditions with their complete source. Compendium pin: `fb83a789da8f0327a389c277a0c790b1648d5810`. No online rules, abandoned pilot inputs or browser testing.

An independent read-only source check confirmed all 49 final action texts appear in the pinned source, with only Markdown blockquote-prefix normalization permitted for older embedded ability cards. Newly authored metadata was separately checked: exact source text alone cannot establish the correct action cost or trigger.

The new source-timed entries correctly retain distinct Crash Landed activation/deactivation, Hawk Rider summon/dismiss/restore, Secret Identity transitions and War Dog Collar reset. Unspecified timing remains unspecified. Guilty Conscience uses a free triggered action and one Recovery; Bereaved depends on a hero token and cannot silently obtain free advice when that resource is unavailable. Dragon Dreams actions retain selected-trait and five-Victory prerequisites.

Gnoll-Mauled's explicit prohibition on characters who cannot be dazed and the Stormwight Fury exclusion for Slight Case of Lycanthropy match the pinned source. These are eligibility restrictions, not merely cautionary source notes.

## Findings

1. **Cult Victim movement operation omitted.** Although it modifies movement, the source gives a distinct voluntary once-per-turn passage through thin solid matter. Expose that choice through the same explicit manual action surface used for comparable item movement, retaining forced-exit/irreducible-damage consequences. Corrected and verified in the final catalog.
2. **Psychic Eruption's alternate timing omitted.** The source requires Psychic Blast as a free triggered action when the hero becomes bleeding, frightened or weakened. The main-action card alone loses this use. The final catalog includes the separate source-triggered card with `All Heroic Resource`; the independent public proof now checks actual entire-pool payment for both modes and undo for the main mode; the run result remains required.
3. **Rogue Talent alternate free strike.** The author additionally identified the source permission to use Telekinetic Grasp as a ranged free strike. A separate manual card should preserve that timing without inventing a main action or triggered-action cost. The final catalog includes that source-timed alternate card and retains the original maneuver.

Related V86 possession findings were delivered to the lead: Advanced Studies notebook, Crash Landed power pack, War Dog Collar loyalty collar and Sibling's Shield shield are source-owned objects; the V86 ledger now includes them. This is not evidence of general inventory or companion support.

## Completion boundary

Passing this review approves source representation within the documented manual-action boundary. It does not certify temporary class learning, antihero/destiny/hero-token pools, automatic cooldowns, transformations, followers, companion entities or full item effects. Their missing state/application routes must remain explicit. Authenticated public API proof and separate implementation review must establish persisted behavior, current-condition projection and authorization before completion.

## Proof-code readback

Independently reviewed the final complication matrix/table and starting-reward API witnesses and their shared application test adapters. They test persisted public operations, resource debit/block/history and conditional availability rather than merely reproducing catalog calculations. The detailed scope and historical-fixture boundary are recorded in [the implementation review](V85-V86-implementation-review.md#independent-complication-and-reward-proof-review). Source completeness remains grounded in the all-row pinned-source audit; manual gameplay limitations are unchanged. This reviewer did not run the full check or live batch; the lead’s result is recorded below.

## Lead verification record

The lead's full `pnpm check` on `faa9b1e` passed: 345 engine plus 519 app/script tests
(864 total), including final proof assertions, and the production build. This records the lead's
run, not an additional reviewer execution. The isolated CT114 deployment of `b15fc59` failed
its existing initial function-push readiness guard before any live API scenarios could start.
No retry or infrastructure repair was attempted; the environment is stopped with data retained.
[Evidence and logs](../evidence/V85/README.md) distinguish local proof from the blocked live gate.
The static/source review verdict is unchanged; delivery acceptance is not granted.
