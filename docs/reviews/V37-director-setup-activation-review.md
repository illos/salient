# V37 Director setup and activation review

Date: 2026-09-17. Independent reviewer: complication researcher. This review covers other agents'
`convex/lib/characterDirectorSetup.ts`, activation changes in `characterBuild.ts`, draft context in
`characterSecrets.ts`, the character submission/restore callers and the private frontend controls.
The reviewer did not implement these changes. No local test/build workloads were run; CT114
verification belongs to the lead.

This review supersedes the earlier `V37-private-director-review.md` statement that the picker is
not mounted on an owner-private draft. V37 now intentionally authorizes a separate draft context
only when the character owner is also the selected destination campaign's Director. The ordinary
character owner still cannot inspect or choose a Director's private inheritance.

Status: **static review passed after restore correction; remote verification pending.**

Authority: pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`,
`en/unified/md/complication/strange-inheritance.md`, the character revision/review contract in
`docs/character-wizard-spec.md`, and V37's explicit deferral of gameplay activation/revelation.
The Convex reviewer skill was applied for authorization, indexed access, concurrency and validator
checks. Private identity remains separate from owner-authored choices and public snapshots.

## Original finding: P2 — restore rolls back the very draft needed for private setup

An owning Director has an admitted effective build without Strange Inheritance, and a historical
complete draft containing Strange Inheritance that has never received a private campaign item.
`characters.restore` inserts a restored draft, then invokes normal submission. Owning-Director
submission immediately calls `activateRevision`; its new guard correctly rejects missing setup.
Because the call is in the same transaction, the restored draft is rolled back. The private picker
correctly accepts only the current draft/effective/proposed revision, so the Director cannot choose
the item against the historical source to make this restore succeed.

The source-required guard should remain. Preserve the restored draft while deferring automatic
submission for this specific owning-Director pending-setup case, then allow the existing draft
picker and explicit submission. Ordinary player restores should still create a pending review;
the Director can configure that proposed revision before approval. The backend author acknowledged
the reproduction and is adding the bounded fix and a persisted regression test.

## Checks with no additional blocking defect found

- Normal players can submit a complete owner build without access to the private choice. Submission
  creates the pending campaign association needed for the Director's proposed picker. Approval
  waits for setup and leaves the prior effective build, live state and events unchanged on refusal.
- An owning Director can configure their own current draft before submission. The endpoint requires
  both character ownership and ownership/membership of the explicit destination campaign. It
  refuses another player's unsubmitted draft and an attached character's different campaign.
- Public readiness text contains no item identity. Private rows are indexed by character and
  campaign, and setup checks cannot borrow another campaign's row. The saved item must belong to
  the exact source pool, have its canonical source path, and originate from a revision belonging to
  this character that actually selected Strange Inheritance.
- Item identity continues across unchanged later build revisions; a later source choice does not
  imply that a historical private row was authored against that later revision. Private writes still
  bind current character revision, exact authorized build ID, view, campaign and private version.
- Both source-setup reads and activation happen in the same Convex mutation. Concurrent private
  changes participate in normal transaction conflict handling. Exact command retries retain their
  result and cannot substitute a different item request under the same command ID.
- Campaign admission, full-edit approval, owning-Director immediate submission and scoped
  advancement all reach the guarded `activateRevision`. The separate unattached activation helper
  preserves an unresolved draft without changing effective/live data and does not infer a Director
  from a past campaign. Restore's distinct deadlock is the finding above, not a guard bypass.
- The standalone frontend leaves player submission enabled while showing pending setup. It adds
  the private draft picker only for a viewer directing the selected destination campaign, and waits
  for a private item before immediate owning-Director submission. Effective/proposed sheet pickers
  retain explicit displayed revision/view and do not silently switch to an unseen proposal.
- The new app tests cover player admission, attached full edits, owning-Director pre-submit draft
  setup, cross-campaign refusal, stale revision writes, invalid private source/origin, and standalone
  save/restore preserving current state. These tests were read, not executed by this reviewer.

## Nonblocking later-state note — closed

The standalone private picker initially used `!draftIsEffective`, while submission eligibility uses
`!campaignId || !draftIsEffective`. An unattached retained-effective hero needing a new destination's
setup should use the latter condition for the picker too. The current public backend does not expose
detachment, but the declared future detachment contract and seeded retained-state tests make this
worth keeping aligned. Re-read the final mount guard: it now uses
`!character.campaignId || !character.draftIsEffective`, matching submission eligibility. The
nonblocking observation is closed.

## Re-review

Re-read the corrected `characters.restore` branch and final test in
`tests/app/characterDirectorSetup.test.ts`. The branch now checks setup only for the owning campaign
Director before automatic submission. When setup is missing, it retains the restored immutable
draft and leaves effective/live data unchanged. The ordinary current-draft private picker can then
save the choice, and explicit submission activates and logs that exact restored revision. Ordinary
player restores still follow their pending-review path. A valid existing private choice still permits
the prior automatic owning-Director activation behavior.

The regression test creates the actual failure sequence: an admitted owning Director saves an
unconfigured historical Strange Inheritance draft, saves a different current draft, restores the
historical source, confirms draft persistence/current-state preservation, configures the private item,
then submits and verifies the restored revision becomes effective with a logged review.
**The P2 is closed by static review; no remaining blocking defect was found in this scope.**
CT114 tests/browser checks remain the lead's responsibility. No independent runtime pass is claimed.

### Final display re-review

Verified that `SupportingBuildFacts` now displays the stored `pending-Director` placeholder as
“The Director records this item privately.” A saved public baseline intentionally cannot disclose
the secret row or track its later setup status; it therefore must not falsely claim that setup is
still awaiting completion. Actual readiness remains the reactive `characters.get.pendingDirectorSetup`
field, rendered by submission controls. The revised static label is accurate both before and after
private setup and exposes no item identity. No implementation changes were made by this reviewer.

The lead reports the browser exercised player submission → Director proposed private save → approval,
retained the effective private picker, and confirmed the owner receives no private item identity.
The lead also reports 648 full checks passed before a subsequent generator import-alignment fix;
the final browser rerun is in progress. These are lead-reported results, not independent execution.
