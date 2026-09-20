# Development process

The [build process](build/README.md) owns slices, review and merge; the
[roadmap](v1-roadmap.md) owns track scope. This file keeps the standing development principles.

## Keep the process small

This is a hobby project. Working, understandable behavior is the unit of progress. Previous attempts
failed through both fabricated rules and excessive process. Do not build approval queues, terminology
bans, source-hash proof systems, certificates or governance frameworks. A source-linked fixture, an
implementation and meaningful outcome checks are the normal rules-work artifact. A source link says
where to look; it does not prove the implementation is correct.

## Confirmed pre-alpha development policy

Development data is disposable. Keeping the latest application live and playable outranks carrying
test characters, campaigns and histories across breaking updates: reset and reseed instead of
migrating. Ordinary saving, reload and recorded-state history remain part of the running app.
Pinned rules and Forge Steel dependencies still update only deliberately.

## Headless development workflow

Agents exercise the engine and the app's game operations without a visual UI, through the same
shared operations a client invokes. A scenario record is compact and replayable: source content and
revision, initial state, actions, choices and dice inputs, outputs, resulting state. Check two things:
interpretation (did parsing and resolution produce the effects the Compendium context expects,
established independently of the implementation) and application (did those effects change the
character or monster through the real application path, read back and compared before and after).
History navigation belongs here too: stepping backward and forward restores recorded states without
rerunning rules or dice, and closed sessions stay read-only.

## Verification strategy

Expected outcomes come from the source, never from invoking the implementation under test. For
consequential rules changes verify boundaries, missing facts, effect sequencing and persisted state,
not only the happy path. Shared-state changes exercise permissions, duplicate commands and reconnect.
Content availability and behavior support are tracked separately: a readable ability description does
not mean the engine resolves it; parser and runtime diagnostics report supported and unsupported cases.

## Rules-review workflow accepted for trial

Recorded 2026-09-11, still the shape of rules work: a researcher establishes source-backed behavior
before implementation; a fresh-context reviewer checks the resulting diff and tests against the pinned
Compendium afterwards, returning `pass`, `changes required` or `decision required`. The user's rulings
apply to their original cases only and set no precedent; explicitly declared standing policies (the
save-phase order, the resource-affordability block, the prior-turn history lock) keep the scope the
user gave them. See [rules adaptation principles](rules-adaptation-principles.md) and the
[gameplay decision record](gameplay-decision-record.md).
