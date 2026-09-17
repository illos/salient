# V37 private Director choice review

Status: **original private-flow review passed with inspected remote evidence; later owned changes independently reviewed elsewhere**, 2026-09-17. Independent static review of
another implementer's private Strange Inheritance flow. No local runtime, build or tests were run;
the lead owns CT114 verification.

Reviewed `convex/characterSecrets.ts`, the additive `characterSecrets` table in
`convex/characterTables.ts`, `tests/app/characterSecrets.test.ts`,
`web/character-sheet/secret-inheritance.tsx` and its mount in `sections.tsx`. Traced relevant
authorization, command receipts, pending-review lifecycle and public sheet/history projections.
Read the Convex expert/reviewer skills and schema before review. Rules source is the pinned
`en/unified/md/complication/strange-inheritance.md`; build lifecycle follows
`docs/character-wizard-spec.md` and V37 acceptance items 3–4.

## Original finding — resolved

**P2 — The private editor can record provenance against a different revision from the sheet.**
`characterSecrets.ts:22–31` always prefers a current pending submission containing Strange
Inheritance over the effective revision. `characters.sheet` defaults to the effective revision
when one exists, while `sections.tsx` passes only `characterId` to `SecretInheritance`. The private
query and widget receive neither the sheet view nor its displayed revision.

Concrete sequence: an attached hero has effective revision E with Strange Inheritance; its owner
submits full-edit revision P retaining the complication. The Director opens the ordinary effective
sheet, which explicitly displays E. The private widget loads P, sends P as
`expectedBuildRevisionId`, and a successful save records `basedOnRevisionId: P`. No stale warning
appears because the private query and private editor agree with each other; they disagree with the
sheet being reviewed. The same component renders on proposed sheets, so its intended revision
cannot be inferred from character identity alone.

Pass the displayed revision/view through the private query and validate that it is an authorized
effective or pending revision, or explicitly label and select the private editor's revision context
so it cannot silently differ. Keep campaign-wide item continuity if intended; that is separate from
claiming which build a write was based on. Add an app/browser case with simultaneous effective and
pending revisions containing the complication, then withdrawal or approval. Existing tests exercise
pending admission only and do not distinguish those concurrent contexts.

## Checks with no defect found

- Both endpoints resolve the authenticated user, campaign owner and current membership before
  exposing or changing the private row. This matches `requireDirector`'s current v0.01 ownership
  contract. Owners, ordinary members and outsiders get null/refusal rather than item identity.
- Item choices are constrained server-side to the source-listed second-echelon pool and canonical
  source path. Client-provided arbitrary item names cannot create a secret row.
- New writes check campaign, character revision, authorized build revision, private version and
  combat lock. Revision reads and row updates occur in the same Convex mutation. Exact command
  retries return the original version; changed arguments with the same command ID are rejected.
- The row is separate from authored details, selections, public revisions, evaluations and events.
  No public query over the secret table or command receipt fingerprints was found. Existing app
  tests check owner/peer projections, revision history and unchanged public event output.
- The row records author, timestamp and originating build revision. Querying another campaign
  uses a separate indexed key. Complication removal makes the endpoint unavailable; pending
  admission withdrawal also removes access.
- `useCommand` reports failures through the existing error toast and retains retry identities.
  The editor disables writes on observed version/build changes and during combat.

The source's later operational threshold, first revelation and one-time Wealth loss remain gameplay
state work under the authorized deferral. This review does not certify that automation or infer its
completion from private build setup. Static access review is not a substitute for the planned CT114
tests and browser verification.

## Re-review

Re-read the corrected endpoint, widget, mount and fifth app test on 2026-09-17. The query now takes
an effective/proposed view and displayed revision; the selected server context must match both.
Its default agrees with the sheet. The widget forwards that view and revision, displays the context,
and sends `expectedView` alongside its existing build ID/version guards. It is not mounted on an
owner-private draft. The mutation resolves only the authorized current effective or pending build,
rather than accepting an arbitrary revision lookup.

The added test exercises simultaneous effective/proposed builds, default effective selection,
mismatched displayed revision refusal, distinct stored `basedOnRevisionId` values, cross-view
refusal, shared version conflicts and withdrawn-proposal refusal. These assertions directly cover
the reported failure. **The P2 is closed by static review; no remaining blocking finding was found
in the reviewed private flow.** CT114 execution and actual browser results are still required; this
review did not run those workloads or certify their outcome.

## Later activation requirement and change of authorship

The lead identified a separate build-readiness gap after the original UI/access review: owner-complete
inputs could be activated before the required private item was chosen. The V1 perk/complication
contract requires that source choice even while gameplay activation/revelation remains deferred.
The reviewer of this document then implemented the central Director-setup guard, owning-Director
current-draft context, standalone-save deferral and owning-Director restore deferral with dedicated
app tests. Consequently, this document does **not** independently certify those later changes.

Their independent review is [V37 Director setup activation review](V37-director-setup-activation-review.md).
That review supersedes the earlier statement that the private editor is never mounted for a draft:
an authenticated character owner who is also the selected campaign Director now has a narrowly
authorized current-draft setup path. Ordinary players still submit before the Director configures
the proposed build; setup does not disclose the item in public build/history payloads.

Final execution evidence inspected on 2026-09-17: [the CT114 check log](../build/evidence/V37/integration/check-final.log)
records all five private-choice and seven Director-setup tests passing, within 648 total engine/app/script
tests. [The final browser log](../build/evidence/V37/integration/browser-final.log) records the V37
Director-private inheritance journey passing. This closes the original access/revision review's
execution caveat, without converting the later author into their own independent reviewer.
