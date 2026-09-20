# V82 verification evidence

Runner: CT114, named `hosted` environment. Application target: development
`https://different-bat-943.convex.cloud`, frontend `https://salient-dev.rdxx.workers.dev`.
No browser tests, timeout increases or reused pilot material.

## Checks and reviews

- `check.log`: full `pnpm check` passed on candidate `3ddb81b` (333 engine + 483 app/scripts).
- `review-fixes.log`: after provenance/duplicate-validation fixes in `8d5559f`, lint, web types,
  all 333 engine tests and 11 affected app tests passed. The actual pinned Forge generator passed
  calibration and produced 137 complete counterparts, including strict invalid-input probes.
- Independent [review A](../../reviews/V82-ancestry-review-a.md),
  [review B](../../reviews/V82-ancestry-review-b.md) and
  [Forge review](../../reviews/V82-forge-review.md) passed their scoped code/source reviews.

An initial content build duplicated already included Dragon Knight actions; the selection now adds
only its missing ancestry entry. An initial test incorrectly expected automated Psionic Bolt rolls;
it now proves the existing manual route and retained source tiers. Review also corrected distinct
signature source references and rejected mixed-wrapper/direct duplicate Revenant traits. These
were corrected before live acceptance; no failed check is counted as a pass.

## Live acceptance

Authenticated public API: **28/28 passed in 110.688 seconds**, including all six new ancestries
in the combined persisted-choice/replacement scenario. Two Forge cohorts (55 non-Revenant,
82 Revenant) remain in progress.
The cohorts avoid the existing per-account character limit while preserving all 137 witnesses.
Code deployed from `8d5559fc87f18f4ed4112f4effc2cafaa3809739`; reference content reseeded to
567 entries without replacing character/campaign data. Worker
`ff4da11e-6772-4e3c-bdd4-afd2fc88b000`.
