# V73 independent headless Forge adapter review

Reviewed 2026-09-20 at candidate `9d158368f7be404a87c6f5e32e87ca54c86100a6`.
Scope: static correctness review of `scripts/forge/{build.mjs,run.ts,project.ts,ancestry-witnesses.ts,compare-live.ts}`.
No runtime or browser jobs were run by this reviewer. This is an implementation review of the
bounded comparison adapter, not independent rules acceptance or a verdict on the live results.

## Findings and resolution

1. **Completeness previously trusted minimum counts. Addressed for the declared witnesses.**
   Projection now checks exact counts, uniqueness and eligible option membership for skills,
   languages, abilities, kits and perks, plus exact generic-choice budgets. Ancestry purchases
   also require pinned payload equality. Characteristic assignments, subclass counts and career
   incidents receive explicit checks. Unsupported choice types prevent completeness. The retained
   negative ancestry cases exercise missing, duplicate and foreign purchases rather than merely
   mirroring successful construction.
2. **Damage immunities and ancestry grant membership were omitted. Addressed.**
   Forge damage-immunity values now compare against saved Salient baseline values, including
   Polder's Corruption Immunity. Named signature and purchased ancestry traits are compared as
   complete sets. Technical Size and Speed containers are excluded from that name comparison,
   while their numeric results remain independently compared. This catches missing and extra
   named ancestry grants, not just the presence of requested purchases.

The adapter executes upstream Forge calculation functions. Browser presentation dependencies
throw if reached; they do not return replacement game results. Genuine retained exports calibrate
selected numeric outputs, with input hashes and the legacy Bethell primary-characteristic repair
recorded. Supplied Salient choices are checked against preview normalization and saved API
readbacks; the saved sheet supplies comparison values. Failure artifacts are retained.

## Remaining scope limits

- This certifies only the constructed level-one six-ancestry Fury/Elementalist families. Retained
  class/career/culture payloads are trusted reference inputs, not a general validator for arbitrary
  edited exports. Count and membership guards do not establish every cross-choice prerequisite
  or duplicate-entitlement rule for future classes and levels.
- Calibration proves the enumerated retained numeric values. It does not independently calibrate
  every ability, grant or feature-description field. Ability membership is compared by name;
  damage tiers, effect text and gameplay execution are outside this adapter's comparison.
- Orc Passionate Artisan targets lack a structured Forge selection. Their persistence can be
  proved through Salient, but exact Forge counterpart coverage for those targets remains a gap.
  Play-time choices are excluded from build completeness.
- A runtime comparison mismatch remains a failure requiring source-led interpretation. The lead
  reported a Glowing Eyes ability-versus-trait representation mismatch during the live run;
  this review neither waives it nor authorizes an application fix.

No additional blocking adapter defect was found in this bounded rereview. Per-option ledger,
independent rules review and actual retained runtime results remain required before acceptance.
