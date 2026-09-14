# R05: Conditions, clock and Malice common lifecycle

| Field | Value |
| --- | --- |
| Family | R |
| Milestone | v0.01 |
| Owner type | Rules team |
| Rules review | required |
| Depends on | None |
| Unblocks | A04, A03 |
| Status | see `STATUS.md` |

## Goal

Enumerate the core conditions the v0.01 toggle list must show, state what the source says each does
(readable text, not automation), and write the sourced contract for the turn/round clock and the
common Malice lifecycle that A04 implements. Also record which scheduled work can actually exist in
v0.01 so that the automatic save-ends path is either exercised honestly or explicitly dormant.

## Spec references

- `docs/table-spec.md#v001-manual-condition-tracking` — one toggle per core condition; manual saves.
- `docs/table-spec.md#game-clock-and-scheduled-rules-work` — enqueue order, saves last, once per turn.
- `docs/table-spec.md#initiative-groups-confirmed-app-model` — turn entries, groups, rounds.
- `docs/table-spec.md#taking-a-turn`, `#player-sheet-actions-and-explicit-end-turn`
- `docs/table-spec.md#malice-visibility` and the common Malice lifecycle paragraphs in
  `docs/pre-alpha-design-gaps.md#game-basics-first--current-runtime-scope`
- `docs/table-command-spec.md#clock-driven-operations`
- `docs/rules-questions-for-user.md` Q-TS-1 (automatic save-ends in v0.01).

## In scope

- Core condition list with source path per condition and the verbatim effect text, plus whether the
  source defines a save-ends default. No automation of effects in v0.01; the list feeds the toggles and
  the readable text.
- Clock contract: what a turn boundary is, what a round boundary is, the order of due work at each,
  save rolls last, one firing per actual turn, and the statement that in v0.01 the only producers of
  scheduled work are the common Malice lifecycle and any source-backed operation that A04 or A05
  registers. Q-TS-1 is answered: no save-ends roll is automatic in v0.01, so the contract states that the
  automatic path is V1 behavior with no v0.01 producer.
- Malice: how the Director's Malice pool starts and grows each round per the source, what "common
  lifecycle" covers, and which parts are manual (spending on abilities is manual in v0.01 unless a
  known fixed Malice cost is supplied).
- Surprise and the starting side choice: what the source says, to confirm the opening contract.
- Combat round and end-of-turn definitions used by the opening and turn slices.
- Worked example: two rounds with one hero and one foe, listing the clock events in order.

## Out of scope

- Ability-driven condition application or expiry (parser support, V05).
- Minions, captains, villain actions, bosses (V02, V03).
- Implementation (A04).

## Inputs and dependencies

None. Pinned Compendium only.

## Deliverables

- `docs/conditions-and-clock.md` — the list, the clock contract, the Malice lifecycle, the example.
- `shared/content/core-conditions.json` — id, name, source path, verbatim text.
- `shared/contracts/clock.ts` — types for scheduled work registration and dispatch, no logic.
- Implementation notes in the table-spec sections above.
- `rules` commit.

## Acceptance checks

1. Every condition in the JSON file has a source file that exists and text that matches it verbatim.
2. The clock contract's ordering rule quotes the user's standing policy and the source's end-of-turn
   definition.
3. The Malice growth rule quotes the source.
4. The worked example's event order is derivable by hand from the contract.
5. The document states in one sentence that v0.01 has no automatic save producer, citing the Q-TS-1
   answer of 2026-09-14.
6. Reviewer confirms all citations.

## Rules research

- `vendor/steel-compendium/en/unified/md/condition/*.md`
- `vendor/steel-compendium/en/unified/md/rule/combat/condition.md`, `combat-round.md`, `turn.md`,
  `end-of-turn.md`, `surprised.md`, `side.md`
- `vendor/steel-compendium/en/unified/md/rule/general/saving-throw.md`
- `vendor/steel-compendium/en/unified/md/rule/monster/malice.md`
- `vendor/steel-compendium/en/unified/md/chapter/combat.md`, `monster-basics.md`

## Open questions

- None. Q-TS-1 was answered 2026-09-14 (no automatic save-ends in v0.01).

## Work log

