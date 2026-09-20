# V64 coverage audit review

Reviewer: independent review subagent (Claude Fable 5.1), not the implementer. Date: 2026-09-20.

Scope: branch `slice/V64-ability-coverage-audit` at `87e4672` (one commit on top of `b8eec27`) in
`.worktrees/engine-audit`, read-only. Files reviewed: `scripts/audit-ability-grammar.ts`,
`tests/scripts/audit-ability-grammar.test.ts`, `docs/build/V64-ability-coverage-audit.md`, the
`STATUS.md` row, `package.json`, and the generated `docs/build/evidence/V26/coverage-audit-2026-09-20/`
report pair, against `docs/build/V26-compiled-ability-effects.md` ("Proposed implementation contract"
section 1, "Affected-ability audit — 2026-09-16"), `docs/build/README.md` (test value policy, headless
completion gate) and the runtime modules whose logic the script copies. Rules research used only the
pinned local Compendium (`vendor/steel-compendium` at `fb83a789`, confirmed by `git submodule status`);
nothing was searched online.

## Verdict: PASS

No blocking findings. Six non-blocking findings below; one of them (the `STATUS.md` row has an extra
table cell) is a one-cell fix the lead should apply at integration.

## Blocking findings

None.

## Non-blocking findings

1. **`STATUS.md` row has five cells in a four-column table.** `docs/build/STATUS.md:158` ends with
   `| Engine and parser thread |`; the table header at line 135 and the neighbouring V26 row have four
   columns (`awk -F'|'` count: V26 row 4, V64 row 5). Drop the trailing cell or fold the owner into
   the status cell. Trivial; fix at integration.
2. **Damage grammar is slightly wider than the runtime's "current" expressions, with no content
   impact.** V26 section 1 says "supported current damage expressions". The runtime
   (`shared/resolve/index.ts:133-135`, `DAMAGE_CLAUSE`) accepts only `N`, `N + C`, `N + C or C`
   (typed or `untyped`). The script's `damageExpression` (`scripts/audit-ability-grammar.ts:394-437`)
   additionally accepts `C + N`, bare `C` and `C or C`, lowercase single letters and `[M]` bracket
   forms, and does not accept `untyped`. The slice doc discloses the `C + N` / `C` forms explicitly
   (work log, "the grammar follows V26 section 1 exactly: supported damage expressions are ..."), so
   this is not silent, but it is not the runtime's grammar either. Measured impact on the committed
   report: zero. `grep -c '"constant": 0' report.json` = 0; no tier text in `ability.json`,
   `kit.json` or `foes/catalog.json` matches `C + N`, bare `C ... damage`, `[M]` or `untyped damage`.
   Recommendation: either narrow to the runtime's `DAMAGE_CLAUSE` shape or state in the script header
   that the audit grammar is a superset of the current runtime grammar and why.
3. **Roll expression accepts single-letter characteristics the runtime does not.** `NAMES`
   (`scripts/audit-ability-grammar.ts:366-377`) includes `m/a/r/i/p`; the runtime `rollEntry`
   (`convex/lib/resolve.ts:102-125`) maps full names only. No content instance (`"roll"` values are
   `Power Roll + <integer>`, `+ highest characteristic`, or full linked names). Same recommendation as
   finding 2.
4. **Tier clause trailing period is stripped before matching; the runtime does not strip it.**
   `classify` (`scripts/audit-ability-grammar.ts:568-570`) removes a trailing `.` from each clause; the
   runtime `parseTierText` (`shared/resolve/index.ts:146-150`) does not. Twelve content tiers end in
   `damage.` but all are prose ("The adjudicator halves the triggering damage.") that fails both
   grammars, so no classification changes. Document or align.
5. **Slice doc says the branch was cut "from main `0f47e89`"; the commit's parent is `b8eec27`.**
   `git rev-parse HEAD~1` = `b8eec27`. Harmless (probably rebased after the doc line was written), but
   the work log should state the actual base. Note also that `main` has since advanced to `5956331`
   (docs-only V24), so the lead's rebase will be onto that.
