# V85: Complication grants and dependencies

Status: implemented on `slice/V85` at `b15fc59` plus import correction `faa9b1e`;
not merged. Full local checks pass (864 tests and production build). Live API acceptance is
blocked by the isolated CT114 backend function-push readiness failure.

## In scope

Audit all 100 core complications for omitted actions, conditional grants and dependent choices; implement confirmed omissions through shared wizard, sheet and API routes. Retain source drawbacks and manual gameplay conditions.

## Out of scope

Combat automation, new classes, browser tests and general inventory.

## Acceptance

Use pinned Compendium sources, independent source/code review, meaningful tests and persisted public API witnesses. Verify eligible and ineligible choices, replacement, private data boundaries and no duplicate initialization. No browser testing. Record verification blockers without expanding into infrastructure repair or increasing timeouts.

## Source and delivery

Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`; Forge `5a846aadb623a9855a023e9403bb887a956c341f`, unchanged. No abandoned pilot inputs. Local checks ran on Presidium; the isolated CT114 `supporting-actions` deployment failed before
API scenarios could start and is stopped with data retained. No retries, timeout changes or
infrastructure fixes; shared main remains unchanged. The [source audit](V85-complication-audit.md)
records the exact coverage and manual/deferred boundaries. [Evidence](evidence/V85/README.md)
records source, runner, results, reviews and the remaining live-acceptance gate.
