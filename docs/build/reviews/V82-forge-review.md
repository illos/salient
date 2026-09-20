# V82 Forge adapter review

Reviewer: independent Astra worker; 2026-09-20. Static review of the integration working tree
based on `3ddb81bd121facfe3abc9a49a525babc37ef3f52`. This review covers `scripts/forge/`,
not the reviewer's own ancestry/headless implementation. Runtime results remain separately required.

## Verdict

Static review PASS after correction: effective purchased-feature IDs now reject mixed wrapper/direct
duplicates, and a focused negative probe covers that exact case. Existing outer membership and pinned
payload checks remain intact. No defect found in generated legal witness selections or use of upstream
calculations. The lead must still record runtime results for the corrected adapter.

## Source and coverage

Read the unmodified pinned Forge `5a846aadb623a9855a023e9403bb887a956c341f` ancestry definitions,
`HeroLogic`, `FeatureLogic.isChosen` and `components/features/feature-data/choice.tsx`.
Rules authority remains Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`, especially
Revenant Former Life, Previous Life 1/2 Points and Dragon Knight Prismatic Scales.

The adapter uses real upstream baseline, skill, language, ability, immunity and weakness calculations.
It does not substitute Salient evaluator results for Forge expectations. The bundle pins and checks
an unchanged vendor tree; presentation imports throw if invoked. Retained pre-pilot Grug and Bethell
exports calibrate the adapter, with Bethell's sole Reason primary restored transparently. Optional
Soldier language choices and spelling aliases are explicit, bounded mappings.

The witness generator covers all six new ancestry purchase pools, all six Dragon Knight immunity
choices, all three Psionic Gifts, eleven Revenant former ancestries and eligible borrowed purchases.
It adds a direct-selected-feature witness for three distinct one-point Polder purchases. That direct
representation agrees with pinned Forge's ConfigChoice, which expands former ancestry purchases.
Wrapper witnesses also use real pinned feature structures and upstream traversal. Prismatic Scales
is excluded from Revenant borrowing because Former Life does not grant Wyrmplate, on which it depends.
Passionate Artisan targets are transparently Salient-only evidence because Forge retains only text.

## Resolved finding

`project.ts` checks duplicate outer selected IDs. It accepts both Previous Life wrappers and direct
former-purchase features, so a mixed list containing a one-point wrapper selecting Grounded and a
direct Grounded feature has distinct outer IDs and an exact two-point total. Each payload separately
passes canonical checks, yet the same purchased trait is selected twice. Compendium Previous Life:
1 Point requires a different trait on each purchase.

The corrected code resolves wrapper selections to effective purchased-feature IDs for an additional
uniqueness check and preserves outer membership/payload validation. The added negative probe constructs
the exact mixed Grounded duplicate with a legal two-point sum; it requires incomplete status. Existing negative probes already cover missing/foreign/duplicate
outer purchases, altered nested payloads, missing borrowed selection and mutated former ancestry.

## Comparison boundaries

The live comparator uses authenticated public discovery/create/get/sheet operations and retains raw
saved selections and sheet readbacks. It compares characteristics, core values, skills, languages,
abilities, condition immunity, damage immunity/weakness and named traits. Explicit Compendium actions
which Forge stores only in prose are reported as additions, not silently filtered discrepancies.
Technical Size/Speed/Damage Modifier containers are separated from named traits, while numeric values
are independently compared. Cohort splitting preserves the full witness set under the existing
bounded timeout. This review does not certify runtime pass counts or browser behavior.
