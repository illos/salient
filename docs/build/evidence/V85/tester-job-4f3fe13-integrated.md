# V89 integrated pre-promotion identity certificate

2026-09-20 — TESTER job `test-V89-4f3fe13-integrated-closeout`, request Chords 1023.
Result: **PASS for pre-promotion identity/metadata gate**. Live publication is not yet verified.

Source: `integration/V85-V88`, `4f3fe13df73e9bf2914e085df72a00f185b79d6c`.
Tree: `c82728907215a1f506c0241eca215c20723ad37e`.
Worktree: `/srv/presidium/projects/salient/code/.worktrees/deploy-v85-v88`.
Base/main remained `184af2398df5e035b35bbc4a42f1df48893578d5`. Tracked tree clean.

- Exact identity to tested/reviewed `dff62e8` except `docs/build/STATUS.md` and retained
  `docs/build/evidence/V85/tester-job-a0c9584-integrated.md`. Includes tests, config, dependency
  lockfile, scripts, application, content and testing guide. Both actual vendor pins match.
- `node scripts/check-commit.ts --merge --range 184af23..HEAD`: all 11 commits pass.
- `node scripts/check-links.ts`: 397 Markdown files pass.
- `git diff --check dff62e8 HEAD`: pass. Full integration range excluding historical raw
  `docs/build/evidence/**/*.log`: pass. Unfiltered range returns exit 2 solely for whitespace
  in retained raw logs already byte-identical to the tested baseline; preserved, not rewritten.
- Dry-run relevant source paths are identical to `a0c9584`; retained dry-run exit is zero.

Reuse V89's full PASS (358 engine + 575 app/scripts, content/report/build gates, 355.78 s),
recorded in `docs/build/V89-test-foundation.md` and
`/srv/presidium/projects/salient/test-artifacts/test-foundation-V89`.
Reuse the non-publishing development Convex dry run recorded in
`docs/build/evidence/V85/tester-job-a0c9584-integrated.md` and its artifact directory.
No full suite, build, dry run, backend, browser, upload or data operation ran in this closeout.

Raw checks: `/srv/presidium/projects/salient/test-artifacts/V89-4f3fe13-integrated-closeout`.
DEPLOY may incorporate this certificate without requesting another full gate for the certificate.

## Targeted live gate to submit after publication

Reserve CT114 hosted build capacity for DEPLOY; no competing coordinator job will start.
DEPLOY must still inspect actual host capacity before its build. Submit exact backend deployment
and Worker revision/source proofs plus the final manifest hash and URL configuration.

1. Verify actual Worker/backend identities and public availability/auth origin; frontend source
   alone cannot prove backend deployment. Confirm content:status matches the committed 1151-entry
   manifest and 438 stat blocks, and one newly reachable foe loads through the public route.
2. Reuse the hosted-compatible character runner for the bounded `starting-rewards` and
   `complication-table` cohorts, serially, using fresh disposable actors/campaigns and exact
   source/runner identity. Preserve unrelated campaigns; retain fixture data and sign out.
3. Add a small public API proof in an exclusively owned campaign of V88 condition application,
   provenance/save registration and cleanup through existing commands. Use real campaign dice;
   no imports or outcome editing. Submit the exact script/scenario for inspection before running.
   The existing v88-headless.ts explicitly refuses hosted targets and must not be bypassed.
4. Compare protected existing data before/after deployment and reseed, then separately account
   for live-test fixture additions and normal session changes. Record failures without rerolling.

No dedicated hosted preserved-data fingerprint utility was found in the inspected deployment
runbooks; the old local archive procedure is not cloud proof. Before publication DEPLOY should
retain a read-only snapshot/export using the installed cloud CLI's supported procedure, in a
restricted local artifact directory, and canonical hashes keyed by table/document ID for protected
campaign/character/play rows. Compare those after reseed before test records are added. Content
rows intentionally change; concurrent user edits must be explained, not silently excluded. Do not
publish raw auth secrets. This is a proposed preservation check, not an already-executed result.
