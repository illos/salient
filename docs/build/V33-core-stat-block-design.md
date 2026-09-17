# V33: Core-style stat blocks and automatic glyph semantics

| Field | Value |
| --- | --- |
| Track | UI/polish |
| Owner | Codex, Core-Style Monster Content Presentation |
| Depends on | A08, S01, integrated Rules/Foes/sheets; V28 vocabulary carried forward |
| Rules review | not required: source transcription/presentation, no mechanical changes |
| Status | Complete; approved design merged into main with V34 production rollout |

## Goal and scope

Deliver the user's requested Core-style monster design and a small automatic ARIA system for known
single/composed glyphs. See [the owning design](../monster-presentation-spec.md) and
[the glyph vocabulary](../glyph-usage-spec.md). Existing production screens are audited, not replaced.

Deliverables: interactive design study; finite semantic token/role/name descriptor shared by React
and generated HTML; font/fallback/selection contract; pinned-source pipeline audit and rollout method;
exhaustive reference tests and real-browser evidence. No new gameplay, backend changes, content editions,
main merge or shared playable-environment update.

## Acceptance

1. Monster and hero reference examples use pinned source text with the Core-book visual hierarchy.
2. Every known family/composition receives its role and accessible name automatically; ornaments hide.
3. React and generated HTML have equivalent semantics. Potency is one unit, never individual letters.
4. Text selection has semantic names; blocked fonts retain readable fallback; themes and narrow layout work.
5. The pipeline audit identifies actual losses and an enforceable future source-to-consumer coverage gate.
6. Independent implementation/design review checks the delivered scope and records production gaps honestly.

## Work log

2026-09-17: claimed `/srv/presidium/projects/salient/ui`, `slice/V33` from main `eda0ebf`.
Prior UI worktree was detached; preserved its untracked Core scans, then ignored them as V28 intended.
Imported V28 specification/reference documentation from `391509c` without merging its historical tracker.
The user's steering prioritizes automatically applied ARIA for the small set of known compositions.
V33 supersedes V28's role prohibition, unchecked font fallback and per-call decorative override.

Remote target is named CT114 `ui`, Compose `salient-ui-dev-5363f12d852c`; main remains untouched.
The stock helper recognizes the registered worktree, but SSH reports UNKNOWN_PROJECT from its sibling
cwd. A temporary copy of the client launches only its broker subprocess from the canonical `code`
checkout, retaining the validated UI source archive and identity. No broker policy/grant was changed,
no direct credentials used, and no workload ran on Presidium. Runtime helper fix belongs to infrastructure.

Verification is recorded in [V33 evidence](evidence/V33/README.md). Independent review is in
[the design review](reviews/V33-design-review.md). The shared renderer and Core visual study are
complete; production consumers remain a separately scoped rollout.

Independent review **pass**, 2026-09-17. The review found and verified fixes for scalar source
movement, source clause ordering, punctuation tokenization, inherited object keys, and scaling
spacing at doubled text size. Full check passes 437 tests; final Chromium run passes both browser
tests in 4.9 seconds and records 76 native image roles/names. Font hash, five source fixtures,
190 documentation links and whitespace verified. This commit is a branch handoff, **not merged**.
The named UI preview remains running for the user's design review; shared main is unchanged.

Subsequent integration, 2026-09-17: the user approved the design and requested sitewide rollout.
[V34](V34-sitewide-core-presentation.md) integrated this commit `bc773c1` together with production
adapters `e3ae838` into main, updated shared CT114 main, and passed all three live rollout scenarios.
The earlier branch-only statements above describe the original V33 checkpoint.
