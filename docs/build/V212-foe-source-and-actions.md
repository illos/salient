# V212: Foe source accounting and action discovery

Rules review: required. Depends on: V211.

## Goal

Make every selected monster feature reachable through an honest source-linked action, passive
effect or manual entry, and maintain a roster report that distinguishes recognition from execution.

## Scope

- Bind the 189 named records in the [inventory](../v1-foe-engine-inventory.md), headers and
  referenced general rules to stable source identities. Keep printed text and parent privacy.
- Extend foe source/action discovery beyond `feature_type=ability`: trait actions, Malice
  references, group traits, fixed creature free strikes and optional contextual actions.
- Supply a reusable trait/feature descriptor; do not implement 189 hard-coded action handlers.
- Include End Effect, Provoking Nettles and later conditional javelin/granted-action entries with
  explicit manual status until their executing slices land. No false `compiled` label.
- Report per clause: source, compiler status, supported operation, dependency and persisted proof.

Spec: `docs/table-spec.md#confirmed-action-and-log-contract`;
`docs/engine-architecture.md#from-rules-text-to-executable-behavior`.
Sources: inventory files; `rule/monster/monster-trait.md`, Traits;
`rule/monster/creature-free-strike.md`, Creature Free Strikes;
`monster/dragon/statblock/thorn-dragon.md`, Provoking Nettles.
Likely paths: `convex/lib/resolve.ts`, `compiledSource.ts`, shared foe/source contracts and action UI.

## Acceptance checks

1. Proposed cohort `foe-discovery`: load all 36 definitions through `foe.add`/`squad.add`, query
   their permitted action lists, compare names and source identity with the inventory. Traits
   that grant actions must have registered UI/CLI/API routes, including conditional availability.
2. Thorn Dragon's Provoking Nettles appears; passive Withering Wyrmscale Aura is separately
   identified; neither acquires a fabricated action cost. Used text excludes unrelated private features.
3. An ordinary player cannot operate a foe or read unused private stat-block data. The Director's
   invocation and manual completion persist source and attribution. Paused/closed sessions refuse writes.
4. Alter a source clause/revision and prove source drift refuses automatic execution. Retry an
   unchanged manual operation without duplicate log/state; undo/redo retains source identity.
5. Report reconciles all records and explicitly states that mapped/manual behavior is not executed.
   Test runs the shared gate and `foe-discovery`; QC reviews the source accounting.

## Work log

- 2026-09-25: registered by V211. Proposed cohort and checks; no implementation or test results yet.

- 2026-09-26: resumed on `slice/V212`, `.worktrees/foe-source-actions`, base `d9f8ac24`.
  Added reusable source descriptors for printed traits, named End Effect children, band/basic
  Malice and the two group features. `ability.use` records these as text-only entries and
  `ability.resolved` records their manual completion. No payment, action allowance, trigger,
  movement, damage or lasting effect is inferred from a source-only entry. The UI says **Record
  text** and labels timing/effects manual; this is reference/manual reachability, not an automated
  availability window or an engine action grant. Executable timing and payloads remain with the
  existing dependent slices. Domain and Overwhelm retain their accepted manual dispositions.
- Report command: `node scripts/foe-discovery-report.ts > /tmp/v212-source-report.json`.
  Reconciles 36 headers and 189 named records (110 abilities, 50 traits, 27 Malice including basic,
  two group traits), plus three End Effect children. Fresh compiler recognition retains six
  compiled and 104 compatibility abilities. The report includes source/revision, clauses,
  dependency and operation; it explicitly does not claim persisted execution proof. Generated
  reports remain outside Git. The inventory remains the per-feature delivery checklist.
- Focused authoring: web/backend TypeScript and touched-file ESLint passed; the source discovery,
  compiled-source and foe-source-text files passed 16 checks. Source drift remains covered by
  the existing compiled-source checks. New manual recording checks cover permitted source only,
  denied player operation, no foe-state changes, retries and attributed manual completion.
- Test job after QC: `CI=true pnpm check`, then `SALIENT_HEADLESS_COHORT=foe-discovery pnpm
  test:headless:character` in the coordinator's standard seeded private anonymous environment
  with exact candidate SHA in `SALIENT_HEADLESS_SOURCE`, `SALIENT_HEADLESS_RUNNER_SOURCE`;
  `SALIENT_HEADLESS_ENVIRONMENT=character-headless`, `SALIENT_HEADLESS_TARGET` equal to
  `VITE_CONVEX_URL`, and matching local site/auth origins. See `testing-process.md`. The cohort
  adds all 36 sources via `foe.add`/`squad.add`, reads their action lists, checks player privacy,
  records and completes Provoking Nettles without mechanical changes, replays its command,
  exercises disposition undo/redo, and checks paused/closed refusal. Failure means missing
  discovery, privacy/authority breach, fabricated mechanics or broken persisted manual history.
  Runtime push and authenticated cohort are coordinator work, not claimed as locally verified.

- QC passed `595f80e9` for manual/source reachability. Test found a cohort setup error before
  roster loading: session start needs `selectedPlayerIds` and `title`, not `name`. Corrected
  the fixture to select the admitted player's authenticated profile. Test also reproduced
  Prettier failures on main in the earlier spatial-review renderer/template; applied only
  mechanical Prettier formatting to those two files to unblock the shared gate. Runtime
  feature behavior is unchanged. Return revised tip to QC and Test for the gate/cohort rerun.

- Test accepted the shared gate at `92391c01` (458 engine, 981 app/script checks) and discovery
  report. The HTTP cohort loaded all 36 foes but stopped at command actor validation. Corrected
  its shared Director/player command input to `{refKind: 'foe', id}`; sheet queries retain
  `{kind, id, name}`. Negative checks now require the authorization, paused-session and
  absent-session refusal messages, so malformed inputs cannot pass them. Reviewed all remaining
  cohort calls against current public validators and registered operation arguments. App runtime
  is unchanged; QC requested reuse of the gate/report and a focused foe-discovery rerun only.
