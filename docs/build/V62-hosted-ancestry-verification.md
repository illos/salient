# V62: Hosted ancestry verification

Status: deployment preparation in progress. Rules review: not required for this integration/test task;
ancestry rules reviews remain owned by V57/V58/V60/V61.

The user authorized publishing the current ancestry changes to the existing remote app and running
tests there on 2026-09-20. This explicitly permits hosted testing before the ancestry acceptance queue
is complete. It does not mark Forge comparisons or final reviews passed and does not require a main merge.

Spec: [hosted targets](../hosted-development.md#targets-and-data),
[Astra failure handling](astra-character-workflow.md#runtime-and-failure-handling).

Candidate branch `slice/V62`, `.worktrees/astra-hosted`, combines the existing fresh Astra Devil,
Polder, Dwarf and Human candidates on main `0f47e89`. Preserve their logical implementation commits.
Shared composition and corpus are combined; no Opus inputs. CT114 named `hosted` runs builds and
browser clients. Actual application target: Cloudflare `salient-dev.rdxx.workers.dev` and Convex
Cloud development `different-bat-943`. Existing cloud data and credentials must be retained.

Plan: generate combined corpus; full check; verify authenticated target; build and deploy matching
backend/content/frontend; run closeout and ancestry browser journeys then broader regression.
Retain command outputs, exact deployed commit/version, failures and actual exit codes. A hosted
pass supports an environment-dependent failure hypothesis; it cannot by itself prove why CT114
exceeded the query deadline. Diagnose concrete failures rather than silently retrying or increasing
timeouts. Record browser-fixture failures separately from application failures.

Integration changes: enable all four ancestry modules together and regenerate the union corpus
(499 entries). Adjust the existing wizard unsupported-choice check to Dragon Knight now that Dwarf
is supported. Normalize V57 engine imports to the project's NodeNext `.ts` convention.

The V43 hosted record had already demonstrated fixture login-rate-limit failures. V62 changes
only test setup to reuse a legitimate authenticated session across CLI operations and revoke it in
`finally`; no application rate limit, assertion or deadline changes. Existing closeout and table
journeys provide meaningful validation for this fix. New Dwarf/Human browser journeys add actual
UI create/save/reload, complete-choice readback and rule-card verification to their engine checks.
