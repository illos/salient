# V72 independent integration review

Reviewer: `v72_integration_review`, 2026-09-20; independent of implementation.

**Verdict: PASS — integration candidate acceptance, 2026-09-20.**
No blocking findings remain. Shared-main integration/runtime verification remains
a separate lead-owned completion step.

## Scope

Integration delta from reviewed `ed564b3` / `9e0f96f` on `e5c1cd8` to
`67027b0` / `a68a047` on `42211f5`, regenerated support reports and the new
`scripts/v72-headless-main.ts` linked-correction runner. The original
[implementation review](V72-implementation-review.md) and
[rules review](V72-rules-review.md) remain the scope-level reviews.
Read project instructions, the build/headless/trait-grant gates and V72 scope;
applied the Convex reviewer checklist to the integration delta. No browser run,
deployment, application mutation or heavy test workload was performed by this reviewer.

## Static integration findings

`git range-diff e5c1cd8..9e0f96f 42211f5..a68a047` shows unchanged V72 runtime
patches; rebase differences are documentation and TypeScript include context.
Compared every runtime/test/script path changed by original V72 against its old
reviewed head: only `convex/lib/resolve.ts` differs, through inherited V74 work.
Its entire `abilitiesFor` function and subsequent suffix are byte-identical to
`42211f5`. `convex/schema.ts`, campaign UI and current content manifest likewise
match that base. V68 fields/UI, V74 conditional ancestry projection and V82 content
are preserved; this review does not repeat their separate acceptance claims.

The report refresh retains six compiled and four supported-but-unavailable abilities.
Compatibility availability increases from 49 to 53 through Draconian Pride,
Dragon Breath, Detonate Sigil and The Wode Defends; no new compiled execution is
claimed. Runtime arithmetic and the pinned source revision are unchanged.

The linked runner uses explicit opt-in plus exact checkout/URL pairs for `main`
and `engine-live`, fixed internal backend/site addresses, anonymous deployment
checks and refusal of injected deployment/admin credentials. It creates separate
accounts/campaign/hero/foe through public APIs, retains previous artifacts and
keeps tokens out of recorded transport failures. There is no reset, reseed or
fabricated gameplay result in this runner.

Expected Brutal Slam damage/push constants, single/double bane handling and the
larger melee weapon attacker bonus were independently checked against pinned
`en/unified/md/feature/ability/fury/level-1/brutal-slam.md`,
`rule/dice/bane.md`, `rule/character/size.md`, `movement/forced-movement.md` and
`kit/mountain.md`. Natural 19/20 handling is explicitly attributed to the existing
R04 project contract. The runner does not use the compiler/resolver as its oracle.
Random accepted dice may leave corrections within one tier; the separate existing
V72 deterministic journey supplies broader arithmetic coverage.

Occurrence assertions address revision identity, original dice, linked correction
history, exact compiled undo/redo restoration, private input/health projection,
stale/wrong-role/wrong-target/duplicate disposition refusal and the unrelated-action
boundary. These extend the original V63 logical journey to the compiled contract.

## Verification status

Inspected the retained local full-check output and exit 0: 333 engine tests and
510 app/scripts tests plus typechecks, lint/format, source/content checks and build.
All 11 recorded full-check source hashes independently match the reviewed tree.
The corrected runner also passes its recorded focused lint/format and web
TypeScript checks with exit 0.

The first linked live attempt stopped at `pre-use-facts` before ability use because
the runner incorrectly addressed the public Might baseline as `might` rather than
`M`. Its failed artifact remains retained. This is a harness contract error,
not passing gameplay proof. The revised runner now imports `DerivedBaseline`,
checks baseline/kit presence and reads `characteristics.M`; the remaining fixture
facts match that typed public contract.

The refreshed [46-record public journey](../evidence/V72/integration/v72-headless-readback.json)
passes with [exit 0](../evidence/V72/integration/v72-headless-exit.txt): run
`b0f5df59-b1cb-4038-933c-9fc552a1d862`, 167.624 seconds, `stage: complete`.
Recorded source is dirty `a68a047fc458f15b51ac8cd3391ed4e133405cfe`, CT114
`engine-live`, application URL
`https://salient-engine-live-dev-fcf42d994212.tail41404c.ts.net`, internal
`http://backend:3210`. All 18 recorded file hashes independently match the
reviewed tree. The separately disclosed disposable-campaign dice fixture remains
limited to this isolated target; reference content now matches the 567-entry
integrated catalog without a pin change.

Independently inspected actual results: BS2 applies 8 damage (Goblin 7), subtotal 3;
two banes apply 5 (Goblin 10), subtotal 2; lethal BS3 applies 15 (Goblin 0),
subtotal 5; SC4 absorbs three temporary Stamina then one ordinary Stamina;
BP2 applies six with its bleeding clause still manual; VF2 applies nine fire
with subtotal 3. Correction undo/redo compiled snapshots match exactly and
public compiled original inputs remain absent. The recorded derived comparison
also retains the original reviewed journey's case order and 23 effect summaries.

The corrected [linked journey](../evidence/V72/integration/v72-linked-readback.json)
passes with [exit 0](../evidence/V72/integration/v72-linked-exit.txt): run
`3796d38b-aae5-458b-b317-bb77aee3a3e0`, 19.592 seconds, 14 records,
`stage: complete`, same dirty source and engine-live target. Its runner records
CT114 build container `/app`, Node `v24.13.0`; all 17 source hashes independently
match. Real accepted dice were 4 and 10. Initial/one-bane results apply eight
and leave seven Stamina; two banes apply five and leave ten. Undo/redo restores
those exact compiled snapshots; the Director correction restores eight/seven and
closes the player correction seam. Manual disposition, rewind and redo preserve
occurrence identity and exact recorded data; duplicate, stale, wrong-role,
wrong-target and later-turn refusals pass. Public results omit original compiled
inputs and private foe Stamina. The reviewer independently checked these readbacks,
original dice and snapshot equalities, without importing compiler/resolver code.

Integration into main and verification of the shared playable runtime remain
separate lead-owned steps. No missing browser run is an acceptance blocker under
the current moratorium.