6. **`check-commit --merge` fails only for the missing `Reviewed-By:` trailer**, which this review
   supplies. The slice doc's verification section lists `git diff --cached --check` but not the commit
   checker; the Chords update said "check-commit" ran. Either way the only rejection is the expected
   pre-review trailer.

Observation, not a finding: `Bear Claws` is reported `not-granted`. That is literally correct (no
wizard decision references it: `supporting-backgrounds.ts:1776-1791` creates
`kit.<name>.contributions` only for `ORDINARY_KIT_NAMES`, and Boren is a `STORMWIGHT_KIT_NAMES` entry),
though a reader might expect `not-selectable` because Boren exists as an unsupported `kit.choice`
option. The report's own legend defines `not-granted` as "no wizard decision references the entry", so
the value matches the legend.

## Review questions

### 1. Grammar fidelity

Implements V26 section 1 as written, with the widenings in findings 2-4 (no content impact):

- One power roll: `classify` fails with `multiple-power-rolls` when more than one roll block exists
  (`:539-549`) and records each extra roll as a `second-roll` diagnostic; zero rolls fail with
  `no-power-roll` / `tiers-without-power-roll` (`:527-537`).
- Three tiers: each of `tiers[0..2]` is parsed; an empty tier fails `tierN-missing` (`:571-576`).
- Damage expression: first `;`-clause must match `damageExpression`; otherwise `tierN-damage-outside-grammar`
  and every remaining clause is still typed (`:577-592`). Damage type is the optional word before
  `damage` from the fixed list `acid|cold|corruption|fire|holy|lightning|poison|psychic|sonic`
  (`:378-389`); a second damage component in the same clause (Bluster: `5 damage, 4 lightning damage`)
  correctly fails.
- `push N` only directly after damage: `typeTierClause(clause, locator, i === 0)` (`:597-601`) passes
  `afterDamage` only for the clause immediately after the damage clause; `^push \d+$` returns `null`
  (compiled) only then, otherwise `push-with-extra` with shape suffix `(not directly after damage)`
  (`:474-483`). Any `push` with extra words is `push-with-extra`.
- Bounded potency remainder: regex `^([MARIP]) < (-?\d+|WEAK|AVERAGE|STRONG),? (.+)$` and
  `bounded = afterDamage && /^(bleeding|slowed) \(save ends\)$/` (`:462-473`) is exactly V26's
  "characteristic letter, `<`, a signed integer or symbolic WEAK/AVERAGE/STRONG, an optional comma,
  then bleeding or slowed and (save ends)", positioned after damage. `withinV26Bounded` requires
  every diagnostic to be such a clause (`:675-677`). (`-?\d+` does not accept an explicit `+N`; no
  content instance.)
- Nothing is evaluated as JavaScript: `grep -n "eval(\|new Function\|vm\.\|require("` returns
  nothing; the script uses only regexes, `Number()` on digit strings and JSON parsing.

### 2. Source coverage honesty (six abilities read in `shared/content` and `vendor/steel-compendium`)

