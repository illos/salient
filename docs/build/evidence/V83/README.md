# V83/V84 supporting actions and culture evidence

Status: initial and V72-integrated isolated API acceptance passed; all repository check stages passed; independent reviews passed; main delivery pending.

## Scope

V83 exposes 24 sourced action/activity entries from 23 of the 47 core perks, retaining the perk.
The remaining 24 perks are modifiers/passive/build features, not missing standalone actions.
All 21 ordinary kit signatures now carry printed action metadata on the character sheet.
V84 supplies 11 ancestral and 16 professional culture presets plus Bespoke through the same
shared choice transition used by the wizard and public API. Presets do not constrain ancestry.

Lie Detector remains unavailable because its required HeroToken pool is not implemented: its
public use returns `ability.blocked`, with no effect/payment. Familiar restoration spends one
Recovery without healing, journals that payment and blocks at zero. Familiar destruction,
Friend Catapult's Victory reset and other contextual restrictions remain explicit manual rules;
no familiar entity or new conditional-effect automation is claimed. Noncombat activities retain
literal source durations/conditions and do not acquire invented combat action costs.

## Source and environments

- Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`; Forge
  `5a846aadb623a9855a023e9403bb887a956c341f`, unchanged.
- Initial application/runner source `2a8844e59bff30786f82edc64eca3edd1be7339f`.
- Runner: CT114 build job in environment `supporting-actions`, compose
  `salient-supporting-actions-dev-d21ad518e747`.
- Application: isolated anonymous development Convex, `http://backend:3210` internally,
  site port3211; origin <https://salient-supporting-actions-dev-fc2fb66104e0.tail41404c.ts.net>.
- The newly created environment received 567 reference records. No existing environment data was
  reset. Public journeys created their own programmatic test accounts, characters and campaign.
- Local checks ran on the Presidium provider host, Node24.18.0/pnpm11.5.3; remote Node24.13.0.
- No browser, Playwright or Chromium runs. Forge's culture selector was examined through pinned code.

## Initial live proof

`presidium-dev --env supporting-actions run build -- env` with
`VITE_CONVEX_URL=http://backend:3210`, `VITE_CONVEX_SITE_URL=http://backend:3211`,
`VITE_SITE_URL` set to the origin above, `SALIENT_HEADLESS_TARGET=http://backend:3210`,
`SALIENT_HEADLESS_ENVIRONMENT=character-headless`, `SALIENT_HEADLESS_SOURCE` set to the exact source,
and `SALIENT_HEADLESS_REPORT=/artifacts/v83-v84-headless.json`, followed by
`node scripts/verify-character-headless.ts`.

[Raw report](headless-initial.json): **31 passed, zero failed/skipped, 80.865 seconds**, exit0.
The runner authenticates without browser sessions. New scenarios read back saved choices, sheet
features/action grants, table actions, public events and undo/redo state. The source-derived witness
matrices and assertions are in `scripts/headless/supporting-actions.ts` and
`scripts/headless/culture-presets.ts`; results aggregate witnesses into three meaningful journeys.
Every perk grant and kit signature is checked on persisted sheets; table execution samples
Familiar/Creature Sense/Arcane Trick plus refused Lie Detector, not every action permutation.
All27 cultures produce completed saved Human characters; tests independently compare the book's
triples/languages, retain ancestry/authored/live state, and customize Dwarf culture to Bespoke.

## Checks and corrections

Focused checks prove embedded source extraction, source-table culture mapping, saved action/culture
routes and legacy-build reprojection. The legacy fixture deliberately strips perk actions from an
old-style saved baseline while retaining its perk; read-only sheet/table queries recover the new
grants without rewriting that baseline. This is disclosed fixture setup, not a claimed new-build route.

Initial fullcheck passed339 engine and485app/script tests, failing one historical expectation that
kit signatures belong under Other. The source-correct Main expectation replaced it. A second run
passed339engine and486app/script tests plus link/vendor/content/inventory checks, then caught the
new legacy test's missing CharacterSheet audience narrowing during build. That test typing was
corrected. Neither failed full run is claimed as passing. Their logs are retained above.

Focused proof development corrected API-envelope assumptions (manual actions need a reference,
refused costs return a blocked event, history operations omit an actor) and a fixture that selected
the same skill twice. No timeouts, retry loops or infrastructure changes were used to obtain passes.
The application was rebased cleanly onto independently delivered V72 before final integration proof.

## Integrated proof

Actual runner/application source: `e39ce7e46eaddb384caf69bbab1e8f33240e45df`, rebased onto
ENGINE V72 `dbfb61d`. [Live report](headless-integrated.json): **31/31 pass in 72.199 seconds**,
run `5cabe99f-08b5-4994-aced-b4fef39ee96a`, same isolated CT114 environment. No executable
changes followed this run.

The raw report is retained unchanged and contains a manually mistyped `source` field:
`e39ce7e2def154271548eb49709976ee70f7e8fd` is **not** the tested commit. The authoritative
[deployed runtime metadata](runtime-integrated.json), captured from the web container's
`/runtime-source.json`, and [deployment log](deploy-integrated.log) both identify the actual clean
`e39ce7e46eaddb384caf69bbab1e8f33240e45df` checkout and pinned submodules. This is a provenance
label correction, not a hidden report rewrite or reason to repeat the behavioral test.

The integrated repository check passed lint, **339 engine + 514 app/script tests**, links,
source pins, content, supporting inventory and foes. Its generated V72 report check detected the
newly exposed perk grants. Regenerating that report adds 20 manual compatibility entries
(53→73); compiled6 and structurally supported/unavailable4 stay unchanged. No additional
engine automation is claimed. The report groups Familiar's two same-source alternatives into one entry;
V83's action ledger and API witnesses separately verify both. The report correction is data only.
`pnpm compiled:check && pnpm build` then exited0; the [remaining build log](build-integrated.log)
records successful type checking, production Vite output and web budgets. All repository check
stages therefore passed after a generated-report-only correction. The earlier interrupted
integrated log is retained as [such](check-integrated-report-stale.log).

## Reference boundaries and review

V37's unchanged supporting-option inventory/source comparison remains applicable; this slice changes
action exposure, not perk/kit eligibility or permanent calculations. Source review independently
classifies all47 perks and21 kits. Culture tables and pinned Forge defaults agree after two explicit
source-led spellings: Compendium Kalliak versus Forge Kalliac, and Laborer Neighborhood versus
Pauper Neighborhood. New complete Forge hero exports were not generated for these preset wrappers;
no expanded full-character Forge parity is claimed.

[Fresh source and proof review](../../reviews/V83-V84-source-review.md) and
[independent implementation review](../../reviews/V83-V84-implementation-review.md) separate
source/code verdicts and pass the bounded integrated acceptance. Main integration remains pending
while ENGINE owns its current shared-app rollout.
