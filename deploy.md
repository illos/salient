# Deployment

DEPLOY owns integration of finished branches into `main`, final release commits, the verified push
of `main` to GitHub, and promotion of the integrated revision to the live stable cloud environment.
TESTER owns all pre-release and post-release test execution under
[testing-process.md](testing-process.md).

## Stable target

- Frontend: `https://salient-dev.rdxx.workers.dev` (`salient-dev` Cloudflare Worker)
- Backend: Convex `dev:different-bat-943`
- Procedure and credential handling: [docs/hosted-development.md](docs/hosted-development.md)
- The browser moratorium applies. Release proof uses the supported authenticated CLI/API routes.
- Existing play data is preserved. Content is reseeded only when the release requires the pinned
  snapshot; schema compatibility is checked before backend publication or rollback.

The cloud target is stable only when its backend, content and frontend are recorded against one
exact integrated `main` revision and TESTER has passed the live checks. A branch-only candidate or a
partially updated target is not stable.

## Promotion gate

1. The implementation thread submits its frozen candidate to TESTER. TESTER returns the result to
   that requester. After a clean return, the implementation thread sends DEPLOY the finished commit
   with review verdicts, TESTER evidence, dependencies, affected runtime components, data/content
   actions and rollback constraints. TESTER copies are informational; the owner's explicit handoff
   makes the candidate eligible for integration.
2. DEPLOY rebases or merges onto current `main`, resolves overlap with the owners, and records the
   exact integrated commit. No unreviewed repair is folded into a release.
3. DEPLOY submits that commit to TESTER for the smallest sufficient integrated release gate. TESTER
   returns that result to DEPLOY through Chords; DEPLOY does not run tests or test stacks.
4. After a pass, DEPLOY publishes affected components with the hosted runbook, records the backend
   revision, content hash/count, Worker version and preserved-data result, then asks TESTER to verify
   the live target.
5. After the live pass, DEPLOY commits the release record, pushes the certified `main` lineage to
   GitHub, verifies `origin/main`, and announces the result through Chords. Record the executable
   deployment SHA separately from a later documentation-only closeout SHA.
6. A release closes only after the live pass, verified GitHub push and Chords announcement. On
   failure, keep the last compatible frontend available, do not reset data, and record whether Git
   integration, the Git remote or any runtime component advanced.

Cloud publication is serialized. Documentation-only integrations record why no runtime update is
needed. Changing domains/accounts/plans or introducing production secrets is separate from this
standing role unless the user explicitly includes it.

## Job ledger

| Job | Candidate | State | Next gate |
| --- | --- | --- | --- |
| Stable-cloud reconciliation | `main` release source `a0a700a` | Partial publication; blocked on scoped-key permission | backend published; content action denied (`deployment:functions:runInternalActions`); previous frontend retained; live gate and GitHub push pending |
| V85/V86 | owner `64972e6`, integrated `4f3fe13` | Merged; included in published backend | resume content/frontend publication and live TESTER gate |
| V88 | integrated with V85/V86 at `4f3fe13` | Merged; included in published backend | committed inventory 13/1259/2 requires 1151-entry content refresh before live certification |
| V89 | owner `dff62e8`, integrated `4f3fe13` | Merged; full 358+575 PASS reused by identity | build-only heap repair `a0a700a` independently reviewed and hosted build passed |
| V75 | `slice/V75` at `2c7cfe2` | Not release-ready | user visual decision and refreshed handoff |

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
