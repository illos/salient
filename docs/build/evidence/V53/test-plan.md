# V53 test plan

Preparation artifact for [V53](../../V53-human-level-one.md). No test has been written or run.
Expected values come from [the reference data](builds.json), derived from the pin independently of
our evaluator.

## 1. Definition and source coverage

| Case | Expectation |
| --- | --- |
| Option inventory | The signature trait and all five purchased traits present with source paths and verbatim text, offered by the **assembled** definitions rather than the module constant |
| Costs and budget | 1/2/1/1/2 against a budget of 3, matching each trait's own entry |
| Signature trait granted | Detect the Supernatural is granted **despite having no cost field** — a regression guard against a loader that iterates only costed traits |
| Verbatim clauses | Both traits whose second clause begins "Additionally," retain it; assertions quote the source rather than a paraphrase |

## 2. Derived values

| Case | Expectation |
| --- | --- |
| H1 | Recoveries 12, everything else as H0. Recovery value stays 10, because Staying Power does not touch Stamina maximum |
| H2 versus H0 | **Every derived field identical**, and both entitlements present and readable. Both halves required |
| H3 | As H0 numerically; the third entitlement present |
| Conditional amounts never reach totals | Speed is 5 with Perseverance taken; stability is 2 from the kit alone with Can't Take Hold taken; no damage reduction appears anywhere with Resist the Unnatural taken |

## 3. Misrepresentation guards

| Case | Expectation |
| --- | --- |
| Can't Take Hold is not stability | Stability derives from kit only; the trait's reduction appears as conditional readable content naming magic and psionic sources |
| Perseverance's slowed value | Recorded as a flat 3 with its condition; never 3 plus a kit speed bonus, and never applied outside the slowed condition |
| Perseverance's edge | Not a sheet number. If an edge representation is added later, two edges must not sum |
| Resist the Unnatural | Recorded as a triggered action consuming the one-per-round allowance; not passive halving |

## 4. Budget and negative cases

4 points invalid; 2 points warns and completes under Q-CHAR-10; 3 points clean; a duplicate trait
rejected by the points shape.

## 5. Removal and parent change

Dropping Staying Power returns Recoveries to 10. Dropping a conditional trait removes its readable
content and moves no number. Changing ancestry to Devil or Polder removes the signature trait, every
purchased trait and any Recoveries increase while preserving class, career, culture, array and
authored details. Both the pruned path and the stale-selection diagnostic path are exercised.

## 6. Content snapshot

`pnpm content:check` regenerates byte-for-byte from the clean pin with the Human ancestry record
included. This is the shared-pipeline change; it is claimed through the integration owner first.

## 7. Persistence and browser

Create H1 through the wizard; save, reload and read the persisted build back; confirm Recoveries 12
and the readable entitlements. Create H2 and confirm the sheet shows both traits while the numbers
match H0. Exercise one trait swap and confirm the removal expectations on the persisted build. A
mutation response is not evidence.

## 8. Whole-repository gates

`pnpm check` plus `pnpm test:browser` on the isolated CT114 candidate with the configured single
workers, and the commit trailer gate. Retain output, failures and the reruns that resolve them.
