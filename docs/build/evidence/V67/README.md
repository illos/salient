# V67 headless pure compiler verification

Target: CT114 named `engine-compiler`, base main `2f5544f`. No browser execution,
shared-runtime update, or live ability migration. Backend/web were stopped before test jobs.
The application-facing contract in this slice is the pure TypeScript compiler/outcome API;
its developer-facing headless route is:

```sh
node scripts/report-compiled-abilities.ts .playtest/v67/report-a
```

The focused runner exercises the public pure API against pinned source envelopes, accepted dice
and explicit actor/target facts. It checks calculated outcomes and refusals directly; there is no
persistence in this slice to read back. The CLI report reads the same V64 corpus adapters and
writes per-occurrence definitions, unsupported sections and diagnostics. All entries remain
`live: not-wired`, including those eligible for the bounded pure evaluator.

Verification artifacts: The source metadata records
the initial sync commit plus its dirty working tree; remote formatting subsequently changed source
layout. The separately captured file manifest identifies the actual tested bytes, which were
retrieved into the branch. Commit IDs are not substituted for those actual source facts.


- [Full check](v67-check-output.txt), [exit 0](v67-check-exit.txt): 742 tests
  (284 engine, 458 app/scripts), lint/format/types, links/pins/content and build.
- [Focused run](v67-initial-focused-output.txt), [exit 0](v67-initial-focused-exit.txt):
  39 compiler/outcome/report, 19 R04 resolver and 12 V64 audit cases.
- [Report](support.md) and [full JSON](support.json): 6/52 hero and 4/1158 foe envelopes
  meet the bounded pure evaluator gate; 15 grants, 25 kits and 14 Malice envelopes remain manual.
  This is deliberately stricter than V64 grammar recognition, which permits mechanical remainder.
- [Byte comparison manifest](v67-report-comparison.txt): both report CLI generations match in
  JSON and Markdown; the extracted V64 audit also matches its original committed JSON/Markdown.
- [Initial sync identity](source.json), [tested file manifest](v67-tested-files.sha256):
  all six source-file hashes match the local review candidate. Subsequent edits are documentation.

Commands ran serially through `presidium-dev --env engine-compiler run build -- …`.
`pnpm check` uses no browser tests. Report CLI was invoked twice at `.playtest/v67/report-a`
and `.playtest/v67/report-b`; `cmp` checked both formats, then `pnpm audit:abilities` regenerated
V64 and `cmp` checked each against a pre-run copy. All four comparisons passed. The independent
[final review](../../reviews/V67-headless-final-review.md) records implementation and pinned-source rules PASS. No live state or persisted format is accepted.
