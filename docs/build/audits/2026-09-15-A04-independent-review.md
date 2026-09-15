# A04 independent code and rules review

Reviewer: `review_a04`, fresh delegated review, 2026-09-15. Baseline `3b06832`; reviewed the
working-tree A04 repairs while the separate A07 implementation was active. After review, the lead
authorized the narrow test wording and stale documentation corrections identified below; no gameplay
implementation was changed by this reviewer.

**Verdict: code and rules pass for the scoped A04 repair. Full integration verification remains
with the audit lead.** No gameplay or authorization blocker found in these repairs. The focused
suite passes all 19 tests after accepting the concurrent A07 closeout refusal wording.
This verdict does not claim browser or visual testing.

## Independent source and specification checks

Verified the local Steel Compendium pin is `fb83a789da8f0327a389c277a0c790b1648d5810`.
Read these source files directly; did not consult online rules or treat the implementer's report as
source evidence:

- [Combat Round](../../../vendor/steel-compendium/en/unified/md/rule/combat/combat-round.md):
  starting-side surprise and d10 procedure; alternating sides; no ordinary repeated turn; exhausted
  side exception; successive complete enemy group turns; subsequent rounds start with the original
  starting side. The existing both-surprised and empty-side adjudication path correctly identifies
  its application interpretation rather than inventing a source rule.
- [Malice](../../../vendor/steel-compendium/en/unified/md/rule/monster/malice.md): average Victories
  at combat start, hero count plus round number at round start, and end-of-encounter loss.
  [Dying and Death](../../../vendor/steel-compendium/en/unified/md/rule/health/dying.md) distinguishes
  dying from death and allows acting while dying. The current-participation rule is already settled
  in [conditions and clock §3.3](../../conditions-and-clock.md#33-manual-parts-in-v001): remaining
  hero entries, each hero counted once, dying heroes included, fractional starting average rounded
  down. The repair follows Q-R-50/51 without adding death automation.
- [Surprise](../../../vendor/steel-compendium/en/unified/md/rule/combat/surprised.md) lasts through
  round one; [End of Next Turn](../../../vendor/steel-compendium/en/unified/md/rule/combat/end-of-turn.md)
  covers current-turn versus next-turn expiry. Existing registration and matching follow those
  boundaries. Scheduled queue ordering is the explicit
  [app clock policy](../../conditions-and-clock.md#23-order-of-due-work-at-a-boundary), not a claim
  of a general source ordering rule. Q-TS-1 continues to prohibit automatic saves in v0.01.

[Take turn](../../table-spec.md#taking-a-turn) and the documentation audit of Q-A-400 already
answer the hard-refusal question. The repair correctly warns for spent entries, completed groups,
and departure from an unfinished group's activation. It retains spent and completed history,
preserves the unfinished activation, records the actual detour's own turn/group identity, and allows
no competing active turn. Access and running-session restrictions remain enforced. No new user
question or broader rules interpretation is needed. Mid-round arrivals follow the already answered
Q-R-52; granted entries in tests exercise identity and do not introduce a deferred feature producer.

## Code review and verification

Reviewed `convex/lib/combatOperations.ts`, `initiative.ts`, `clock.ts`, the setup-card and `mayEnd`
changes in `convex/encounters.ts`, and `web/table/initiative.tsx`, with the relevant persisted-state
regressions in `tests/app/combat.test.ts`. Also inspected the schema and shared operation authority
path. New lookups remain indexed and bounded; public encounter reads require authenticated campaign
access, operation dispatch retains role/actor/session checks, and gameplay writes remain journaled.

The UI now binds each displayed entry explicitly, allows warned repeated turns, and still disables
Take turn while another actual turn exists. The shared operation enforces the same constraint.
Malice uses a set of current hero actor IDs instead of the frozen setup list. Clock firing re-reads
registration status and timing so ordinary work can retire later work before it fires; save
eligibility is read after ordinary work. The new round's expected side accounts for an exhausted
original side while retaining the historical starting side. Stale setup cards from another session
are excluded. Closeout cannot expose or execute End turn from a stale active-turn pointer.

Ran `pnpm exec vitest run --project app tests/app/combat.test.ts` at 00:15 UTC:
**18 passed, 1 failed**. The failure is an assertion-only A07 integration mismatch at
`tests/app/combat.test.ts`: the test expects `/Structured turn play|Combat has ended/`, while the new
shared registry correctly refuses with `Combat is in closeout; finish cleanup before taking turns
or using abilities.` Accept the closeout refusal in the expectation and rerun. The preceding
assertion that the read model sets `mayEnd` false passed. The other tests cover persisted turns,
entries, groups, Malice, events, snapshots, permissions, pause, queue retirement and save ordering.

After the narrow assertion correction, the same focused command passed **19/19** at 00:16 UTC.
Scoped ESLint passed for the six A04 code/test files listed above.

## Review corrections

Updated the historical implementation notes in `docs/table-spec.md` around A04 regrouping and clock
behavior to describe the implemented warned path and dynamic hero count. Updated the
`heroParticipantIds` comment in `convex/encounterTables.ts` to identify the starting snapshot rather
than the live count, and corrected the regroup regression comment to distinguish ordinary eligibility
from a warned deliberate departure. The closeout assertion now accepts the A07 shared refusal.
These corrections reflect already confirmed behavior and introduce no new policy.

No deployment, commit, vendor edit, browser run, or visual comparison was performed by this reviewer.
