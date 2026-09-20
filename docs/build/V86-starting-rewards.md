# V86: Starting reward fulfillment

Status: implemented on `slice/V85` at `b15fc59` plus import correction `faa9b1e`;
not merged. Full local checks pass (864 tests and production build). Live API acceptance is
blocked: isolated CT114 startup failed, and the subsequent hosted cloud deploy exited 1 before
reporting upload success. The API suite did not start on either target.

## In scope

Persist sourced starting possessions, unavailable/broken item identities and initial Wealth, Renown and project-point balances once. Show them through owner/Director UI and shared API. Preserve them across later edits, restoration and detachment without minting repeated rewards.

## Out of scope

General inventory transfer/stash flows, treasure-effect automation, downtime project spending and browser tests.

## Acceptance

Use pinned Compendium sources, independent source/code review, meaningful tests and persisted public API witnesses. Verify eligible and ineligible choices, replacement, private data boundaries and no duplicate initialization. No browser testing. Record verification blockers without expanding into infrastructure repair or increasing timeouts.

## Source and delivery

Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`; Forge `5a846aadb623a9855a023e9403bb887a956c341f`, unchanged. No abandoned pilot inputs. Local checks ran on Presidium; the isolated CT114 `supporting-actions` deployment failed before
API scenarios could start and is stopped with data retained. No retries, timeout changes or
infrastructure fixes; shared main remains unchanged. The [source audit](V86-starting-rewards-audit.md)
records the exact coverage and manual/deferred boundaries. [Evidence](evidence/V85/README.md)
records source, runner, results, reviews and the remaining live-acceptance gate.
