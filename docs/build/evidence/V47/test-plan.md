# V47 test plan

Preparation artifact for [V47](../../V47-fury-level-one.md). No test has been written or run yet;
this is the plan the implementation stage executes on CT114. Expected values come from
[the reference builds](reference-builds.md), which derive them from the pinned Compendium
independently of our evaluator.

## 1. Definition and source coverage (`tests/fury-decisions.test.ts`)

| Case | Expectation |
| --- | --- |
| Option inventory | Every level-one Fury option in the pinned source is present with its source path, and every option the unit enables is supported in the **assembled** definitions, read through `getDefinitions()` rather than the module constant |
| Ability pools | Signature, 3-ferocity and 5-ferocity membership and order match the printed Fury chapter; each option's cost quote matches its entry |
| Aspect grants | Each aspect grants exactly its sourced skill, two features and one triggered action |
| Growing Ferocity | Rows 2, 4 and 6 present for each aspect path; rows 8, 10 and 12 absent at level one; provenance cites the aspect feature entry or the kit's own `growing-ferocity.md`, never `primordial-aspect.md` |
| Stormwight kits | Four kits selectable only under Stormwight; each carries its kit bonuses, always-available Aspect Benefits, form-conditional entries, primordial storm, signature ability and Aspect of the Wild |
| Provenance quotes | Every kit provenance quote is non-empty and appears verbatim in the file it cites; no quote attributed to the ordinary Kits table for a stormwight kit |

## 2. Derived values (`tests/character-derived-values.test.ts`, `tests/character-evaluator.test.ts`)

One case per reference build A–E, asserting the independently derived table: characteristics,
Stamina maximum, recoveries, recovery value, winded value, size, speed, stability, disengage, melee
and ranged damage bonuses, all three potencies, saving-throw threshold, skills, languages, features,
traits, abilities, renown and wealth.

Two arithmetic cases deserve their own assertions because they are the easiest to get wrong:

- **Stormwight kit contributions exist at all.** Assert a non-zero derived Stamina for each of the
  four kits. This is the regression for the defect where a missing `kit.<name>.contributions` row
  makes the evaluator silently return a baseline with no Stamina, stability or disengage.
- **Vuken's two +2 speed figures.** Assert the build speed includes the unconditional kit Speed
  Bonus exactly once and does not include the animal/hybrid-form bonus.

## 3. Negative cases

| Case | Expectation |
| --- | --- |
| Chosen skill duplicating the aspect's granted skill (Lift/Hide/Track) | `invalid` `duplicate-skill` diagnostic; value dropped from the skill list; build not completable. Existing behaviour — this is a regression test, not new enforcement |
| Chosen skill duplicating a career or culture grant | Same |
| Two identical chosen skills | Same |
| Berserker or Reaver selecting a stormwight kit | Refused: value not in the pool supplied by `optionsByParent` |
| Stormwight selecting an ordinary kit | Refused the same way |
| Stormwight taking Slight Case of Lycanthropy | Refused with the source clause. **New enforcement in this unit**; today the exclusion exists only as narrative text |
| Non-stormwight fury taking Slight Case of Lycanthropy | Allowed; the new rule must not over-apply |
| Kit left unselected, per aspect | Aspect-appropriate diagnostic, including the Stormwight Beast Shape wording |
| Level-two attempt with Reaver or Stormwight | Refused by the existing level-two support gate |

## 4. Parent-change behaviour

| Change | Expectation |
| --- | --- |
| Berserker → Stormwight on a saved build | Lift, Primordial Strength and Lines of Force removed; Track, Beast Shape, Relentless Hunter and Furious Change granted; the ordinary kit selection dropped because it is no longer in the pool; culture, career, ancestry, array, details and authored text preserved |
| Stormwight → Berserker | Mirror case, including removal of the stormwight kit's contributions, signature ability and Aspect of the Wild |
| Stormwight kit swapped, for example Boren → Corven | Old kit bonuses, forms, storm and signature ability removed; new ones applied; nothing from the old kit persists in derived values |
| Ancestry changed on a stormwight build | Class and kit contributions unchanged; ancestry contributions replaced |
| Re-evaluation of an unchanged saved build | No live resource reset, no repeated one-time grant, identical output |

## 5. Compatibility regressions

| Fixture | Expectation |
| --- | --- |
| `tests/fixtures/v25-fury.json` (Devil Berserker level one) | Evaluates identically to its current result, field for field |
| `tests/fixtures/v32-fury-level-two.json` (Berserker level two) | Unchanged, including the progression path and history |
| Existing Elementalist and Polder reference paths | Unchanged; the shared kit and skill extensions this unit touches are used by other classes |
| Existing V37 supporting-choice coverage | Unchanged counts for careers, cultures, perks and complications, except the one new Lycanthropy eligibility rule |

## 6. Persistence and browser (`tests/browser/v47-fury.spec.ts`)

| Journey | Expectation |
| --- | --- |
| Create a Reaver through the wizard | All choices offered and selectable; sheet shows the aspect's skill, features, triggered action and Growing Ferocity rows with readable source |
| Create a stormwight, one kit per run where the window allows | Sheet shows kit bonuses in the derived values, the kit signature ability, Aspect of the Wild, the always-available Aspect Benefits and the form-conditional entries labelled as such |
| Save, reload, read back | Persisted build identical; a mutation response is not accepted as evidence |
| Change aspect in the editor | Obsolete grants disappear from the sheet and the persisted build; independent details survive |
| Headless equivalence | The same operations through the shared headless path produce the same persisted build |

## 7. Whole-repository gates

`pnpm check` and `pnpm test:browser` on the isolated CT114 candidate with the configured single
workers, plus the commit trailer gate over the branch. Retain command output, failures and the
reruns that resolve them. A required failure left outstanding is a failed gate, not a caveat.
