# V94 Forge witness adapter

The four inputs in `tests/fixtures/v94-tactician-expected.json` are rebuilt with unchanged
pinned Forge definitions by `scripts/forge/tactician-witnesses.ts`. The builder reads only
selections, never expected results. The existing approved Grug culture/career input is reused;
Human ancestry, Tactician class, doctrine, characteristics, skills, two kits, heroic choices and
Soldier languages are filled explicitly. The vendor pin stays
`5a846aadb623a9855a023e9403bb887a956c341f`.

TESTER executes the existing build/run flow with `SALIENT_FORGE_FAMILY=tactician` and a retained
`SALIENT_FORGE_OUTPUT` directory: `node scripts/forge/build.mjs`, followed by
`node "$SALIENT_FORGE_OUTPUT/forge-run.mjs"`. This authoring handoff has not executed either command.
The runner writes raw `counterparts.json` and a `summary.json` comparison report.

Two precisely bounded differences are expected from inspecting the pinned Forge source:

- `src/logic/hero-logic.ts`, `getStamina`, takes the maximum kit Stamina. Witness 2 instead
  chooses Martial Artist's +3 under Field Arsenal. Source values are Stamina 24, Recovery 8,
  winded 12; Forge must return exactly 30, 10, 15. Every other compared baseline value must agree.
- `src/data/classes/tactician/tactician.ts` exposes `Mark: Trigger` separately from `Mark`.
  It represents the 1-Focus free triggered effect in the Compendium Mark body's final paragraphs.
  The runner requires exactly this additional ability; it does not drop arbitrary extra abilities.

Names normalize typography, case and diacritics. These differences remain visible in the report;
raw outputs and vendor definitions are never rewritten. All four counterparts must be complete
under the existing choice validator. Forge does not prove Salient's per-benefit choice or signature
replacement behavior. Compare saved Salient readbacks to the independent Compendium ledger for
those values; the generic raw-Forge equality runner will correctly reject witness 2's baseline
and the different action packaging. Embedded Mark actions and Studied Commander's activity remain
explicit source obligations in the ledger; this adapter does not certify their delivery.

Authoring checks: targeted ESLint passed (exit 0); Prettier applied to the adapter and ledger.
Forge execution, full checks, and public readback are pending TESTER.