| Ability | Report | Source read | Agree |
| --- | --- | --- | --- |
| Brutal Slam (hero standalone) | COMPILES, roll `[M]`, tiers 3/6/9 + M, push 1/2/4, single, selectable | `en/unified/md/feature/ability/fury/level-1/brutal-slam.md`: `Power Roll + Might`, `3 + M damage; push 1` / `6 + M` push 2 / `9 + M` push 4, target One creature or object, no Effect | yes |
| Wrecking Ball (hero standalone) | NO_MATCH `tier1-damage-outside-grammar`; diagnostics effect-paragraph + `tier:push N` x3; selectable via `class.fury.level-2.aspect-ability@2` | `.../fury/level-2/wrecking-ball.md` and `ability.json` structured: Effect paragraph, `Power Roll + Might`, tiers `Push 1/2/3`, target Self; `classes/fury/level-two.ts:90-101` offers it with `supportedInV001: true`, `abilityKind: 'heroic'` | yes |
| Impaled! (hero standalone; extra) | COMPILES_WITH_REMAINDER, `potency:M < SYM grabbed` x3 unbounded, target `unknown`, not-selectable | `.../fury/level-1/impaled.md`: `2/5/7 + M damage; M < WEAK/AVERAGE/STRONG, grabbed`, target "One creature of your size or smaller"; `fury-level-one-decisions.json:1517-1522` `supportedInV001: false` | yes (matches V26 audit text on the restricted target) |
| Pain for Pain (kit signature) | COMPILES_WITH_REMAINDER, roll `[M,A]`, tiers 3/5/13 + M or A, one `effect-paragraph`, selectable x2 | `en/unified/md/kit/mountain.md` `###### Pain for Pain`: `Power Roll + Might or Agility`, `3 + M or A damage` / 5 / 13, conditional Effect, target One creature | yes |
| Exploding Arrow (kit signature) | NO_MATCH `roll-expression-outside-grammar`; tier shape `N + a, r, i, or p fire damage` | `kit/arcane-archer.md`: `Power Roll + Agility, Reason, Intuition, or Presence`, `5 + A, R, I, or P fire damage` ... plus Effect | yes (four-way choice is outside "N + C or C") |
| Two Shot (kit signature; extra) | COMPILES, flat 4/6/8, target multi, selectable | `kit/rapid-fire.md`: `Power Roll + Might or Agility`, `4/6/8 damage`, Two creatures or objects, no Effect | yes |
| Spear Charge, Goblin Warrior (foe) | COMPILES, fixed +2, flat 3/4/5, single | `catalog.json` fields and `en/unified/md/monster/goblin/statblock/goblin-warrior.md:31-41`: `Power Roll + 2`, `3/4/5 damage`, One creature or object | yes |
| Bluster, Essence of Storms (foe) | NO_MATCH `tier2-damage-outside-grammar` | `essence-of-storms.md:32-44`: tier 2 `5 damage, 4 lightning damage; push 1` (two damage components; V26: "Multiple damage components ... are unsupported") | yes |
| Noxious Bubble, Angulotl Wave (foe) | NO_MATCH `tiers-without-power-roll` | `angulotl-wave.md:47-57`: Effect says enemies make a **Might test**, then three tier lines with no `Power Roll +` header; catalog record has `tier1..3` with `effect` and no `roll` | yes |

No disagreements. (Nine read rather than six; at least one COMPILES and two NO_MATCH per corpus type
requested are covered.) The V26 inventory table's 13 rows also agree with the classifier as reported.

### 3. Determinism

Ran `node scripts/audit-ability-grammar.ts` under a temporary `node_modules` symlink to the main
checkout (removed afterwards; `git status --short` clean, `ls node_modules` absent):

```
--- md5 before
a30f0130dfa341aeda2b6d0f43f936dd  report.md
d016c77fa85705b45906b7ab8cd379a6  report.json
hero-standalone: total 52, COMPILES 8, COMPILES_WITH_REMAINDER 22, NO_MATCH 22
kit-signature: total 25, COMPILES 2, COMPILES_WITH_REMAINDER 19, NO_MATCH 4
granted: total 15, COMPILES 1, COMPILES_WITH_REMAINDER 2, NO_MATCH 12
foe-ability: total 1158, COMPILES 20, COMPILES_WITH_REMAINDER 566, NO_MATCH 572
malice: total 14, COMPILES 0, COMPILES_WITH_REMAINDER 13, NO_MATCH 1
--- md5 after
a30f0130dfa341aeda2b6d0f43f936dd  report.md
d016c77fa85705b45906b7ab8cd379a6  report.json
--- git status
?? node_modules        (the temporary symlink only; clean after removal)
```

Byte-identical to the committed files and to the md5 values in the slice doc. Corpus sizes
independently confirmed from the inputs: `ability.json` 52 entries, `kit.json` 25, catalog
`kind === 'ability'` 1158, catalog `kind === 'malice'` with `Power Roll +` 14.

### 4. Tests

`node_modules/.bin/vitest run tests/scripts/audit-ability-grammar.test.ts`: `Test Files 1 passed,
Tests 12 passed`, 887 ms.

Test value assessment (each names a distinct failure; expected values checked against the source):

