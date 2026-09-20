# V69 character coverage evidence

Candidate source `ab0f2fd875155d929f5efed201b14d96a821f4f7` on `slice/V69`, based on
main through V63 `b6109b0` with preserved V65 and new Hakaan/Orc units. Not merged into main.
The later V67 pure compiler is absent from this candidate; it does not change deployed app code.
All workloads run on CT114 in named environment `hosted`. No browser activity.

| Check | Result | Evidence |
| --- | --- | --- |
| Content generation and focused ancestry tests | Exit 0; 515 entries, 11 tests pass | [Log](focused.log), [exit](focused.exit) |
| Initial full check, source `c1fa4cb` | Exit 2; 310 engine tests pass, new live assertion needs explicit nullable-content narrowing | [Log](check.log), [exit](check.exit) |
| Backend/content/frontend publication | Exit 0; source `ab0f2fd`, 515 content entries, Worker `7830be2c-15d9-4c6f-8634-25c0edf55988` | [Backend](deploy.log), [content](seed.log), [hosted build](hosted-build.log), [frontend](frontend.log) |
| Authenticated public character API suite | Exit 0; 26 pass, no failures/skips, 82.857 seconds | [Report](headless.json), [exit](headless.exit) |
| Corrected full `pnpm check` | Exit 0; 310 engine + 427 app/scripts = 737 tests, lint/types/links/vendor/content/build pass | [Log](check-fixed.log), [exit](check-fixed.exit) |

The one-line assertion typing defect was fixed without weakening missing/empty-content checks.
The corrected complete check ran once; there was no timeout extension or blind retry. Full-check
command had a 420-second cap. Raw remote logs remain at `/srv/dev/salient/hosted/artifacts/v69/`;
committed logs remove ANSI formatting and trailing whitespace only.

Independent implementation review: [report](../../reviews/V69-implementation-review.md).
Authentic Forge counterparts remain a separate, unsatisfied acceptance gate. Browser-only UI
scenarios are recorded in the shared backlog.

The API suite covers all six implemented ancestries, all new Hakaan/Orc purchase witnesses,
nonempty trait sources, Hakaan ancestry replacement, Orc Artisan target persistence/removal,
and unchanged privacy/review/history/progression/combat-lock boundaries. This is sampled workflow
proof, not every ancestry/class/rules combination. Disposable test records remain; owned sessions
were revoked. Temporary deployment credentials were removed and all runtime jobs ended.

Deployment reported removal of two unused chat/presence indexes. The UI owner confirmed these were
accidentally staged by its codegen at 02:50 UTC; no V68 functions or data were deployed. Publication
paused for that confirmation, then continued. No play data was reset. Chords messages 651/652
retain the coordination; this did not require a repair.

Independent pinned-source reviews pass for [Hakaan/Orc](../../reviews/V70-V71-rules-review.md)
and [the preserved four ancestries](../../reviews/V57-V61-rules-review.md).
