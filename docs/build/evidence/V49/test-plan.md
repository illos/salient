# V49 test plan

Preparation artifact for [V49](../../V49-polder-level-one.md). No test has been written or run. The
expected values come from [the reference data](capture/builds.json), derived from the pinned
Compendium independently of our evaluator.

## 1. Definition and source coverage

| Case | Expectation |
| --- | --- |
| Option inventory | All six purchasable traits and both signature traits present with source paths and verbatim quotes, checked against the **assembled** definitions rather than the module constant |
| Costs and budget | 1/2/1/2/1/1 against a 4-point budget, matching the pinned trait entries |
| Signature completeness | Both Shadowmeld and Small! are granted. A regression guard fails if the free-trait list is ever derived from the ancestry record's `signature_trait_name`, which names only Shadowmeld and would silently drop size 1S |

## 2. Derived values

| Case | Expectation |
| --- | --- |
| P1 full build | Every field in `builds.json` for `P1-polder-new-traits`: Stamina 30, recoveries 10, recovery value 10, winded 15, size 1S, speed 5, stability 2, disengage 1, save 6, potency 0/1/2, renown 1, wealth 1, nine skills, four languages |
| P1 versus P0 control | Identical unconditional vitals. The only difference between a build with all three new traits and the same build with none is the presence of the conditional entry and the unspent-points warning |
| Polder Geist present | `conditionalEffects` carries one entry: feature Polder Geist, a speed-bonus amount of **3**, the verbatim condition sentence and the trait's source path |
| Polder Geist absent from totals | `speed` is 5. No field anywhere exposes 8, and no surface renders a parenthesised or "effective" speed |
| Nimblestep | No numeric field changes. Its two clauses — ignoring difficult terrain, and full speed while sneaking — are readable on the sheet |
| Reactive Tumble | No numeric field changes. Its readable content records the opt-in free triggered action resolving after the forced movement. No action-budget field is asserted, because this slice adds none |

## 3. Shadowmeld presentation

| Case | Expectation |
| --- | --- |
| Full body text | The rendered source for Shadowmeld contains all eight clauses, ending with "If the surface you are flattened against is destroyed, this ability ends and you take 1d6 damage that can't be reduced in any way." |
| Structured-effects guard | A test that fails if the rendered text is ever produced by rebuilding from `metadata.effects`, since the final clause exists only in the body. Assert on the closing sentence specifically, not on length |
| Manual boundary | The card presents Shadowmeld as a Magic maneuver whose resolution is manual. It is not counted as a class signature ability despite its `subtype: signature` data, and it is not presented as a main action |

## 4. Budget and negative cases

| Case | Expectation |
| --- | --- |
| Overspend, 5 points | Invalid; the build cannot complete |
| Underspend, 3 points | A warning only. The build still completes, per the resolved Q-CHAR-10 policy |
| Exact spend, 4 points | No diagnostic |
| Duplicate trait selection | Rejected by the points shape |

## 5. Removal and parent change

Each case from `removalExpectations` in the reference data, asserted on the persisted build rather
than on a mutation response:

| Change | Expectation |
| --- | --- |
| Drop Polder Geist | Its conditional entry disappears; ordinary speed unchanged at 5 |
| Drop Nimblestep or Reactive Tumble | Readable content disappears; no numeric field moves |
| Swap a trait within budget | The old trait leaves no residue in derived values, readable content or provenance |
| Change ancestry away from Polder | Size returns to the 1M default; Shadowmeld, Small! and every purchased trait are removed; class, career, culture, array and authored details are preserved |
| Re-evaluate an unchanged build | Identical output; no live resource reset and no repeated one-time grant |

## 6. Compatibility

| Fixture | Expectation |
| --- | --- |
| Existing Polder reference paths | The three already-supported traits keep their exact current derived values: corruption immunity 3, frightened immunity, disengage +1 |
| Existing Devil Berserker fixtures | Unchanged; this unit touches only Polder content and one conditional seam |
| V45 Bethell retained artifact | Compared for what it proves, with its version and class caveats recorded |

## 7. Persistence and browser

Create the P1 build through the wizard; save, reload and read the persisted build back; confirm the
sheet shows the three traits' readable content, Shadowmeld's complete text, and Polder Geist's
condition rather than an inflated speed. Exercise one trait swap in the editor and confirm the
removal expectations on the persisted build. A mutation response is not evidence.

## 8. Whole-repository gates

`pnpm check` and `pnpm test:browser` on the isolated CT114 candidate with the configured single
workers, plus the commit trailer gate. Retain command output, failures and the reruns that resolve
them; an outstanding required failure is a failed gate.