| Test | Failure it catches | Expected values verified in source | Verdict |
| --- | --- | --- | --- |
| Brutal Slam | trailing `push N` reported as remainder or dropped | brutal-slam.md 3/6/9 + M, push 1/2/4 | keep |
| Thunder Roar | Effect section ignored -> COMPILES; area shape | thunder-roar.md 6/9/13, push 2/4/6, Effect | keep (distinct: area + section remainder) |
| Bury the Point | numeric potency clause rejected or not flagged bounded; fixed +2 | goblin-warrior.md:43-53 | keep |
| Spear Charge | fixed monster bonus misread | goblin-warrior.md:31-41 | keep (only fixed-bonus COMPILES case) |
| Blade of the Gol King | unbounded potency tail accepted as bounded; Malice spend dropped; multi target | catalog: 16/22/26, `1+ Malice`, Two creatures | keep |
| Lines of Force | Effect-only ability compiled; sections not retained | ability.json: trigger, Effect, `Spend 1 Ferocity` | keep |
| No Escape | second roll dropped (as runtime `effectsOf` would) | catalog: two `Power Roll + 3` blocks | keep (the only multi-roll case) |
| Knockback | push-only tier accepted | knockback.md `Push 1/2/3` | keep |
| Pain for Pain | kit section not extracted; choice expression rejected; kit grant path missed | mountain.md; two `kit.mountain.contributions` grants | keep |
| Ray of Agonizing Self-Reflection | symbolic threshold / comma form rejected; a live grant invented | ray-...md; no grant in content | keep |
| appended paragraph / contradicted tier | structured record trusted alone (V26 check 5) | mutation of Brutal Slam source | keep |
| two-run determinism | nondeterministic ordering; also asserts foe total 1158 | 1158 = catalog `kind === 'ability'` count, source-derived | keep |

No redundant or implementation-mirroring test found. No expected value was taken from running the
classifier: every number and category in the assertions matches the quoted source text read above.
Minor: the Brutal Slam and Spear Charge tests overlap on "flat/characteristic damage compiles" but differ
on roll kind (characteristic vs fixed bonus) and corpus (hero vs foe reader), which are distinct failure
modes; not consolidated.

### 5. Wizard availability derivation

Three entries checked against the wizard content modules:

- **Impaled!** reported `not-selectable` via `class.fury.signature-ability@1/@2`, detail
  `supportedInV001=false; chain selectable`. `shared/content/classes/fury/level-one.ts:315-320` and
  `fury-level-one-decisions.json:1517-1522`: `supportedInV001: false`. Sound.
- **Back!** reported `not-selectable` via `class.fury.ability-3`. `fury-level-one-decisions.json:1545-1550`:
  `supportedInV001: false`, decision `availableWhen class.choice = Fury`. Sound.
- **Explosive Assistance** reported `selectable` (NO_MATCH, no power roll).
  `classes/elementalist/level-one.ts:135-150`: `option('Fire', ...)` with an `aspect-ability` grant;
  `decision-builders.ts:6-16` defaults `supportedInV001: true`. Sound.
- **Wrecking Ball** (extra) reported `selectable` via `class.fury.level-2.aspect-ability@2` only:
  `classes/fury/level-two.ts:90-101`, level-2 decision with `supportedInV001: true`. Sound, and it
  correctly appears only for level 2.

