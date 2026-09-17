# V35 verification evidence

The named CT114 `foes` environment served the full package, edition
`bf262edf546e91e1540cc17489915f18c4873ddd8bd8e225b20f3441e3f74f30`, at
`https://salient-foes-dev-7bbd8a1a60ab.tail41404c.ts.net` on 2026-09-17.
Shared main and the parallel `foes-library` environment were not modified.

- [Full check](check.log): `pnpm check`, including 97 engine and 358 app/script tests,
  lint/types, links, source pins, exact content regeneration and production build.
- [Focused check](focused.log): TypeScript plus 25 ingestion/comparison and seven Core presentation
  tests, including projection of every one of the 2,507 content objects.
- [Exhaustive comparison](../V35-steel-cauldron.json): all 501 parents, 475 explained and 26
  explicitly unavailable; zero unresolved outcomes or retrieval errors. Missing external coverage
  does not count as an independent match.

Browser artifacts and independent review findings are recorded in the slice work log.
No ability execution or live-encounter loading is claimed by these checks.

## Browser acceptance

Command on CT114:

```sh
pnpm exec playwright test tests/browser/foes.spec.ts tests/browser/v35-full-foes.spec.ts tests/browser/v34-core-content.spec.ts --grep-invert "hero and Director sheets" --workers=1 --output=/artifacts/v35-browser-final --reporter=line,json
```

[All five public scenarios passed](browser.log). The [machine-readable report](browser-report.json)
contains the coverage attachment; its [decoded inventory](full-corpus-coverage.json) lists every
501 parent and verifies all 2,006 feature controls, with no page errors.

| Display case | Light | Dark |
| --- | --- | --- |
| Heroes summon | [Source of Earth](source-of-earth-light.png) | [Source of Earth](source-of-earth-dark.png) |
| Envelope-free feature and long solo | [Lich](lich-light.png) | [Lich](lich-dark.png) |
| Restored omitted Malice feature | [Hag](hag-malice-light.png) | [Hag](hag-malice-dark.png) |
| Rejoined split Malice ability | [Gnoll](gnoll-malice-light.png) | [Gnoll](gnoll-malice-dark.png) |
| Nested solo abilities | [Vampire Lord](vampire-lord-light.png) | [Vampire Lord](vampire-lord-dark.png) |
| Retainer source | [Human Warrior](human-warrior-light.png) | [Human Warrior](human-warrior-dark.png) |
| No features / optional fields | [Noncombatant](noncombatant-light.png) | [Noncombatant](noncombatant-dark.png) |
| Historical V27 parent | [Ghost](first-echelon-light.png) | [Ghost](first-echelon-dark.png) |
| Historical V27 independent ability | [Haunt](first-echelon-ability-light.png) | [Haunt](first-echelon-ability-dark.png) |
| Historical V30 parent | [Mummy Lord](second-echelon-light.png) | [Mummy Lord](second-echelon-dark.png) |
| Historical V30 independent ability | [Binding Curse](second-echelon-ability-light.png) | [Binding Curse](second-echelon-ability-dark.png) |

Screenshots show the initial viewport of scrollable reference cards; automated assertions inspect
all feature sections, including those below that viewport. These are source-definition displays,
not proof of gameplay execution. SHA-256 comparison of all 25 changed scripts/shared/tests/web
files between the local branch and tested remote source found no mismatches.

Log copies remove terminal color escapes and trailing whitespace; test results and command output are unchanged.