**Plan, 2026-09-14 (rules researcher, branch `slice/R05`).** Read `CLAUDE.md`, `agent.MD`,
`docs/build/README.md`, this document, `docs/compendium-navigation.md`, every cited spec section, Q-TS-1,
and every Compendium file in the research list (all exist at pin `fb83a789da8f0327a389c277a0c790b1648d5810`).
Files to add: `docs/conditions-and-clock.md`, `shared/content/core-conditions.json` (generated from the
source files so the text is byte-exact), `shared/contracts/clock.ts` (types only, added to
`tsconfig.json` include), `tests/core-conditions.test.ts` (acceptance check 1 under the existing
`node --test` runner). Files to edit: dated implementation notes in the six cited `docs/table-spec.md`
sections and `docs/table-command-spec.md#clock-driven-operations`; new questions `Q-R-50` to `Q-R-52` in
`docs/rules-questions-for-user.md` (numbered from 50 to avoid colliding with R04). No dependencies, no
fixtures, no application code. Existing rulings (standing clock policy, once per actual turn, Q-TS-1) are
applied, not re-decided.

**Closing entry, 2026-09-14 (rules researcher).** Delivered `docs/conditions-and-clock.md`,
`shared/content/core-conditions.json`, `shared/contracts/clock.ts`, `tests/core-conditions.test.ts`,
seven dated implementation notes (`docs/table-spec.md`: Malice visibility, v0.01 manual condition
tracking, initiative groups, Taking a turn, Player-sheet actions and explicit End turn, Game clock;
`docs/table-command-spec.md`: Clock-driven operations), and questions Q-R-50 to Q-R-52. Nothing under
`vendor/` changed; submodule pins unchanged (`fb83a789…`, `5a846aad…`). `STATUS.md` left for the lead.

Acceptance checks:

1. *Every JSON entry has an existing source file and verbatim text.* `node --test tests/core-conditions.test.ts`:
   11 tests, 11 pass, 0 fail (index lists exactly nine; revision recorded; per condition: file exists,
   name/scc/type match the frontmatter, `text` is found in the body and equals the trimmed body, no
   "(save ends)" clause in any entry). The JSON was generated from the source files, not typed.
2. *Ordering rule quotes the standing policy and the source's end-of-turn definition.*
   `docs/conditions-and-clock.md` section 2.3 quotes the standing clock policy from `agent.MD` and the
   once-per-actual-turn ruling; section 2.1 quotes `rule/general/saving-throw.md` ("at the end of each of
   their turns") and `rule/combat/end-of-turn.md`.
3. *Malice growth rule quotes the source.* Section 3.1 quotes `rule/monster/malice.md` Earning Malice in
   full, plus the spending and visibility sentences.
4. *Worked example derivable by hand.* Section 5: 18 events, pool 0 → 0 → 2 → 5, save phases empty; the
   derivation paragraph shows each number from sections 2 and 3 and matches the fixture arithmetic in
   `docs/fury-goblin-automation.md#malice-lifecycle`.
5. *One sentence, no automatic save producer, citing Q-TS-1 of 2026-09-14.* Section 2.4, bold sentence.
6. *Reviewer confirms all citations.* Pending rules review.

Verification run (pnpm's pre-run dependency check aborts in this worktree because `node_modules` is a
symlink and there is no TTY, so the commands the `check` scripts wrap were run directly):
`npx tsc --noEmit` (clean, `shared/contracts/*.ts` now in the include list);
`node --test tests/*.test.ts` (39 pass, 0 fail); `npx tsc -p tsconfig.web.json && npx vitest run`
(6 files, 26 pass); `npx vite build` (built). Every `Spec:` anchor and every implementation-note link
was checked to resolve to a heading in the current checkout.

Source gaps recorded, provisional defaults stated in the contract: Q-R-50 (which heroes count for the
round gain without hero-death automation), Q-R-51 (fractional average Victories), Q-R-52 (creature added
mid-round). Interpretations, labeled in the document: round ends when no unspent entry remains among
current participants; turn-end work precedes round-end which precedes the next round-start; combat-start
grant fires at OK after the baseline snapshot and the round-one gain at the starting-side announcement.
Proposal for A04: register surprise expiry at the end of round 1 from the setup card's Surprised flags.

What remains: independent review, rules review of the citations, lead merge, and the A04 implementation
of dispatch against `shared/contracts/clock.ts`.
