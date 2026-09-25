# Kickoff prompt: post-v0.01 development track

Historical prompt from 2026-09-16. Use [current project instructions](../AGENTS.md), the
[build process](build/README.md), and [testing process](../testing-process.md) for new work.
The text below records the earlier track handoff and is not an active workflow.

Use this prompt for one active track. Supply the track and bounded assignment when starting the thread;
the [roadmap's starting assignments](v1-roadmap.md#starting-implementation) provide recommendations.
To resume the planning/coordination session, use the
[2026-09-16 checkpoint kickoff](checkpoint-2026-09-16-development-tracks.md#ready-to-paste-kickoff-for-the-next-session)
first so existing track work is accounted for.

---

You own a bounded implementation slice in the selected development track of the Draw Steel companion:
parser/rules engine, foe coverage, characters, UI/polish, or app/social features. Deliver working,
verified behavior under the existing specifications. Make routine engineering decisions independently;
ask only when an unresolved product choice or pinned-source ambiguity materially affects the work.

## Establish the assignment and current state

Read `AGENTS.md`, `AGENTS.md`, `AGENTS.md`, `docs/v1-roadmap.md`, `docs/build/README.md`,
`docs/build/STATUS.md`, and the assigned slice and its owning specs. The repository's shared main
checkout is `/srv/presidium/projects/salient/code`; implementation belongs in your own worktree.
Read `docs/build/evidence/v001-acceptance.md` for the accepted prototype and inspect the current code,
Git history, branches/worktrees and uncommitted work before claiming that later changes are verified.

Choose one bounded slice within the assigned scope. Expand an existing outline or use
`docs/build/_template.md` for a smaller slice, recording its actual dependencies in `STATUS.md`.
Name its primary track, user-visible outcome, source/spec references, affected shared contracts and
acceptance checks. Do not start implementing an entire track or bypass an existing hard dependency.
If only a track was named, propose its first bounded slice from the roadmap and complete independent
assessment/research while any material scope decision is pending.

## Isolate and build

Follow `docs/build/README.md#branch-and-merge-policy`: create a short-lived `slice/<id>` branch from
integrated `main` in a separate worktree, preserving other threads' work. Record the worktree/branch,
owner and nonsecret development/test target in the slice work log. Coordinate ownership through the
lead and the single `STATUS.md` tracker; branches do not make overlapping shared-contract edits safe.

Initialize the recorded vendor pins and pinned dependencies. Keep both vendor trees unmodified. Use
applicable backend skills and actual installed tooling to set up isolated development runtime/data
when live tests or backend changes require it. Do not sync/reset another track's backend or the user's
playable environment. No cloud publication or production deployment is implied by this assignment.

Keep source content, character build evaluation, live state, pure rules resolution, application
permissions/persistence and presentation at their existing boundaries. Every table control uses the
registered shared operations available to UI and headless clients. Coordinate contract changes with
the consuming tracks and integrate small prerequisites where needed.

Content coverage may advance ahead of automation. Correctly represent supported data/calculations,
show full source text under existing audience rules, and identify manual/unsupported effects.
Dependent automation requires actual resulting facts/state; do not silently invent facts or apply
accepted manual results twice. For rules work, use only the pinned Steel Compendium and existing
rulings, preserving case-specific decisions. Research ordinary source definitions independently.

## Feedback, verification and handoff

The user gives hands-on UI feedback at the desktop, and may discuss other work by phone dictation.
Provide concise reports with concrete inputs/outcomes; use screenshots for visual questions. Continue
all authorized work that does not depend on a pending answer. Use the existing question queue for
cross-thread decisions, ask in plain text, and update owning specs when decisions arrive. Do not
introduce a standing questionnaire or treat a delayed reply as approval.

Run the slice's required checks and the build process's verification/review steps. Verify actual
persisted state and history when behavior changes them. Keep source-derived expected outcomes
independent of implementation. Obtain required independent implementation and rules reviews; do not
self-attest review or treat automated browser checks as proof of enjoyable long-session use.

Update the owning specs and slice work log with what changed, what passed, what remains manual, and
any real limitations. Commit using the existing trailers and hand the slice to the lead for verified
integration into `main`. When assigned the merge, complete both Git integration and the shared playable
app update under [the merge completion directive](build/README.md#merge-completion-includes-the-playable-app).
The merge request authorizes routine updates to the established development target without a second
confirmation. Record the target, affected backend/content/frontend sync and live changed-feature check;
report pending runtime work as incomplete. Documentation-only changes may record no runtime impact.
A track's unfinished future work does not prevent integration of a complete, reviewed slice.
