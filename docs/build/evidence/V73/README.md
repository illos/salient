# V73 — Headless Forge comparison evidence

Run on CT114 `hosted`, 2026-09-20. Adapter source `51e7270fc4af491fc318422a40ce5479f4c638c8`.
Live application source remained `ab0f2fd875155d929f5efed201b14d96a821f4f7`; no deployment.
Target: `https://different-bat-943.convex.cloud`, frontend `https://salient-dev.rdxx.workers.dev`.
Forge pin: `5a846aadb623a9855a023e9403bb887a956c341f` (14.197.0).

## Result

Two retained authentic sheet baseline calibrations pass; 31 constructed counterparts pass the
bounded Forge choice checks. Three negative ancestry cases reject missing, duplicate and unknown
purchases. The public API comparison completes **31 cases in 50.168 seconds: 24 pass, 7 fail**,
exit 1. No retries, timeout increase, browser or application fix.

All 31 saved/read-back characters match the compared baseline values, skills, languages, condition
and damage immunities, and ancestry trait names. Supplied choices survive preview and persistence.
The seven failures are ability-list differences:

| Cases | Forge ability missing from Salient ability list |
| --- | --- |
| devil-3, devil-7, devil-11 | Glowing Eyes |
| polder-2 | Reactive Tumble |
| human-1 | Detect the Supernatural |
| human-2 | Detect the Supernatural; Determination |
| human-3 | Detect the Supernatural; Resist the Unnatural |

These names remain present as Salient traits. This establishes a representation difference, not
that their descriptive content is absent or that Forge's representation is authoritative. Resolve
against the pinned Compendium and the app's ability/trait contract in a later implementation slice.
Do not mark comparison acceptance passed or suppress these differences.

## Scope and calibration boundaries

The retained Grug/Bethell exports were captured from Forge 14.199/14.198; the pinned executor is
14.197. Calibration proves the explicitly retained sheet baseline fields, not every field in those
exports. Bethell's legacy export omits primaryCharacteristics; the adapter records restoring the
sole pinned Elementalist primary option Reason without changing numeric assignments. Soldier's
optional language vacancy is filled with Kalliak in both constructed inputs. Ancestries are replaced
with actual pinned definitions. Other base payloads remain the approved retained characters.

Orc Passionate Artisan targets have no structured Forge counterpart. All ten target names are
covered in five pairs for Salient preservation/no-extra-skill proof; independent Forge target
validation is unavailable. Ability parity checks names, not full effect mechanics or combat automation.
The adapter is a bounded witness checker, not a validator for arbitrary imported heroes.

Initial adapter checks caught and corrected a witness typo (`Kalliac` instead of `Kalliak`) before
any saved comparison. Independent review also tightened permissive upstream choice counts and added
numeric damage-immunity/ancestry-grant comparisons before the recorded live run.

## Reproduction

From the candidate checkout with matching dependencies and clean pinned Forge source, on either
available suitable test environment:

```sh
export SALIENT_FORGE_OUTPUT=/path/to/retained/artifacts
node scripts/forge/build.mjs
node "$SALIENT_FORGE_OUTPUT/forge-run.mjs"
export SALIENT_HEADLESS_TARGET=https://different-bat-943.convex.cloud
export SALIENT_HEADLESS_SOURCE=51e7270fc4af491fc318422a40ce5479f4c638c8
node scripts/forge/compare-live.ts
```

Use the actual source revision for a new run. The runner creates fresh test characters via supported
authenticated public operations, retains them for inspection and signs out its temporary account.
No admin credentials, direct database writes or browser setup are used.

`characters.tar.gz` contains all upstream counterpart JSON and all Salient saved/sheet readbacks.
`live-comparison.json` lists exact differences; `calibration.json` retains the reference projections;
`summary.json` records counterpart completeness; `bundle-inputs.json` records actual upstream modules
and throwing presentation boundaries. `manifest.json` hashes the retained artifacts.

Focused ESLint/Prettier, actual Node bundling/execution, and remote links (311 Markdown files) pass.
No full application suite rerun is claimed; no application code changed in V73. Independent review:
[review](../../reviews/V73-headless-forge-review.md).
