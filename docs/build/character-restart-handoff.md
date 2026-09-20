# Character wizard restart handoff

Status: the next bounded batch is implemented and live headless verified on 2026-09-20.
Hakaan and Orc join Devil, Polder, Dwarf and Human. Application changes remain on `slice/V69`
in `.worktrees/character-coverage`; they are not merged into main. The remaining acceptance
blocker is the authentic Forge-reference requirement, which currently requires browser capture.
Do not silently waive it or resume browser activity.

## Current source and running app

Backend and frontend source: `ab0f2fd875155d929f5efed201b14d96a821f4f7`.
Hosted development: <https://salient-dev.rdxx.workers.dev>, backend `dev:different-bat-943`,
Worker `7830be2c-15d9-4c6f-8634-25c0edf55988`; 515-entry content snapshot.
The candidate preserves V65 and main through V63 `b6109b0`. Main's later V67 pure compiler
is not in this candidate and has no deployed-runtime effect. Preserve peer changes when integrating.

V65 at `acc3df1` remains preserved in `.worktrees/character-headless`; do not rebuild it.
Its original 22-scenario passing proof and repaired auth-key/type errors remain historical evidence.
The current [V69 record](V69-character-coverage.md) owns the new batch and coverage inventory.

## Verified and pending

- Full remote `pnpm check`: 737 tests plus lint, types, source/content validation and build pass.
- Live authenticated headless suite: all 26 scenarios pass in 82.857 seconds, zero failures/skips.
- All new Hakaan/Orc purchases have saved readback witnesses; Artisan targets persist without
  granting skills and disappear after parent replacement. Hakaan replacement removes size/immunity.
- Existing six-ancestry creation, privacy, admission/review, private inheritance, Fury advancement,
  history/restoration, stale edits and combat locks pass. This is sampled workflow proof.
- Independent implementation and fresh pinned-source reviews pass for all six ancestry candidates.
- Genuine Forge option comparisons remain incomplete for Devil, Dwarf, Human, Hakaan and Orc.
  Polder retains its prior authentic counterpart. Twelve Devil skill choices still have evaluator
  coverage without individual live witnesses. No full rules-combination certification is claimed.

[Evidence and reviews](evidence/V69/README.md) retain both the initial new assertion typing failure
and the successful corrected full check. No timeout was raised and the live suite ran once.
All our jobs ended, temporary deployment credentials were removed, and the CT114 heavy window
was released to peers. Hosted private services, `character-restart` and the old `characters`
environment remain stopped. Coordinate a new window before any further workload.

## Resume constraints and next decision

Read `agent.MD`, [Astra workflow](astra-character-workflow.md), [V44 scope](V44-character-option-delivery.md),
[V69](V69-character-coverage.md), and the relevant character specification before continuing.
Check Chords and current main first. Do not repeat passing verification without a relevant change.

The user permanently abandoned the entire [Opus pilot](../decisions/2026-09-19-opus-pilot-dead-end.md).
No code, tests, fixtures, captures, research or processes from that pilot may be reused. Use native
Astra agents and current main for subsequent bounded units. Every test must catch a meaningful
failure and add coverage; reject redundant or implementation-mirroring tests.

The [browser moratorium](README.md#browser-testing-moratorium--2026-09-20) remains absolute until
V66 repair is implemented. V66 has not started and requires the user's go. No browser, Playwright
or headless Chromium testing; visual scenarios belong in the browser backlog. All workloads run
on CT114, live character proof through authenticated public CLI/API routes on hosted development.

Before main integration, resolve the conflict between the existing authentic website-export gate
and the moratorium with the user. A source/rules pass does not itself waive Forge evidence. Once
that policy is settled, prepare the reviewed candidate against then-current main and complete the
normal integration and playable-app checks, preserving peer work. Do not start a third new ancestry
merely to avoid closing this batch. Remaining ancestry/class gaps are listed in V69.

Compendium pin: `fb83a789da8f0327a389c277a0c790b1648d5810`.
Forge pin: `5a846aadb623a9855a023e9403bb887a956c341f`. Read rules only from the pinned Compendium.
