# V85–V88 combined pre-promotion integration gate — 2026-09-20

Job `test-v85-v88-full-integrated-a0c9584`, Chords message **1013**, submitted by DEPLOY
`bc6847ae-0334-4282-ae3c-6ec7291a509c`. The frozen source was
`a0c958451f2c525a50d40756610f188e893312af` (tree
`cdbab79f8ca4083db6777a6b3c229b4b4d75029c`) on `integration/V85-V88` in
`.worktrees/deploy-v85-v88`, based on current main
`015f4f5647657b2b971614c3765a04ebfcff4b6a`.

Result: **failed**. The full gate found one stale V88 audit-baseline assertion after the valid V85
complication corpus was integrated. Engine checks passed 358/358. App/scripts passed 576/577; the
only failure was `tests/scripts/audit-ability-grammar.test.ts` expecting the fixture's 25 preexisting
added IDs while the combined audit correctly contains those 25 plus 37 V85 complication abilities.
The failure lists all 37 additions, including Cult Victim: Pass Through Matter and Waking Dreams:
Receive Vision. The fixture must be repaired without weakening the byte-preservation and bounded
classification assertions, then the combined full gate must be resubmitted before promotion.

## Passing focused and metadata gates

```text
node scripts/check-commit.ts --merge --range 015f4f5..a0c9584
PASS — all ten commits accepted, including authentic Reviewed-By trailers

vitest --project engine tests/complication-actions.test.ts tests/starting-item-abilities.test.ts
PASS — 6/6

vitest --project app tests/app/complication-actions.test.ts tests/app/starting-rewards.test.ts
PASS — 5/5

vitest --project scripts tests/scripts/headless-deadline.test.ts
PASS — 1/1

vitest --project app tests/app/potency-conditions.test.ts
PASS — 6/6

vitest --project scripts tests/scripts/live-compiled-report.test.ts
PASS — 3/3

node scripts/report-live-compiled-abilities.ts --check
PASS — 13 compiled / 1,259 compatibility / 2 unavailable
```

The committed report hashes exactly match TESTER's prior isolated deterministic generation:

- `support.json`: `e005241f2d36a38c3bf5d9d930a57b085153defd54acfa42bf3a5ede0469472e`
- `support.md`: `77fab5df1830a2d8bcc2e849deb7ca1248e2adf07a6b0edbca4f25e16e6a3ad2`

## Full and downstream gates

```text
CI=true pnpm check
FAIL — engine 358/358; app/scripts 576/577; one stale V88 fixture assertion
```

Because the full command stopped at that failure, TESTER ran its remaining stages separately. All
passed: 395-file links, pinned vendors, 1,151-entry content snapshot, supporting inventory, 438 foe
stat blocks/2,006 features, compiled report freshness and production web build. `git diff --check`
and tracked cleanliness also pass.

Combined preservation checks confirm:

- `content.reseed` remains an `internalAction`, with application tests invoking it through
  `t.action(internal.content.reseed, {})`.
- The pinned manifest contains 1,151 entries and 438 stat blocks.
- The generated Convex API retains `lib/squads` and `lib/startingRewards`.
- The character schema retains optional `startingRewards` for compatibility with older live rows
  and optional V88 `conditionInstances`; the focused persisted tests cover original-admission
  initialization, authorization, idempotency, receipt protection, grants and build restoration.
- V88 potency, source-linked condition runtime/provenance and report checks pass unchanged.

## Convex bundle and schema dry run

Target classification: development deployment `different-bat-943`. With the user's explicit
non-publishing authorization, TESTER ran:

```text
pnpm exec convex deploy --dry-run --typecheck enable --codegen disable
PASS — bundled and typechecked functions, validated schema and reported “Would have deployed”
```

No functions, schema, data or frontend were published. Code generation was disabled to keep the
frozen submitted tree unchanged.

The job ran locally from 17:27:36 through 17:34:49 UTC. It started no application stack or browser
and made no data changes. Outputs are retained at
`/srv/presidium/projects/salient/test-artifacts/V85-V88-a0c9584-full-integrated-20260920T172800Z`.
