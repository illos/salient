# Claude Code project rules

These rules carry the project's standing instructions from `AGENTS.md` and `agent.MD` into every Claude
session and subagent. `agent.MD` remains the complete instruction set; read it in full before starting
work. If anything here conflicts with `agent.MD`, follow `agent.MD` and fix this file.

The user permanently abandoned the entire character Opus pilot on 2026-09-19. Do not resume
its assignments or reuse its code, tests, fixtures, research or processes. Opus has no new assignment.
See [the dead-end decision](docs/decisions/2026-09-19-opus-pilot-dead-end.md) and the staged
[Astra handoff](docs/build/character-restart-handoff.md). Keep the old `characters` environment stopped.
Every test must justify its existence with a concrete failure and added coverage; reject redundant
or implementation-mirroring tests. Follow [the test value policy](docs/build/README.md#test-value).

All future Salient development server activity, across all branches and worktrees, runs on the
dedicated dev LXC (CT114), accessed through the secret broker. Use `presidium-dev` for servers,
dependency installation, builds and browser tests, and `presidium-ssh dev-runtime` for guest
administration. Do not start these workloads on Presidium. Reuse the shared `main` environment;
concurrent branches need explicitly named environments. See [the runbook](docs/remote-development.md).

## Post-v0.01 development checkpoint — 2026-09-15

- Follow [the five-track roadmap](docs/v1-roadmap.md) and
  [track kickoff](docs/kickoff-development-track.md): parser/rules engine, foes, characters
  (wizard/sheets/progression), UI/polish, and app/social features.
- The [recorded prototype acceptance](docs/build/evidence/v001-acceptance.md) closes v0.01's bounded
  scope. Earlier shared-basics restrictions do not prohibit assigned post-prototype mechanics.
- Content and character coverage may grow with correct supported calculations and explicit manual
  effects while automation develops. Preserve V1 exclusions, privacy and shared-operation contracts.
- Use separate worktrees for active tracks, short-lived slice branches, and isolated development
  backends for backend changes. Keep `main` integrated and tested; coordinate shared playable updates.
- Desktop UI feedback may be slow; reports, screenshots and phone discussion support other work.
  Continue authorized work independent of pending user decisions; record answers in owning specs.

## Communication

- Never use the multiple-choice question widget or any structured question tool. Ask in plain text,
  one question at a time, with a recommendation.
- Distinguish confirmed requirements from proposals and assumptions in everything you write.
- Make routine engineering decisions yourself within the authorized scope. Ask only when an unresolved
  product behavior or source ambiguity materially affects the work.
- Do not reopen settled scope. Do not broaden into class- or monster-specific feature work unless the
  build slice you are assigned says so.

## Draw Steel rules research

- **Never search online for Draw Steel rules, rulings, errata, or content.** This applies to every
  agent, including delegated research and review agents.
- The pinned local Steel Compendium at `vendor/steel-compendium` is the only permitted source. Use
  `docs/compendium-navigation.md` to find definitions and follow references.
- **Never guess a rule.** If the pinned Compendium does not resolve a question, record the uncertainty.
  Do not invent formulas, outcomes, thresholds, or resource grants to finish a feature, a demo, or a test.
- Interpretation is allowed only when it is grounded in Compendium text, cites the file and section, and
  is labeled as an interpretation with the alternatives considered.
- Rulings the user has made apply only to their original cases. They are not precedent.
- Rules questions that need the user's decision are not asked in build threads. Append them to
  `docs/rules-questions-for-user.md` using its template and continue with work that does not depend on
  the answer. The user resolves that file in a standalone thread.

## Character track scope

Confirmed 2026-09-15 (Q-CHAR-14): the wizard track includes all eleven classes through levels 1–10
from the outset, including Beastheart and Summoner. Preserve sourced decisions, grants, progression
and Forge Steel import/export mappings as shared knowledge for parser, engine and UI work. Table
support has separate milestones. Other supplements/homebrew remain excluded. Follow
[the character specification](docs/character-wizard-spec.md#fuller-product-scope).

## Sources and dependencies

- `vendor/steel-compendium` and `vendor/forge-steel` are pinned Git submodules. Never modify their files
  and never advance their pins during builds, startup, or as a side effect of any task.
- Community data (Forge Steel, Compendium JSON) is input requiring validation. A successful import is not
  evidence of correct rules support.
- Project-authored code is `GPL-3.0-only`. Game content and artwork keep their own rights; do not copy
  them into application assets.

## Merge completion directive — 2026-09-16

A user request to merge includes integrating into `main`, updating the established shared playable
development environment's affected backend/content/frontend, and checking the result in the running
app. This is standing authorization for routine development updates; no second deployment confirmation
is needed. Verify the target, coordinate through Chords, and preserve compatible play data. Report any
pending runtime update as incomplete. Documentation-only changes may record no runtime impact; an
explicit code-only request overrides the default. Existing external/production publication boundaries
remain. Follow [the full procedure](docs/build/README.md#merge-completion-includes-the-playable-app).

## Building

- The build is organized into slices under `docs/build/`. Read `docs/build/README.md` for the process,
  then the slice document you are assigned. Do not start work outside an assigned slice.
- Every commit that implements or changes specified behavior references the owning spec sections.
  Use the `Spec:` trailer format from `docs/build/README.md`.
- Keep game rules resolution out of UI components. Every table control is a registered shared operation
  usable from the UI, the command palette, slash commands, and headless calls.
- Missing facts and unsupported mechanics are explicit, recorded uncertainty, never silent defaults.
- Development data is disposable during pre-alpha. Reset and reseed rather than writing migrations.
- Do not deploy to Convex Cloud or Cloudflare, and do not publish anything externally, without an
  explicit user instruction in the current thread.

## Verification and honesty

- Report what was tested, with output. A response message from a mutation is not evidence; read the
  persisted state back through the application and compare before and after.
- Do not claim a feature is implemented without evidence in this checkout. Specifications, mockups, and
  scope acceptance are not implementation.
- Expected outcomes in tests must come from the source, not from running the code under test.
