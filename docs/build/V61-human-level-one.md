# V61: Human level one

Status: candidate implemented; focused/full CT114 checks passed; actual browser/Forge acceptance queued. No merge or live-app claim.
Rules review: required.

Spec: [V44 delivery](V44-character-option-delivery.md),
[decision system](../character-wizard-spec.md#3-decision-system),
[reliability](../character-wizard-spec.md#9-shared-operations-and-reliability).

Branch `slice/V61`, worktree `.worktrees/astra-human`, based on main `6459c8d`.
Sources read before implementation: pinned Compendium
`fb83a789da8f0327a389c277a0c790b1648d5810`, `en/unified/md/feature/trait/human/*.md`
and the common base statistics. No Opus inputs.

Human has a three-point purchase budget: Staying Power and Determination cost two;
Perseverance, Can't Take Hold and Resist the Unnatural cost one each. Detect the Supernatural
is an automatic signature trait with readable maneuver timing/range. Staying Power adds two
maximum Recoveries after class/kit derivation. It changes neither recovery healing nor Stamina.
Conditional terrain, slowed speed, condition removal and triggered damage reduction remain manual,
with their complete source text shipped. No creation-time supernatural target selection is required.

## Verification and test value

Four focused cases catch: recovery capacity applied to the wrong health value or missing on one
class path; conditional responses incorrectly treated as immunity and missing shipped source cards;
four-point purchase acceptance/benefit leakage; stale recovery/signature benefits after ancestry edit.
These add Human-specific semantic coverage to existing generic persistence and wizard tests.
No implementation-mirroring or count-target tests. Runtime results are recorded below.

## Queued actual-game and Forge witnesses

Use pinned Forge `5a846aadb623a9855a023e9403bb887a956c341f`. Independently create matching
legal builds there and in Salient; retain genuine exports, saved/reloaded readbacks and source cards.
Use the existing pre-pilot Bethell choices with only ancestry replaced and old Polder choices removed.
Keep class, background, languages and every other selection identical between tools.

| Witness | Purchased traits | Independent expected values |
| --- | --- | --- |
| A | Perseverance + Staying Power | Fire Elementalist, Stamina 18, recoveries 10, healing 6, winded 9, speed 5, stability 0, size 1M, Disengage 1. |
| B | Determination + Can't Take Hold | Same build, recoveries 8, no permanent condition immunity; readable maneuver ending one condition. |
| C | Perseverance + Resist the Unnatural + Can't Take Hold | Same build, recoveries 8, no damage immunity; readable triggered-action limitation. |

A anchors the actual browser wizard create/save/reload journey. Inspect Detect the Supernatural
and purchased rule cards; B/C comparisons cover the remaining choices without redundant full
browser permutations. Add a persistence regression only if the actual journey exposes a distinct
failure generic saved-draft coverage does not catch.

Generated corpus and focused/full CT114 checks passed. Remaining acceptance: actual-game browser path and
full regression, independent implementation and fresh rules review, all three authentic Forge
comparisons, then verified integration and shared playable environment update.

## Check evidence — 2026-09-20

Named CT114 environment `character-restart`; main and abandoned environment untouched. Source archive
identity `a54489c664567056cc123d5b7ff24d6cdb794cc6114a933f57b106b362a315b5` was main `6459c8d`
plus this candidate. Generated corpus (491 entries) and formatting were retrieved before commit;
production/tests match the checked tree. Later additions are documentation and evidence only.

- `pnpm content:build` and targeted Prettier: [log](evidence/V61/checks/generate.log), [exit 0](evidence/V61/checks/generate.exit).
- `pnpm exec tsc --noEmit && pnpm exec vitest run --project engine tests/character-v61-human.test.ts`: [log](evidence/V61/checks/focused.log), [exit 0](evidence/V61/checks/focused.exit); four focused cases pass.
- `pnpm check`: [log](evidence/V61/checks/check.log), [exit 0](evidence/V61/checks/check.exit); 695 tests, lint, types, source-content validation and build pass.
- [Independent preliminary review](reviews/V61-human-review.md) found no static defect; final acceptance awaits external/browser evidence.

Committed logs strip ANSI colors and trailing whitespace only. Original bytes retained in
`/srv/presidium/projects/salient/character-restart-evidence/v61-checks.tar.gz`.
