# V38: Foes integration and top-level navigation

| Field | Value |
| --- | --- |
| Primary track | Foes / app navigation |
| Owner | Integration lead |
| Depends on | V30, V35, V36, current main including V37 |
| Rules review | Not required for navigation; existing V30/V35 source reviews retained |
| Status | Complete — merged and verified in the shared app |

## Authorized outcome

The user requested merging the complete Foes library and exposing Rules and Foes as separate
datasets, with a new top-level Foes link. Integrate the reviewed V36 branch and its V30/V35
dependencies, retain the current character work and verify the shared development app.

## Specifications and scope

- [User-visible catalog flow](../monster-catalog-spec.md#user-visible-flow).
- [Foes browsing](../monster-catalog-spec.md#foes-library-browsing--v36).
- [Public reference coverage](../reference-library-spec.md#confirmed-library-coverage).

Add Foes beside Rules in primary navigation. Keep independent catalog search/filter state and
public reference access. Preserve source pins, complete printed source, previous edition identity
and the current character/backend contracts. No new combat automation or catalog-loading behavior.

## Acceptance and verification

1. Authenticated primary navigation exposes separate Rules and Foes links; both load the correct
   library and can return to the app. Public direct links still work.
2. The merged library exposes all 438 stat blocks, with independent abilities, traits and Malice;
   existing filter, source-card, nested navigation and responsive tests pass.
3. Full CT114 check/build and source reproducibility pass on the integrated tree. Exhaustive browser
   coverage checks all 501 parents and 2,006 features. Character/table regressions remain valid.
4. Before integration, independent integration/navigation review and commit gates pass.
5. Delivery completes after main merge, shared app update, actual shared browser checks and
   compact evidence. The pre-merge review does not certify those later rollout steps.

## Work log

2026-09-17: claimed `slice/V38` in `/srv/presidium/projects/salient/characters-build` from main
`0993e51`. Merged reviewed `slice/V36` at `5e8b675` without conflicts, pending commit and validation;
that branch includes V30 `214d04b`, V35 `0b07723`/`5634420` and V36 `e691e15`. No owner branch was
rewritten. The existing named CT114 `characters` environment is this lead's isolated test target;
shared `main` remains unchanged until checks/review pass. Public Foes data ships with the frontend;
this merge requires no character schema migration or content-database reseed.


The merge has no conflicts. The Foes package, importer, identity registries, shared resolver and
Foes UI match `slice/V36` exactly; existing Convex functions, character evaluator and supporting
choice catalogs match main `0993e51` exactly. Navigation explicitly clears cross-catalog query
state. The existing five dependency commits pass the actual local merge trailer gate.


Integrated CT114 verification passed 663 tests (274 evaluator, 389 app/tooling), all source
checks and the production build. All 12 browser scenarios passed in 3.7 minutes, including
new primary navigation, independent searches, all 501 parent cards/2,006 feature controls,
responsive references, hero/Director sheets and V37 supporting/private choices. Root inspected
primary navigation and the Foes destination screenshots. [Evidence](evidence/V38/README.md) and
[independent review](reviews/V38-integration-review.md) record the pre-merge pass. Shared rollout
remains the subsequent delivery gate.


## Merge and shared rollout

Integrated all six commits through `40206a5f544f91a828797e44fed75366f4a776e6` into main after
review and the commit gate passed. `presidium-dev up` synchronized the clean canonical checkout
to CT114 environment `main`, preserving its play-data volume and existing HTTPS URL. Backend
and frontend are healthy. This is the established private development target, not a new hosted
deployment. No character schema/content reseed was needed for the frontend Foes dataset.

All five actual shared-browser scenarios passed in 1.7 minutes. Retained JSON reporter evidence
records 501 parent cards and 2,006 feature controls with zero page errors; the top-level navigation
journey and independent library searches also passed. See [shared evidence](evidence/V38/README.md#shared-rollout).
The final documentation closeout requires no further runtime update. V30, V35 and V36 are now
integrated/live as dependencies; their original branch reviews retain their original scope.
