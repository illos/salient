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
| Stable-cloud reconciliation | current `main` and existing hosted candidate | In progress | identify the exact hosted revisions; do not call the target stable until an integrated-main live pass |
| V85/V86 | `slice/V85` at `64972e6` | Awaiting owner handoff | rebase onto current main, rerun the affected integrated gates through TESTER |
| V88 | `integration/V88` at `c721d0b` | Integration held | owner adds persisted/headless proof for four abilities made reachable by V87, obtains TESTER pass, then hands the reviewed addendum back to DEPLOY |
| V75 | `slice/V75` at `2c7cfe2` | Not release-ready | user visual decision and refreshed handoff |

Update this ledger at handoff, integration, publication, verification and rollback boundaries. The
canonical feature/test detail remains in [docs/build/STATUS.md](docs/build/STATUS.md); this file tracks
only deployment ownership and release state.
