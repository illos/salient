# Partial release: protected-row preservation certificate

2026-09-20 — TESTER, Chords request 1037, read-only development target `different-bat-943`.
**PASS within the captured scope: all 5,972 existing rows are unchanged.**

- Application: 35 tables, 5,551 rows. BetterAuth component: 10 tables, 421 rows.
- Exact document-ID and canonical sorted-key SHA-256 comparison: zero changed, removed or added
  rows. No row deltas require explanation; transient auth/session/presence rows also match.
- Fresh application and auth table inventories match the pre-publication lists exactly.
- Content manifest is byte-equivalent after JSON decoding, still **567 entries**, hash
  `sha256:aaf7c027a421e6059448e019271111877f208b577b756f5e79645c3d497ed26e`,
  Compendium revision `fb83a789da8f0327a389c277a0c790b1648d5810`.
- Post-capture window: 2026-09-20T19:53:10.422075+00:00 through 2026-09-20T19:54:40.523851+00:00.
  Pre-capture window: 2026-09-20 19:48:38–19:49:55 UTC.

These are non-atomic read-only table captures, not an atomic backup or a restore proof. The
scoped key refused export with `deployment:backups:create` missing. Content rows (intended reseed),
storage bytes and system tables are outside comparison scope; contentManifest is included.
The identical manifest does not independently hash all content rows. Each captured table was
strictly below the 4,095-row cap; no truncation accepted. No imports, writes or fixtures ran.

DEPLOY reports backend source `a0a700af77740879e214c064876e277219f0f441` published, reseed
refused before execution for missing `deployment:functions:runInternalActions`, and Worker still
`bb430814`. This job confirms retained rows and manifest, not frontend promotion or live feature
acceptance. The release remains partial; 1,151-entry reseed/frontend/live gates remain outstanding.

Restricted evidence directory:
`/srv/presidium/projects/salient/test-artifacts/cloud-preservation-4f3fe13`.
Private raw captures: `pre-final/`, `pre-auth/`, `post-final/`, `post-auth/`.
Canonical comparisons: `comparison.json`; capture scripts and logs retained alongside.
Directory permissions 0700 and file permissions 0600 verified. Only this credential-free certificate
is intended for repository incorporation; raw gameplay/authentication records must remain private.

## Bounded documentation checks

For the six frozen partial-release documentation files on main `a0a700a` submitted in message 1039:
`node scripts/check-links.ts` passes (398 Markdown files); `git diff --check HEAD` passes;
`node scripts/check-commit.ts --merge --range 4f3fe13..a0a700a` passes. Exact checked document
hashes are retained in `partial-doc-hashes.json`. Existing V89 full results are reused; no test
suite, build or dry run was repeated. TESTER did not modify shared main.
