# V86: Starting reward fulfillment

Status: in progress on `slice/V85`, `.worktrees/supporting-actions`, from main `ad8bdbe`.

## In scope

Persist sourced starting possessions, unavailable/broken item identities and initial Wealth, Renown and project-point balances once. Show them through owner/Director UI and shared API. Preserve them across later edits, restoration and detachment without minting repeated rewards.

## Out of scope

General inventory transfer/stash flows, treasure-effect automation, downtime project spending and browser tests.

## Acceptance

Use pinned Compendium sources, independent source/code review, meaningful tests and persisted public API witnesses. Verify eligible and ineligible choices, replacement, private data boundaries and no duplicate initialization. No browser testing. Record verification blockers without expanding into infrastructure repair or increasing timeouts.

## Source and delivery

Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`; Forge `5a846aadb623a9855a023e9403bb887a956c341f`, unchanged. No abandoned pilot inputs. Local and CT114 tests use a free suitable environment; no runtime claimed yet. Supporting source audit supplies the precise ledger and boundaries before implementation.
