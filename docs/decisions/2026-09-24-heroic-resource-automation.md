# Automatic heroic-resource generation for V1: confirmed 2026-09-24

The user confirmed in the ENGINE2 thread on 2026-09-24 that automatic resource generation for every
class is "a huge benefit and definitely wanted for V1". It is central to play, so it must be
handled with extra care: **every class gets its own implementation and its own independent
review**.

This supersedes, for V1, the v0.01 deferral of class-specific resource generation
(`docs/pre-alpha-design-gaps.md`, "Defer unique feature execution", and the 2026-09-14 reversal of
automatic turn-start Ferocity). It does not settle any individual rule. Each class's gains, triggers,
limits and resets come from the pinned Compendium, with ambiguities recorded as questions and left
manual.

Delivery:
- **V120** is the shared engine: the combat-start grant, turn-start gains, triggered gains the app
  can observe, per-round and per-turn limits, and history and correction behaviour, with a source
  ledger for each class.
- **V140–V150**, one per class (V121–V139 are in use by other threads):
  - Censor, Conduit, Elementalist, Fury, Null, Shadow, Tactician, Talent and Troubadour;
  - Beastheart and Summoner, whose companions and minions are not yet app actors.

  Each slice has its own implementation, its own independent rules review, TESTER proof, the
  second-round review, and deployment. Manual editing of every resource stays available.