Method (`wizardGrants`, `:836-969`) walks every decision's options and grants, combines
`reachability` (conditions and `availableWhen` parents checked with a copy of
`shared/evaluate/structure.ts#isSupported`) with the option's own `supportedInV001`, and returns
`unknown` for pool-restricted decisions. The hard-coded `FURY_ABILITY_DECISIONS` list is needed because
the Fury level-1 ability options carry no `abilityKind` (unlike Elementalist's and Fury level 2); only
`fury` and `elementalist` exist under `shared/content/classes`, so nothing is currently missed, but a
future class with `abilityKind`-less options would be reported `not-granted`. Worth a comment in the
script; not a defect today.

### 6. Copied runtime logic

| Copy | Original | Divergence |
| --- | --- | --- |
| `plain` (`:36-42`) | `shared/resolve/index.ts:124-130` `plainText` | Identical. |
| Tier splitting (`:568-570`) | `shared/resolve/index.ts:146-150` | Same `split(';')` + trim; the copy additionally strips a trailing `.` (finding 4). No content effect. |
| `blocksFromStructured` (`:292-345`) | `convex/lib/resolve.ts:166-184` `effectsOf` | Intentional, documented: keeps every roll block (runtime keeps the first only); keeps the `effect` sentence of a record that also has a `roll` (runtime drops it); emits a `tiers` block for `tier1` without `roll` (runtime drops such a record entirely unless it has `effect`); labels nameless, costless entries `Paragraph` (runtime labels them `Effect`); adds a `Trigger` section from the `trigger` field. Every divergence is in the conservative direction for an audit (more text retained, never less). |
| `headedEnvelope`/`kitEnvelope` (`:718-750`) | `convex/lib/resolve.ts:265-305` `abilityFromKit` | Same marker/table/target extraction; when the `######` marker is missing the copy uses an empty section where the runtime falls back to the whole entry text (copy is stricter); tiers/sections come from the shared Markdown reader instead of `startsWith('- ≤11:')` / `**Effect:**` line scans, so non-Effect sections (Trigger, Spend) are also retained. All 25 kits resolve one heading each (25 kit-signature envelopes = 25 kit entries). |
| `targetShapeOf` (`:512-527`) | `convex/lib/resolve.ts:141-159` | Identical logic; returns the kind string instead of the object. |
| `rollExpression` (`:383-394`) | `convex/lib/resolve.ts:111-125` `rollEntry` | Returns `undefined` instead of `{ permitted: [] }` on failure (both mean "not a supported roll"); accepts single letters and `[..]` (finding 3). |
| `isSupported` (`:803-810`) | `shared/evaluate/structure.ts:341-347` | Identical (one type cast for `supportedSetInV001`). |

### 7. Docs and checks

- `git diff --check`: clean.
- `node scripts/check-commit.ts --merge --range main..HEAD`: rejects `87e4672` only for
  "Missing `Reviewed-By:` trailer" (expected before review; finding 6). `Slice:`, four `Spec:` and
  `Verified:` trailers present.
- `node scripts/check-links.ts` (under the temporary symlink): "17 broken link(s) in 270 Markdown
  files"; every broken link is `vendor/forge-steel/...` because that submodule is empty in this
  worktree (`ls -A vendor/forge-steel | wc -l` = 0); the main checkout has it populated. No link in
  the V64 files is broken. This matches the slice doc's note that forge-steel was linked temporarily
  for the implementer's run.
- `STATUS.md` row: present at line 158, status "In review ... not merged; no runtime impact" is
  accurate; column count wrong (finding 1).
- Slice doc claims vs what ran: totals, md5 values, 12 passing tests and the two-run determinism
  match my runs exactly. "Not run here: `pnpm check`, `pnpm build`, browser tests" is stated honestly;
  the headless completion gate does not apply (no UI capability, no backend, no runtime change; the
  commit touches only `scripts/`, `tests/scripts/`, `package.json`, docs and evidence). Base-commit
  wording is off (finding 5).
- Vendor pins: `git submodule status` shows `fb83a789...` (steel-compendium) and `-5a846aad...`
  (forge-steel, uninitialised); neither pin changed in the commit.

## What I ran

```
git status --short; git log --oneline -3; git show HEAD --stat
git rev-parse main HEAD~1 HEAD            # 5956331 / b8eec27 / 87e4672
git submodule status
ln -s /srv/presidium/projects/salient/code/node_modules node_modules
md5sum report.md report.json; node scripts/audit-ability-grammar.ts; md5sum ...   # identical
node_modules/.bin/vitest run tests/scripts/audit-ability-grammar.test.ts          # 12 passed
node scripts/check-links.ts                                                       # 17 forge-steel-only
rm node_modules; git status --short                                               # clean
git diff --check                                                                  # clean
node scripts/check-commit.ts --merge --range main..HEAD                           # Reviewed-By missing only
grep -n "eval(\|new Function\|vm\.\|require(" scripts/audit-ability-grammar.ts    # none
node -e '...'  # report.json extraction for the nine abilities; catalog/ability/kit counts
sed/awk/grep over vendor/steel-compendium/en/unified/md/{feature,kit,monster}/... and shared/content
```

Reviewed-By: independent review subagent (Claude Fable 5.1), 2026-09-20 — PASS
