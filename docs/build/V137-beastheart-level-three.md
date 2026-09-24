# V137: Beastheart levels two and three

Rules review: required. Depends on: V106, V117.

## Goal

Build and edit a Beastheart of every wild nature, with each companion, at target level two or three
through the full wizard and shared API. Companion combat stays manual, as in V106. Guided advancement
remains deferred.

## Scope

- [Decision system](../character-wizard-spec.md#3-decision-system) and
  [wizard flows](../character-wizard-spec.md#4-wizard-flows): cumulative target-level choices.
- Q-CHAR-14 includes Beastheart through levels 1–10; the supplement's admission filter now takes
  `feature/(ability/)beastheart/level-2` and `level-3` and companion level-3 features.
- Pinned `en/unified/md/class/beastheart.md`, Basics: +12 Stamina at levels 2 and 3 (shared class-profile
  growth); 12 Recoveries; the companion's Stamina maximum equals yours (`companion-rules.md`).
- `feature/beastheart/level-2/`: Everyone's Best Friend; one exploration, interpersonal or intrigue perk;
  the wild nature feature (Guardian Watchdog, Prowler Supersniffer, Punisher This One's Yours with its
  triggered action, Spark Stormheart); the nature ability pair, taken from each ability file's `subclass:`
  frontmatter because the unified file prints empty per-nature lists: Fetch! / Omnomnom; Jump Scare / On
  You Like Your Shadow; Foe Bowling / One Roar and We're Back In the Fight; Burning Lash / Howling Gale.
- `feature/beastheart/level-3/`: each companion's stat block level-3 advancement feature (14 species);
  7-Ferocity: Death and Violence, Head to Head, Jaws of Death, Shieldbreaker.
- Records follow V106's performer rule (`companion-rules.md`: the Companion keyword means only the
  companion; the Beastheart keyword only you): the eight nature abilities are Companion records, the four
  7-Ferocity abilities Beastheart records, This One's Yours both, each printed spend option its own record,
  Everyone's Best Friend and each species level-3 feature Companion records. Watchdog, Supersniffer and
  Stormheart are passive features without records. Every record pays its printed Ferocity and is recorded
  for manual resolution; no companion actor, damage, conditions or Rampage automation is claimed.

## Acceptance checks

1. Independent source ledger `tests/fixtures/v137-beastheart-three-expected.json` extends the fourteen
   V106 witnesses (every companion and nature, both abilities of each nature, all four 7-Ferocity
   abilities). Focused engine test checks vitals, new features, perk pool, every new record name and
   Ferocity cost, foreign-pool rejection and level/companion pruning.
2. Authenticated `beastheart-level-three` headless cohort: fourteen level-3 builds, draft resume and save,
   owner-only level transition, lower to 2 and back, and all 32 new records with Ferocity payment,
   blocked second paid use and unchanged target state.
3. Test-support runs `CI=true pnpm check`; Test-Deploy runs the isolated cohort and publishes.

## Work log

- Started from main `693280c` on `slice/V137`, `.worktrees/beastheart-three`, with empty `vendor/*`.
- Ledger written by an isolated subagent from the canonical Compendium only: +12 Stamina per level, no
  other numeric change; performers decided by the Companion/Beastheart keywords. Its interpretations
  (nature pairs from frontmatter; This One's Yours outside the Punisher choice; Burning Lash's spend kept
  with its companion parent; passive features without records) are recorded in the ledger.
- Author checks: both TypeScript projects and ESLint pass; focused V137, V106, V45 and V32 engine files
  pass; V88 audit guard and live compiled report 34/34. Content 1788 entries; `compiled:check`,
  `content:check`, `supporting:check`, links pass.
- Independent rules/implementation review (subagent, source-only) of `07354e7`: CHANGES REQUIRED, one
  blocking finding: the cohort looked for plain 7-Ferocity names, but Beastheart sheets list the named
  "Beastheart: …" records. Fixed on both checks. Non-blocking, also fixed: the cohort now compares the
  whole target and actor live state (apart from Ferocity) and the manual effect text as V106 did, and
  checks the species level-3 feature; the engine test asserts companion Stamina and winded against the
  ledger; the fourteen companion advancement decisions have wizard labels; the Burning Lash spend text
  says who wields the second whip is a manual interpretation.
