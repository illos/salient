# V104 — Elementalist level one

## Goal

Complete all level-one Elementalist choices and granted shared actions.

## Scope

Pinned `class/elementalist.md`, `feature/elementalist/level-1` and
`feature/ability/elementalist/level-1`: four specializations, five enchantments, four wards,
eight signatures (choose two), four 3-Essence and four 5-Essence choices. Preserve Fire references.
Static Permanence/Celerity and existing rolled bonuses derive automatically. Equipment-conditional
Battle, range bonuses, immunity, aura timing, healing and terrain remain explicit source text/manual;
no equipment state or spatial engine invented. Persistent effects expose their source timing and
maintenance limitations as manual actions; repeat rolls are not charged as fresh heroic abilities.

## Acceptance checks

Independent source ledger covering all options; shared creation, editing, pruning, every granted
action and persisted cost/effect readback. ENGINE source review, TESTER full and isolated journey,
then DEPLOY2 publication with accepted evidence reused.

## Work log

- Started from main `33d18be`. ENGINE auditing pinned sources. No full tests run.
- ENGINE authoring review caught and repaired Permanence source attribution and Excavation's separate-per-creature rolls. Excavation now records its whole spatial effect manually while retaining the fixed cost.
- Independent ledger `tests/fixtures/v104-elementalist-expected.json`: five Human builds, all four arrays, specializations, enchantments, wards and chosen abilities. 52 distinct uses (25 envelopes +27 embedded actions), source-cost debit/block/waiver, Meteoric/Viscous push readback and Ray resisted/applied save registration. Existing Bethell expectations add exactly ten newly exposed prose actions; Forge comparison excludes only these named actions retained in its parent source.
- Authoring: focused evaluator/report files 12/12 pass; both TypeScript projects and touched lint checked. Full/live gates pending TESTER.
- Found an existing route limitation: `ability.use` has no damage-type parameter. Added seven explicit Hurl Element damage-type choices in the shared list/API. Each uses original Reason tiers and type-specific damage mitigation; Fire's original Hurl exception still applies only to fire. Base Hurl is a manual choice entry, preventing silent untyped damage. Ledger and journey now cover 59 distinct actions, including every Hurl type; Bethell gains exactly seventeen explicit source uses.
- TESTER generators at `1f9ddf2`: all exit 0, 1436 entries. Manifest/report outputs retained; artifacts `/srv/presidium/projects/salient/test-artifacts/V104-1f9ddf2-generation`.
