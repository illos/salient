# Deployment

DEPLOY2 (Chords `80f94764-5a63-430c-9548-6d8583052803`, succeeding DEPLOY
`bc6847ae-0334-4282-ae3c-6ec7291a509c` on 2026-09-20) owns integration of finished branches into `main`,
final release commits, the verified push of `main` to GitHub, and promotion of the integrated
revision to the live stable cloud environment.
TESTER owns all pre-release and post-release test execution under
[testing-process.md](testing-process.md).

## Stable target

- Frontend: `https://salient-dev.rdxx.workers.dev` (`salient-dev` Cloudflare Worker)
- Backend: Convex `dev:different-bat-943`
- Procedure and credential handling: [docs/hosted-development.md](docs/hosted-development.md)
- The browser moratorium applies. Release proof uses the supported authenticated CLI/API routes.
- Reseed the committed content when required; development data is disposable under `AGENTS.md`.

The cloud target is stable only when its backend, content and frontend are recorded against one
exact integrated `main` revision and TESTER has passed the live checks. A branch-only candidate or a
partially updated target is not stable.

## Promotion gate

1. The owner hands off the reviewed tip after TESTER's full check and applicable headless proof pass.
2. DEPLOY2 fast-forwards `main` and publishes affected backend, content and frontend components.
   Reuse passing checks for unchanged inputs; do not add a pre-promotion or exact-revision test gate.
3. TESTER runs one targeted hosted smoke check of the changed feature.
4. DEPLOY2 records the runtime source and Worker version, commits the release closeout, pushes
   `main`, verifies the remote SHA and sends the completion handoff.

Development data is disposable. Do not fingerprint, snapshot or preservation-check records.
Coordinate before resetting another thread's environment or the user's shared app. Routine content
reseed uses the hosted task. Cloud publication is serialized; documentation-only changes need no
runtime update. Domains, accounts and paid plans remain separate from standing release authority.

## Job ledger

| Job | Candidate | State | Next gate |
| --- | --- | --- | --- |
| V92 | `81b7931` | Merged and published; 1182 entries; hosted Shadow smoke passed | documentation closeout SHA and verified GitHub push recorded in completion handoff |
| Stable-cloud reconciliation | `main` release source `a0a700a` | Published; targeted live checks passed | documentation closeout and verified GitHub push; exact closeout SHA in DEPLOY2 completion message |
| V85/V86 | owner `64972e6`, integrated `4f3fe13` | Merged and published; targeted live checks passed | release closeout |
| V88 | integrated with V85/V86 at `4f3fe13` | Merged and published; targeted live checks passed | 1151 entries, inventory 13/1259/2; release closeout |
| V89 | owner `dff62e8`, integrated `4f3fe13` | Merged; full 358+575 PASS reused by identity | build-only heap repair `a0a700a` independently reviewed and hosted build passed |
| V75 | `c4ed53e` | Merged; frontend published | hosted asset smoke passed; closeout SHA in completion handoff |

Update this ledger at handoff, integration, publication, verification and rollback boundaries. The
canonical feature/test detail remains in [docs/build/STATUS.md](docs/build/STATUS.md); this file tracks
only deployment ownership and release state.

### Partial release — 2026-09-20 19:52 UTC

TESTER's [integrated certificate](docs/build/evidence/V85/tester-job-4f3fe13-integrated.md)
permits reuse of V89's complete passing gate. `a0a700a` adds only the reviewed hosted-build
heap adjustment (768 to 1536 MiB for build only); the corrected hosted build passed in the
existing 2 GiB container. Exact clean source was uploaded to CT114 `hosted`.

Convex backend publication passed schema validation. The subsequent `content:reseed` action
was refused because the scoped key lacks `deployment:functions:runInternalActions`.
No permission workaround or data reset was attempted. Frontend publication was held;
Worker `bb430814-0366-43a3-882a-bd69f81cc811` remains the previous release.
The temporary credential file was removed; private hosted services are stopped with data retained.

Release logs: `/srv/presidium/projects/salient/test-artifacts/release-4f3fe13-20260920`.
TESTER captured 5551 application rows and 421 auth rows before publication for a non-atomic
fingerprint comparison. An atomic export was unavailable (`deployment:backups:create` denied);
these captures are not a restore backup. Private evidence:
`/srv/presidium/projects/salient/test-artifacts/cloud-preservation-4f3fe13`.
TESTER's [post-backend comparison](docs/build/evidence/V85/tester-job-a0a700a-preservation.md)
passed: all 5972 captured rows identical, no additions/removals/changes; manifest remains 567
entries at `sha256:aaf7c027a421e6059448e019271111877f208b577b756f5e79645c3d497ed26e`.
No live test fixtures have been added. The initially planned repeat comparison is superseded below.

