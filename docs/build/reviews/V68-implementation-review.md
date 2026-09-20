# V68 implementation review

Reviewer: fresh Fable 5.1 subagent (`v68_review`), static read-only review in the slice worktree.
Round 1 (2026-09-20, range `1f65278..f5eddbf`): **changes required** — three blocking findings
(non-discriminating hero-level test with a silent level default; acceptance check 4 unproven; chat
`before` paging could skip a message sharing the boundary millisecond) and nine non-blocking notes
(dead `web/command-input.tsx`, stale detach comment, "Untitled" text, 50-session bound, check log
not in the checkout, obsolete `v21-campaign.spec.ts`, and others). All are recorded with their
repairs in the slice work log.

Round 2 (2026-09-20, range `f5eddbf..80fc64b`): **pass**.

- Blocking 1 resolved: `campaigns.get` lists only characters with an effective revision and reads
  the level from it; the test levels Thorn to 2 through the real advancement route.
- Blocking 2 resolved: six-session test proves numbering from the oldest and recap scoping.
- Blocking 3 resolved: `chat.send` keeps `createdAt` strictly increasing per campaign; a
  52-message frozen-clock test proves both pages with no loss or repeat.
- Non-blocking items addressed; remaining non-blocking notes: `createdAt` may run ahead of the
  wall clock by a millisecond per message in a burst (display only); the headless table gained its
  two new sub-steps in prose (now added as rows); the XP threshold comment is not load-bearing.
- Commit trailers valid; `Reviewed-By: v68_review (pass, 2026-09-20)` added at handoff.
- Acceptance checks 1–10 proven headlessly or by code reading; browser behaviour pending under the
  moratorium with backlog rows logged.
- Not verified by the reviewer: no commands executed; rendering, scroll, focus and pop-up
  behaviour; the XP threshold value against the Compendium.
