# V85/V86 testing request — 2026-09-20

Job `test-V85-V86-854a5dd-1`, Chords message **793**, submitted by WIZARD
`a45eccaa-2dd6-4bb8-ae39-e3a217d1aeb1` to TESTER. **Blocked on a corrected candidate; no new
test, build, deployment or application mutation was run.** The slot is available for other jobs.

## Frozen source and prerequisite

- Worktree `/srv/presidium/projects/salient/code/.worktrees/supporting-actions`, branch `slice/V85`.
- Exact clean submitted HEAD `854a5dd470dc8f9b5dbe050b1da5db50bc1fba45`; application source
  `faa9b1e`, base `ad8bdbe`; subsequent commits contain documentation/evidence.
- Read the candidate's `docs/build/evidence/V85/deployment-diagnosis.md` and its three linked
  diagnostic logs via that worktree or `git show 854a5dd:<path>`.
- Source inspection confirms the diagnosed issues remain: attributed manifest import in
  `shared/evaluate/startingItemAbilities.ts`, and schema import of `startingRewardsValidator`
  from `convex/lib/startingRewards.ts`, which brings runtime access/auth dependencies into schema.
- WIZARD owns the two source fixes and must submit a new exact SHA/job key superseding this job.
  Temporary experiments were restored; do not deploy this snapshot or apply invisible repairs.

The submitter reports 864 checks and production build already passed on `faa9b1e`; that is prior
evidence, not a new TESTER result. Do not repeat a full suite for this documentation-only snapshot.
Reassess integrated checks when the corrected source or a rebase is supplied; newer main includes
V02, and a pending V87 branch changes `content.reseed` from mutation to action.

## Requested checks after the prerequisite is resolved

Run these focused groups sequentially, using the installed dependency/toolchain versions:

```sh
pnpm exec vitest run --project engine --maxWorkers=1 tests/complication-actions.test.ts tests/starting-item-abilities.test.ts
pnpm exec vitest run --project app --maxWorkers=1 tests/app/complication-actions.test.ts tests/app/starting-rewards.test.ts
```

The acceptance target is the **hosted demo**, frontend `https://salient-dev.rdxx.workers.dev`,
Convex **dev** `different-bat-943`, not CT114 main. Verify deployment identity and applicable
authorization before updating anything. The last successful hosted source/Worker in the handoff
is `8d5559fc87f18f4ed4112f4effc2cafaa3809739` / `ff4da11e-6772-4e3c-bdd4-afd2fc88b000`;
this is historical, not proof of current state or candidate readiness.

Once the actual corrected candidate is deployed, run `node scripts/verify-character-headless.ts`
locally with `VITE_CONVEX_URL=https://different-bat-943.convex.cloud`,
`VITE_CONVEX_SITE_URL=https://different-bat-943.convex.site`,
`VITE_SITE_URL=https://salient-dev.rdxx.workers.dev`, `SALIENT_HEADLESS_ENVIRONMENT=hosted`,
`SALIENT_HEADLESS_TARGET=https://different-bat-943.convex.cloud`,
`SALIENT_HEADLESS_SOURCE=<actual deployed full SHA>` and
`SALIENT_HEADLESS_REPORT=<unique artifact directory>/headless.json`.

Expected: all **35** scenarios pass through authenticated public API and persisted readback.
Coverage includes complication grants/removal/timing, Recovery and Psychic Blast payments/history,
Dragon Dreams Victory gating/revocation, starting rewards across career changes/restoration,
legacy initialization and unauthorized/stale/retry refusals, 26 eligible treasures, 20 manual item
actions and `ability.recorded`, with draft/broken/absent/private-placeholder actions excluded.
The historical missing-reward fixture is mock-app-only. Earth + Grounded remains blocked by the
unsupported class; retain the documented manual gameplay limitations.

## Inputs and cleanup

Read the worktree directly: runner plus `scripts/headless/**`, `shared/**`, `convex/**` and generated
types, `tests/app/fixtures/table.ts`, named tests and existing package/lock/Vitest configuration.
Use the existing 567-entry snapshot and pinned Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`.
Forge remains `5a846aadb623a9855a023e9403bb887a956c341f`; no new Forge comparison is requested.
Deployment reference: candidate `runtime/hosted.mjs` and `docs/hosted-development.md`.

Preserve cloud data/credentials; no reseed/reset without demonstrated need. Fresh disposable
accounts/campaigns only; the runner closes its sessions. No browser tests or timeout increases.
No CT114 source upload or old-stack restart is needed for a local CLI calling the hosted API.
WIZARD reports no remaining owned jobs and the isolated `supporting-actions` stack stopped.
Recheck capacity when the corrected candidate arrives. Return results through Chords without
waking peers from an automated turn, and update the existing status queue.