User clarification (20:03 UTC): repeated protected-row fingerprint captures are excessive for
this development build. Skip the additional baseline/comparison and retain targeted hosted
behavior checks. The earlier preservation evidence remains historical evidence, not a recurring
release requirement. Preserve existing play data through the normal scoped content refresh.

The user updated the broker-granted key, but the existing session's retry still received
`deployment:functions:runInternalActions` denial before the content action executed. Retry log:
`/srv/presidium/projects/salient/test-artifacts/release-4f3fe13-20260920/content-a0a700a-key-refresh.log`.
Temporary remote credentials were removed again. A fresh broker session is the next step;
backend, content and frontend state remain as recorded above.

Resume with a scoped development key authorized for the internal reseed action, verify
the uploaded release identity/build stamp, reseed the committed snapshot, publish the frontend,
complete targeted live checks through TESTER, then commit/push the release.
Do not roll back to code lacking starting-reward or condition-instance validators.

### Publication resumed — 2026-09-20 20:06 UTC

User-requested ownership transferred to DEPLOY2. The fresh session's scoped development key
successfully ran the existing content-only reseed: 1151 entries at pinned revision
`fb83a789da8f0327a389c277a0c790b1648d5810`. No backend repeat, build, upload of source,
auth reconfiguration or play-data reset was needed. The retained build passed the task's exact
asset-stamp guard and published as Worker `0336f2f4-1141-4d95-8bc6-d2cec63f8797`.
Backend and frontend executable source remains `a0a700af77740879e214c064876e277219f0f441`.

Temporary CT114 credentials were removed after publication; private helper services remain stopped.
Logs in the release artifact directory above: `content-a0a700a-deploy2.log` and
`frontend-a0a700a-deploy2.log`. TESTER job `test-hosted-a0a700a-live-deploy2` (Chords 1064)
passed authenticated content/foe readback, two bounded character cohorts and the dedicated public
real-dice V88 proof. V90 and V75 are excluded.

The [live certificate](docs/build/evidence/V85/tester-job-a0a700a-hosted-live.md) records the
exact manifest hash, 438-entry foe catalog and persisted Ghoul, starting rewards and complication
cohorts, and Eye Flash application/save cleanup. Natural attack dice 4+7 produced tier 2,
14 corruption damage and restrained; the target's actual save 7 succeeded against 6 and removed
the source-linked condition. Session closure and signout passed. Wider rule/privacy/history
coverage remains the retained integrated and isolated evidence; no full suite was repeated.

This release record is documentation-only after executable `a0a700a`. DEPLOY2 records the exact
closeout commit and verified `origin/main` SHA in its Chords completion announcement after push.

### V92 publication — 2026-09-20

Main fast-forwarded to reviewed `81b79316dbf11e18d44f3feab6e7f1d3b49f5d22`.
TESTER's existing `2b46094` pass covers unchanged application code: 367 engine + 577 app/script
tests, four Forge counterparts and 36 headless scenarios. Backend publication, content reseed
and hosted frontend build/publish passed. Worker: `f6951468-0bfe-49bd-b0ab-1ec9628334fc`.
Content: 1182 entries, `sha256:ea1f6a2cf1d3c8a30f5fa40aef52fdadc25aa97900648485c9fe5957a50cf43b`.
Logs: `/srv/presidium/projects/salient/test-artifacts/V92-release-81b7931`.
Temporary credentials removed; private hosted helper services stopped.
TESTER smoke `test-V92-81b7931-hosted-smoke` passed in 6.24 s (Chords 1134): persisted Shadow
Insight/abilities and college replacement, with signout. Raw result:
`/srv/presidium/projects/salient/test-artifacts/V92-hosted-81b7931`.

### V75 Quiet theme publication — 2026-09-20

User-approved presentation changes merged at `c4ed53e48c74f5783b876cd6a7c09fafe2f0795c`.
TESTER `test-V75-c4ed53e-1` full check passed (exit 0, 162 s); that result was reused on promotion.
Hosted build and frontend publication passed. Worker: `31c58f6d-cfe2-4848-945e-908aa4104003`.
Backend source remains `81b7931`; content remains the V92 1182-entry snapshot. No backend deploy
or reseed was needed. Temporary credentials removed and private hosted helper services stopped.
Logs: `/srv/presidium/projects/salient/test-artifacts/V75-release-c4ed53e`.

TESTER1179 hosted smoke passed in 1.27 s: public HTML, CSS and all three referenced fonts
returned HTTP200 with exact hosted-build hashes; Quiet background/accent/Schibsted tokens were
present. No browser run. Evidence: `/srv/presidium/projects/salient/test-artifacts/V75-hosted-c4ed53e`.
