# Audit repairs and final verification — 2026-09-14

The identified S01/S02/A01/A03 defects are repaired and have fresh independent implementation
reviews. Changed rules/source claims also pass bounded independent review against local pinned
Compendium `fb83a789da8f0327a389c277a0c790b1648d5810`. No rules ruling or vendor pin changed.
This record follows the [original audit](2026-09-14-coordinated-audit.md) of base
`8e9e315dcee3642bbc0d4b2422421dc1aedfb26e`.

Repair commit: `7b86b8a`. The following documentation commit records this receipt in the slice tracker.

## Repairs and independent review

| Area | Result | Independent evidence |
| --- | --- | --- |
| S02/A01 F1–F5 | Nested deletions are journaled; dice/history share authenticated issuer scope; cards retain their actor and original session; closure is registered and attributed. | [History re-review](2026-09-14-review-fixed-history.md), pass |
| A03 F6–F8 | Server projections enforce Malice, test-difficulty, foe-health and peer-resource audiences across roster and history. Observing owners retain their own read access but receive no gameplay controls. | [Audience re-review](2026-09-14-review-fixed-audiences.md), pass |
| A03 F9 | Foe Add/Remove buttons and legacy APIs use registered, journaled operations, with shared authority, pause checks and retries. | History and audience re-reviews, pass |
| A03 F10 | Recovery events preserve and display complete verbatim Catch Breath and Recoveries sources with provenance. | Audience and [content re-reviews](2026-09-14-review-fixed-content.md), implementation and bounded rules pass |
| S01 F1/F2 | Full feature arrays and JSON source paths survive storage/loading; generated date derives from the pinned source commit, rather than trusting prior output. | Content re-review, pass; all 403 entries independently compared |
| Reproducibility/docs | Source tests read exact pinned Git blobs in sparse checkouts. The projection's name input is correctly documented as authored metadata. Open question blocks are under the Open heading without changed rulings. | Content re-review, pass |

Three agents implemented independent repair groups; the coordinator integrated foe registry and
browser work. Three fresh agents then reviewed the repairs. Implementer records are
[history](2026-09-14-fix-history.md), [audiences](2026-09-14-fix-audiences.md) and
[content](2026-09-14-fix-content.md). The reviewers' records distinguish their own tests from
coordinator execution and identify their reviewed inputs.

The audience reviewer found an additional difficulty-label collision when a public skill name
contained `; hard: `. Redaction now removes the generated trailing difficulty/outcome suffix;
two permanent regressions preserve the skill and hide the actual difficulty. The reviewer
independently reproduced and retested the repair. Visual inspection found a long stable-ID command
hint overflowing its hero card; wrapping and width assertions now cover that case.

## Final local verification

- `pnpm check`: pass, **51 engine + 214 app/scripts = 265 tests**, plus lint, formatting,
  TypeScript, documentation links, pinned vendors, content generation and production build.
  Vite retains its advisory 500 kB chunk-size warning (523 kB main bundle).
- Real Convex deployment: final `convex dev --once` succeeds against local anonymous
  `anonymous-agent`, API `127.0.0.1:3212`, auth site `127.0.0.1:3213`.
  The original audit exercised the actual 19-table reset. The repairs required no further reset.
- `pnpm content:seed`: pass after schema changes, **403 entries**. Authenticated live reads confirm
  the pinned revision, all three Goblin features and the JSON source path in new loaded snapshots.
- Actual codegen generated the declarations for the new `audience`, `foeOperations` and `foeSource`
  modules. The final regeneration introduces no additional change. The original audit had already
  confirmed the old hand-extended declarations regenerated identically.
- `pnpm test:browser`: **5/5 passed** on the final deployed code (1.2 minutes). Chromium uses the
  real local backend and Vite on port 5180, with isolated Director/player/observer accounts.

The expanded table walkthrough exercises palette/console, registered foe creation, a Director's
Stamina adjustment and reload, cross-user command-ID separation, same-user retries, guided CLI
response, Recovery from 22 to 30 Stamina with Recoveries 10 to 9, exact source expansion, hidden and
revealed historical difficulty/Malice, consistent Winded payloads, peer resource limits and
observer-owned read-only controls. All result assertions use actual query/event readback.

The browser-only hero fixture imports disposable rows into a guarded local deployment because
A02 admission is not built. Gameplay then uses authenticated public operations. This is evidence
for the provisional A03 hero pane, not verification of a character wizard or admission workflow.

## Visual evidence

The final run captures Director/player/observer table pages in light and dark, the expanded Recovery
source, and the six existing login/campaign/character-list reference images. Document-width assertions
cover each table role at 1280 and 1440 pixels. Theme tests cover persistence, live system preference
and reduced motion. The original [A08 comparison](2026-09-14-A08-runtime.md) records the login and
campaign mockup structure review; the repairs preserve that structure.

The coordinator inspected all six final table images and the expanded Recovery image. The three
panes and controls fit; long stable-ID hints wrap inside the hero card; observers have no gameplay
controls; both verbatim source records remain visible inside the expanded log entry. Also inspected
the final login-dark, campaign-home-light and characters-light reference captures: no new clipping
or structural regression found. This is desktop visual review, not a pixel-diff or mobile claim.

Local evidence is ignored rather than published with synthetic account data:

- `.playtest/fixes/check-final.log`, `deploy-final.log`, `seed.log`, `browser-final.log`.
- `.playtest/fixes/live-evidence.json`, `table-{director,player,observer}-{light,dark}.png`,
  `recovery-source.png`.
- `.playtest/a08/{login,campaign-home,characters}-{light,dark}.png`.

## Remaining boundaries

S00 GitHub Actions still needs a remote run. No additional tool is needed for local checks,
browser inspection or GitHub access; a push would publish the existing unpushed build to the public
repository and has not been performed. Local success is not a claim of hosted CI success.

Q-R-1–3, Q-R-50–52, Q-R-100–103, Q-R-200–201 and Q-A-200 retain their provisional/deferred status.
R03 Q-R-200 still needs a product ruling. A02, A04–A07 and A09 remain unfinished. No full v0.01,
mobile/cross-browser or sustained-session acceptance is claimed by this repair.

Existing loaded foes retain their immutable old snapshots until recreated, and historical Recovery
events are not backfilled. Legacy unscoped history stays separate from newly scoped command history.
These are disposable-development-data boundaries, not verified production migrations.
