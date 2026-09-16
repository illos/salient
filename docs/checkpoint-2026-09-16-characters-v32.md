# Character track checkpoint — V32, 2026-09-16

Paused at the user's request after completing V32. No new implementation or merge is assigned by
this checkpoint.

## Saved state

- Worktree: `/srv/presidium/projects/salient/characters-build`.
- Branch: `slice/V32`, based on `f7137dc`.
- Implementation and evidence: `d9da1df`; verified branch handoff: `bb67e09`.
- V32 is committed and independently reviewed, **not merged**. No V32 shared runtime update occurred.
- Shared `main` is now `bf19165`, following the UI thread's V31 merge. V32 has not been integrated
  with that newer main; the earlier verification applies to the recorded branch base.
- Own isolated backend/site/frontend ports 3230/3231/5290 are stopped; confirmed no listeners at
  checkpoint. No runtime was started or changed to save this checkpoint.

## Completed slice

[V32](build/V32-fury-progression-history.md) adds Fury/Berserker level 1→2 advancement with scoped
saved choices, XP/respite eligibility and automatic grants, plus immutable build history and
additive restoration through the existing review lifecycle. Live resources and authored details
are preserved; activation applies downward resource caps. Stale full edits cannot silently revert
an advancement. Director-only manual XP adjustment uses the shared operation registry.

Danger Sense and either Wrecking Ball or Special Delivery are supported. Other legal level-two
perks are shown as unsupported. Bespoke gameplay effects, automatic respite/XP rewards, broader
class/level progression and Forge import/export adapters remain future work.

Long-term scope remains all eleven classes through levels 1–10, including Beastheart and Summoner.
Preserve Forge import/export mappings and source-derived class knowledge for engine and UI work.

## Verification retained

- 455 tests plus lint, types, pinned-source/content checks and build passed.
- Real Elementalist regression and Fury advancement/history browser journeys passed; the final
  source-level label correction passed a separate complete Fury rerun.
- Actual Forge website creation/export/import/advancement/reimport compared against the build.
- 62 source-ledger hashes and 20 byte-exact granted source texts independently checked, along with
  baseline values, live-state preservation, Director approval and four retained history entries.
- Fresh independent whole-slice implementation and rules reviews both pass.

Read [evidence and screenshots](build/evidence/V32/README.md) and the
[independent review](reviews/V32-independent-review.md). Raw Forge captures and authenticated
readback remain in the ignored `.playtest/v32/` directory of this worktree; durable summaries,
hashes, logs and screenshots are committed. Preserve that directory if moving the worktree.

Checkpoint-only verification: documentation links, whitespace and commit-trailer gate. Application
tests were not repeated for this documentation change.

## Resume steps

1. Start in the character worktree, read project instructions and this checkpoint, and inspect Git
   state plus Chords updates. Do not use the older general planning checkpoint as current track state.
2. Read V32's slice, evidence and reviews. The slice is finished on its branch; do not rebuild it or
   claim it is already available in the shared app.
3. If the user assigns integration, coordinate ownership, integrate current main and resolve shared
   tracker/spec changes while preserving V31. Run checks appropriate to the combined changes and
   obtain renewed review where behavior changes. Coordinate browser runs to avoid host contention;
   use `VITEST_MAX_WORKERS=1` for broad checks.
4. A merge includes updating the established shared development backend, content and frontend,
   preserving compatible play data, then verifying the changed journey in the running app. Confirm
   the actual target before acting; the existing shared frontend/backend were 5180/3212. Follow the
   [merge completion procedure](build/README.md#merge-completion-includes-the-playable-app).
5. A later character slice remains to be selected. This checkpoint assigns no additional class,
   level or automation work.

V31 integration note from the UI thread: unavailable icon-only `CommandButton` controls now use
`aria-disabled` and remain focusable. Preserve its tooltip, inertness and dark/light hover behavior
when combining UI changes. Inspect current code and review evidence rather than copying old markup.

## Ready-to-paste resume prompt

```text
Resume the character wizard track in /srv/presidium/projects/salient/characters-build,
branch slice/V32. Read docs/checkpoint-2026-09-16-characters-v32.md first.
V32 is built, verified and committed, but unmerged. Inspect current main and Chords updates;
retain the source/Forge/browser evidence and distinguish branch acceptance from shared-app
verification. Continue with the task I assign; do not restart V32 or infer merge authorization
from the checkpoint alone.
```
